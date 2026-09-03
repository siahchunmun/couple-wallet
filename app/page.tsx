import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import CoupleOutstanding from "@/components/couple-outstanding";
import DashboardInsights from "@/components/dashboard-insights";
import WalletGoalOverview from "@/components/wallet-goal-overview";
import DashboardRecurringAlerts from "@/components/dashboard-recurring-alerts";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getMalaysiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatTransactionDate(date: string) {
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(
    new Date(`${date}T00:00:00+08:00`)
  );
}

type HomePageProps = {
  searchParams: Promise<{
    wallet?: string;
  }>;
};

export default async function Home({
  searchParams,
}: HomePageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  // =========================================
  // Current User
  // =========================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "there";

  // =========================================
  // Wallets
  // =========================================

  const {
    data: wallets,
    error: walletError,
  } = await supabase
    .from("wallets")
    .select(`
      id,
      name,
      wallet_type,
      currency,
      status
    `)
    .eq("status", "active")
    .order("created_at", {
      ascending: true,
    });

  if (walletError) {
    throw new Error(walletError.message);
  }

  const personalWallet = wallets?.find(
    (wallet) =>
      wallet.wallet_type === "personal"
  );

  const coupleWallet = wallets?.find(
    (wallet) =>
      wallet.wallet_type === "couple"
  );

  if (!personalWallet) {
    throw new Error(
      "Personal wallet not found."
    );
  }

  // =========================================
  // Which Wallet is selected?
  // =========================================

  const requestedWallet =
    params.wallet === "couple"
      ? "couple"
      : "personal";

  const activeWallet =
    requestedWallet === "couple" &&
    coupleWallet
      ? coupleWallet
      : personalWallet;

  const activeWalletType =
    activeWallet.wallet_type;

  const isCoupleWallet =
    activeWalletType === "couple";

  // =========================================
  // Transactions for selected Wallet
  // =========================================

  const {
    data: transactionsData,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      id,
      transaction_type,
      amount,
      description,
      payment_method,
      occurred_on,
      created_at
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .order("occurred_on", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }

  const transactions =
    transactionsData ?? [];

  // =========================================
  // Balance
  // =========================================

  const balance = transactions.reduce(
    (total, transaction) => {
      const amount =
        Number(transaction.amount);

      // Income / Transfer In
      if (
        transaction.transaction_type ===
          "income" ||
        transaction.transaction_type ===
          "transfer_in"
      ) {
        return total + amount;
      }

      // Normal Wallet Expense
      if (
        transaction.transaction_type ===
          "expense" &&
        transaction.payment_method ===
          "wallet"
      ) {
        return total - amount;
      }

      // Transfer Out / Settlement
      if (
        transaction.transaction_type ===
          "transfer_out" ||
        transaction.transaction_type ===
          "settlement"
      ) {
        return total - amount;
      }

      // personal_advance does NOT
      // reduce wallet balance
      return total;
    },
    0
  );

  // =========================================
  // Current Month
  // =========================================

  const malaysiaDate =
    getMalaysiaDate();

  const currentMonth =
    malaysiaDate.slice(0, 7);

  const thisMonthTransactions =
    transactions.filter(
      (transaction) =>
        transaction.occurred_on.startsWith(
          currentMonth
        )
    );

  const monthlyIncome =
    thisMonthTransactions.reduce(
      (total, transaction) => {
        if (
          transaction.transaction_type !==
          "income"
        ) {
          return total;
        }

        return (
          total +
          Number(transaction.amount)
        );
      },
      0
    );

  const monthlyExpenses =
    thisMonthTransactions.reduce(
      (total, transaction) => {
        if (
          transaction.transaction_type !==
          "expense"
        ) {
          return total;
        }

        return (
          total +
          Number(transaction.amount)
        );
      },
      0
    );

  // =========================================
  // Recent Transactions
  // =========================================

  const recentTransactions =
    transactions.slice(0, 5);

  // =========================================
  // Page
  // =========================================

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* Header */}
        <header className="flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              Welcome back
            </p>

            <h1 className="text-2xl font-bold text-gray-900">
              Hi, {displayName} 👋
            </h1>
          </div>

          <LogoutButton />

        </header>


        {/* Wallet Switcher */}
        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Your wallets
          </p>

          <div className="mt-3 flex flex-wrap gap-3">

            {/* Personal Wallet */}
            <Link
              href="/?wallet=personal"
              className={`rounded-2xl border px-4 py-3 transition ${
                activeWalletType === "personal"
                  ? "border-[#D4AF37] bg-[#18140C] text-[#D4AF37]"
                  : "border-[#302819] bg-[#121212] text-[#D4CAB8]"
              }`}
            >
              <p className="text-sm font-semibold">
                👤 {personalWallet.name}
              </p>
            </Link>


            {/* Couple Wallet */}
            {coupleWallet ? (

              <Link
                href="/?wallet=couple"
                className={`rounded-2xl border px-4 py-3 transition ${
                  activeWalletType === "couple"
                    ? "border-[#D4AF37] bg-[#18140C] text-[#D4AF37]"
                    : "border-[#302819] bg-[#121212] text-[#D4CAB8]"
                }`}
              >
                <p className="text-sm font-semibold">
                  ❤️ {coupleWallet.name}
                </p>
              </Link>

            ) : (

              <Link
                href="/couple"
                className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3 text-gray-500"
              >
                <p className="text-sm font-semibold">
                  + Couple Wallet
                </p>
              </Link>

            )}

          </div>

        </section>


        <WalletGoalOverview
          walletId={
            activeWallet.id
          }
          walletName={
            activeWallet.name
          }
          walletType={
            activeWallet.wallet_type
          }
          walletTotal={
            balance
          }
        />

        {/* Action Area */}

        {isCoupleWallet ? (

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            <Link
              href="/couple/transactions/new"
              className="flex w-full items-center justify-center rounded-2xl bg-[#D4AF37] py-3.5 font-semibold text-[#080808] shadow-[0_8px_25px_rgba(212,175,55,0.16)] transition hover:bg-[#E2C25A]"
            >
              + Add Shared Transaction
            </Link>


            <Link
              href="/transfer"
className="flex w-full items-center justify-center rounded-2xl border border-[#4A3B1D] bg-[#121212] py-3.5 font-semibold text-[#C9A86A] transition hover:bg-[#18140C]"            >
              ⇄ Transfer from My Wallet
            </Link>

          </div>

        ) : (

          <div
            className={`mt-4 grid gap-3 ${
              coupleWallet
                ? "sm:grid-cols-2"
                : ""
            }`}
          >

            <Link
              href="/transactions/new"
              className="flex w-full items-center justify-center rounded-2xl bg-[#D4AF37] py-3.5 font-semibold text-[#080808] shadow-[0_8px_25px_rgba(212,175,55,0.16)] transition hover:bg-[#E2C25A]"
            >
              + Add Transaction
            </Link>


            {coupleWallet && (

              <Link
                href="/transfer"
className="flex w-full items-center justify-center rounded-2xl border border-[#4A3B1D] bg-[#121212] py-3.5 font-semibold text-[#C9A86A] transition hover:bg-[#18140C]"              >
                ⇄ Transfer to Couple
              </Link>

            )}

          </div>

        )}

        <DashboardRecurringAlerts
          walletId={
            activeWallet.id
          }
          walletType={
            activeWallet.wallet_type
          }
        />

        {isCoupleWallet && (
          <CoupleOutstanding
            walletId={
              activeWallet.id
            }
          />
        )}

        {/* This Month */}
        <section className="mt-6">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-semibold text-gray-900">
              This month
            </h2>


            {!isCoupleWallet && (

              <Link
                href="/transactions"
                className="text-sm font-semibold text-gray-600"
              >
                View transactions →
              </Link>

            )}

          </div>


          <div className="mt-3 grid grid-cols-2 gap-4">

            {/* Income */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">

              <p className="text-sm text-gray-500">
                Income
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                RM{" "}
                {formatMoney(
                  monthlyIncome
                )}
              </p>

            </div>


            {/* Expenses */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">

              <p className="text-sm text-gray-500">
                Expenses
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                RM{" "}
                {formatMoney(
                  monthlyExpenses
                )}
              </p>

            </div>

          </div>

        </section>
              
        <DashboardInsights
          walletId={
            activeWallet.id
          }
          walletType={
            activeWallet.wallet_type
          }
        />

        {/* Recent Transactions */}
        <section className="mt-8">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>


            {!isCoupleWallet && (

              <Link
                href="/transactions"
                className="text-sm font-semibold text-gray-600"
              >
                View all →
              </Link>

            )}

          </div>


          {recentTransactions.length === 0 ? (

            <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-8 text-center">

              <div className="text-3xl">
                {isCoupleWallet
                  ? "❤️"
                  : "💸"}
              </div>

              <p className="mt-3 font-medium text-gray-900">
                No transactions yet
              </p>

              <p className="mt-1 text-sm text-gray-500">

                {isCoupleWallet
                  ? "Your shared wallet is ready."
                  : "Add your first transaction."}

              </p>

            </div>

          ) : (

            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white">

              {recentTransactions.map(
                (
                  transaction,
                  index
                ) => {

                  const isIncome =
                    transaction.transaction_type ===
                      "income" ||
                    transaction.transaction_type ===
                      "transfer_in";

                  const isExpense =
                    transaction.transaction_type ===
                      "expense" ||
                    transaction.transaction_type ===
                      "transfer_out" ||
                    transaction.transaction_type ===
                      "settlement";

                  return (

                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between gap-4 p-4 ${
                        index !==
                        recentTransactions.length -
                          1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >

                      <div className="min-w-0">

                        <p className="truncate font-medium text-gray-900">
                          {
                            transaction.description
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-500">

                          {formatTransactionDate(
                            transaction.occurred_on
                          )}

                        </p>

                      </div>


                      <p
                        className={`shrink-0 font-semibold ${
                          isIncome
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >

                        {isIncome
                          ? "+"
                          : isExpense
                          ? "-"
                          : ""}

                        RM{" "}

                        {formatMoney(
                          Number(
                            transaction.amount
                          )
                        )}

                      </p>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </section>


        {/* Couple Settings Link */}
        {isCoupleWallet && (

          <div className="mt-6">

            <Link
              href="/couple"
              className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700"
            >
              Manage Couple Wallet
            </Link>

          </div>

        )}

      </div>

    </main>
  );
}