import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

import BudgetManager from "@/components/budget-manager";

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

type BudgetPageProps = {
  searchParams: Promise<{
    wallet?: string;
    month?: string;
  }>;
};

export default async function BudgetPage({
  searchParams,
}: BudgetPageProps) {
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
  // MONTH
  // =========================================

  const currentMonth =
    getMalaysiaMonth();

  const month =
    params.month &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      params.month
    )
      ? params.month
      : currentMonth;

  const monthStart =
    `${month}-01`;

  const nextMonthStart =
    getNextMonthStart(
      month
    );

  // =========================================
  // CURRENT WALLET CATEGORIES
  // =========================================

  const allCategories =
    await getWalletCategories(
      activeWallet.id
    );

  const categories =
    allCategories.filter(
      (category) =>
        category.category_type ===
          "expense" ||
        category.category_type ===
          "both"
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
  // BUDGETS
  // =========================================

  const {
    data: budgetRows,
    error: budgetError,
  } = await supabase
    .from("budgets")
    .select(`
      id,
      category_id,
      amount
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .eq(
      "budget_month",
      monthStart
    );

  if (budgetError) {
    throw new Error(
      budgetError.message
    );
  }

  const monthlyBudgetRow =
    budgetRows?.find(
      (budget) =>
        budget.category_id ===
        null
    );

  // =========================================
  // MONTH EXPENSES
  // =========================================

  const {
    data: expenses,
    error: expenseError,
  } = await supabase
    .from("transactions")
    .select(`
      amount,
      category_id
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .eq(
      "transaction_type",
      "expense"
    )
    .gte(
      "occurred_on",
      monthStart
    )
    .lt(
      "occurred_on",
      nextMonthStart
    );

  if (expenseError) {
    throw new Error(
      expenseError.message
    );
  }

  const monthlySpent =
    (expenses ?? []).reduce(
      (
        total,
        expense
      ) =>
        total +
        Number(
          expense.amount
        ),
      0
    );

  const categorySpentMap =
    new Map<
      string,
      number
    >();

  for (
    const expense
    of expenses ?? []
  ) {
    if (
      !expense.category_id
    ) {
      continue;
    }

    const current =
      categorySpentMap.get(
        expense.category_id
      ) ?? 0;

    categorySpentMap.set(
      expense.category_id,
      current +
        Number(
          expense.amount
        )
    );
  }

  const categoryBudgets =
    (budgetRows ?? [])
      .filter(
        (budget) =>
          budget.category_id !==
          null
      )
      .map(
        (budget) => ({
          id:
            budget.id,

          category_id:
            budget.category_id!,

          category_name:
            categoryMap.get(
              budget.category_id!
            ) ||
            "Category",

          amount:
            Number(
              budget.amount
            ),

          spent:
            categorySpentMap.get(
              budget.category_id!
            ) ?? 0,
        })
      );

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-4 py-6">

        <header className="flex items-center gap-4">

          <Link
            href={`/?wallet=${activeWallet.wallet_type}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>

          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Budget
            </h1>

            <p className="text-sm text-gray-500">

              {activeWallet.wallet_type ===
              "couple"
                ? "❤️"
                : "👤"}{" "}

              {
                activeWallet.name
              }

            </p>

          </div>

        </header>


        {/* WALLET */}
        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Wallet
          </p>

          <div className="mt-2 flex gap-3">

            <Link
              href={`/budget?wallet=personal&month=${month}`}
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
                href={`/budget?wallet=couple&month=${month}`}
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


        {/* MONTH */}
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
                Month
              </label>

              <input
                type="month"
                name="month"
                defaultValue={
                  month
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


        <div className="mt-6">

          <BudgetManager
            walletId={
              activeWallet.id
            }
            month={
              month
            }
            monthlyBudget={
              monthlyBudgetRow
                ? {
                    id:
                      monthlyBudgetRow.id,

                    amount:
                      Number(
                        monthlyBudgetRow.amount
                      ),
                  }
                : null
            }
            monthlySpent={
              monthlySpent
            }
            categories={
              categories.map(
                (category) => ({
                  id:
                    category.id,

                  name_en:
                    category.name_en,
                })
              )
            }
            categoryBudgets={
              categoryBudgets
            }
          />

        </div>

      </div>

    </main>
  );
}