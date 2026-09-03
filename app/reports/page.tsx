import Link from "next/link";
import { redirect } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getWalletCategories,
} from "@/lib/categories/server";

import ReportCharts from "@/components/report-charts";


function formatMoney(
  amount: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}


function getMalaysiaMonth() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Asia/Kuala_Lumpur",

      year:
        "numeric",

      month:
        "2-digit",
    }
  ).format(
    new Date()
  );
}


function getNextMonthStart(
  month: string
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        monthNumber,
        1
      )
    );

  return (
    `${date.getUTCFullYear()}-` +
    `${String(
      date.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    )}-01`
  );
}


function getMonthOffset(
  month: string,
  offset: number
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        monthNumber - 1 +
          offset,
        1
      )
    );

  return (
    `${date.getUTCFullYear()}-` +
    `${String(
      date.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    )}`
  );
}


function formatMonthLabel(
  month: string
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      month:
        "short",

      year:
        "2-digit",

      timeZone:
        "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        monthNumber - 1,
        1
      )
    )
  );
}


type ReportsPageProps = {
  searchParams: Promise<{
    wallet?: string;
    month?: string;
  }>;
};


export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params =
    await searchParams;

  const supabase =
    await createClient();


  // =========================================
  // USER
  // =========================================

  const {
    data: { user },
  } =
    await supabase.auth.getUser();


  if (!user) {
    redirect("/auth");
  }


  // =========================================
  // WALLETS
  // =========================================

  const {
    data: wallets,
    error: walletError,
  } = await supabase
    .from("wallets")
    .select(`
      id,
      name,
      wallet_type
    `)
    .eq(
      "status",
      "active"
    );


  if (walletError) {
    throw new Error(
      walletError.message
    );
  }


  const personalWallet =
    wallets?.find(
      (wallet) =>
        wallet.wallet_type ===
        "personal"
    );


  const coupleWallet =
    wallets?.find(
      (wallet) =>
        wallet.wallet_type ===
        "couple"
    );


  if (!personalWallet) {
    throw new Error(
      "Personal Wallet not found."
    );
  }


  const requestedWallet =
    params.wallet ===
    "couple"
      ? "couple"
      : "personal";


  const activeWallet =
    requestedWallet ===
      "couple" &&
    coupleWallet
      ? coupleWallet
      : personalWallet;


  // =========================================
  // SELECTED MONTH
  // =========================================

  const currentMonth =
    getMalaysiaMonth();


  const selectedMonth =
    params.month &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      params.month
    )
      ? params.month
      : currentMonth;


  const selectedMonthStart =
    `${selectedMonth}-01`;


  const selectedMonthEnd =
    getNextMonthStart(
      selectedMonth
    );


  // =========================================
  // SIX-MONTH RANGE
  //
  // Selected month + previous 5 months
  // =========================================

  const trendMonths =
    Array.from(
      {
        length: 6,
      },
      (
        _,
        index
      ) =>
        getMonthOffset(
          selectedMonth,
          index - 5
        )
    );


  const trendStart =
    `${trendMonths[0]}-01`;


  const trendEnd =
    selectedMonthEnd;


  // =========================================
  // CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      activeWallet.id
    );


  const categoryMap =
    new Map(
      categories.map(
        (category) => [
          category.id,
          category.name_en,
        ]
      )
    );


  // =========================================
  // GET SIX MONTHS TRANSACTIONS
  // =========================================

  const {
    data: transactionRows,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      id,
      transaction_type,
      amount,
      category_id,
      payment_method,
      occurred_on
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .gte(
      "occurred_on",
      trendStart
    )
    .lt(
      "occurred_on",
      trendEnd
    )
    .order(
      "occurred_on",
      {
        ascending:
          true,
      }
    );


  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }

  /*
   * We deliberately query a date range with:
   *
   * >= trendStart
   * < nextMonthStart
   *
   * so we don't have to worry about varying
   * month lengths.
   *
   * Supabase supports chaining gte/lt filters
   * on SELECT queries.
   */


  const allTransactions =
    transactionRows ?? [];


  // =========================================
  // SELECTED MONTH TRANSACTIONS
  // =========================================

  const selectedTransactions =
    allTransactions.filter(
      (transaction) =>
        transaction.occurred_on >=
          selectedMonthStart &&
        transaction.occurred_on <
          selectedMonthEnd
    );


  // =========================================
  // MONTHLY INCOME
  // =========================================

  const monthlyIncome =
    selectedTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type ===
          "income"
      )
      .reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.amount
          ),
        0
      );


  // =========================================
  // MONTHLY EXPENSE
  //
  // Includes personal advance expenses.
  // =========================================

  const monthlyExpense =
    selectedTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type ===
          "expense"
      )
      .reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.amount
          ),
        0
      );


  // =========================================
  // NET
  //
  // Report Net means Income - Expenses.
  //
  // It is NOT the same thing as wallet
  // balance change because transfer /
  // settlement are intentionally excluded.
  // =========================================

  const monthlyNet =
    monthlyIncome -
    monthlyExpense;


  // =========================================
  // CATEGORY SPENDING
  // =========================================

  const categorySpendingMap =
    new Map<
      string,
      number
    >();


  for (
    const transaction
    of selectedTransactions
  ) {
    if (
      transaction.transaction_type !==
      "expense"
    ) {
      continue;
    }


    const categoryName =
      transaction.category_id
        ? categoryMap.get(
            transaction.category_id
          ) ||
          "Other"
        : "Uncategorized";


    const current =
      categorySpendingMap.get(
        categoryName
      ) ?? 0;


    categorySpendingMap.set(
      categoryName,
      current +
        Number(
          transaction.amount
        )
    );
  }


  const categoryData =
    Array.from(
      categorySpendingMap.entries()
    )
      .map(
        ([
          name,
          amount,
        ]) => ({
          name,
          amount,

          percentage:
            monthlyExpense > 0
              ? (
                  amount /
                  monthlyExpense
                ) * 100
              : 0,
        })
      )
      .sort(
        (a, b) =>
          b.amount -
          a.amount
      );


  // =========================================
  // SIX MONTH TREND
  // =========================================

  const trendData =
    trendMonths.map(
      (month) => {

        const monthStart =
          `${month}-01`;

        const monthEnd =
          getNextMonthStart(
            month
          );


        let income = 0;
        let expense = 0;


        for (
          const transaction
          of allTransactions
        ) {
          if (
            transaction.occurred_on <
              monthStart ||
            transaction.occurred_on >=
              monthEnd
          ) {
            continue;
          }


          const amount =
            Number(
              transaction.amount
            );


          if (
            transaction.transaction_type ===
            "income"
          ) {
            income +=
              amount;
          }


          if (
            transaction.transaction_type ===
            "expense"
          ) {
            expense +=
              amount;
          }
        }


        return {
          month:
            formatMonthLabel(
              month
            ),

          income,

          expense,
        };
      }
    );


  // =========================================
  // TOP CATEGORY
  // =========================================

  const topCategory =
    categoryData[0] ??
    null;


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-4xl px-4 py-6">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header className="flex items-center gap-4">

          <Link
            href={`/?wallet=${activeWallet.wallet_type}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>


          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Reports
            </h1>

            <p className="text-sm text-gray-500">
              Understand your money over time.
            </p>

          </div>

        </header>


        {/* ================================= */}
        {/* WALLET SWITCHER */}
        {/* ================================= */}

        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Wallet
          </p>


          <div className="mt-2 flex flex-wrap gap-3">

            <Link
              href={`/reports?wallet=personal&month=${selectedMonth}`}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                activeWallet.wallet_type ===
                "personal"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              👤 My Wallet
            </Link>


            {coupleWallet && (

              <Link
                href={`/reports?wallet=couple&month=${selectedMonth}`}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                  activeWallet.wallet_type ===
                  "couple"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                ❤️ Our Wallet
              </Link>

            )}

          </div>

        </section>


        {/* ================================= */}
        {/* MONTH SELECTOR */}
        {/* ================================= */}

        <section className="mt-6">

          <form
            method="get"
            className="flex items-end gap-3"
          >

            <input
              type="hidden"
              name="wallet"
              value={
                activeWallet.wallet_type
              }
            />


            <div className="flex-1">

              <label className="text-sm font-medium text-gray-700">
                Report Month
              </label>

              <input
                type="month"
                name="month"
                defaultValue={
                  selectedMonth
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
              />

            </div>


            <button
              type="submit"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700"
            >
              View
            </button>

          </form>

        </section>


        {/* ================================= */}
        {/* ACTIVE WALLET */}
        {/* ================================= */}

        <section className="mt-6">

          <p className="text-sm text-gray-500">
            Report for
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">

            {activeWallet.wallet_type ===
            "couple"
              ? "❤️"
              : "👤"}{" "}

            {activeWallet.name}

          </p>

        </section>


        {/* ================================= */}
        {/* SUMMARY */}
        {/* ================================= */}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">

          {/* INCOME */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">

            <p className="text-sm text-gray-500">
              Income
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              + RM{" "}
              {formatMoney(
                monthlyIncome
              )}
            </p>

          </div>


          {/* EXPENSE */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">

            <p className="text-sm text-gray-500">
              Expenses
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              - RM{" "}
              {formatMoney(
                monthlyExpense
              )}
            </p>

          </div>


          {/* NET */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">

            <p className="text-sm text-gray-500">
              Net
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                monthlyNet >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {monthlyNet >= 0
                ? "+"
                : "-"}

              {" "}RM{" "}

              {formatMoney(
                Math.abs(
                  monthlyNet
                )
              )}
            </p>

          </div>

        </section>


        {/* ================================= */}
        {/* QUICK INSIGHT */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl bg-gray-900 p-5 text-white">

          <p className="text-sm text-gray-400">
            Monthly snapshot
          </p>


          {monthlyExpense ===
          0 ? (

            <p className="mt-2 font-semibold">
              No expenses recorded for this month.
            </p>

          ) : topCategory ? (

            <p className="mt-2 font-semibold">
              Your biggest spending category was{" "}
              {topCategory.name} at RM{" "}
              {formatMoney(
                topCategory.amount
              )}
              , representing{" "}
              {topCategory.percentage.toFixed(
                1
              )}
              % of total spending.
            </p>

          ) : null}

        </section>


        {/* ================================= */}
        {/* CHARTS */}
        {/* ================================= */}

        <div className="mt-8">

          <ReportCharts
            income={
              monthlyIncome
            }
            expense={
              monthlyExpense
            }
            categoryData={
              categoryData
            }
            trendData={
              trendData
            }
          />

        </div>


        {/* ================================= */}
        {/* REPORT ACCOUNTING NOTE */}
        {/* ================================= */}

        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">

          <h2 className="font-semibold text-gray-900">
            How this report works
          </h2>

          <div className="mt-3 space-y-2 text-sm text-gray-500">

            <p>
              Income includes normal income transactions.
            </p>

            <p>
              Expenses include both wallet-paid expenses and personal advances.
            </p>

            <p>
              Transfers, settlements, and Savings Goal movements are excluded from Income and Expenses.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}