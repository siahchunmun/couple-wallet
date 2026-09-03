import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

type DashboardInsightsProps = {
  walletId: string;
  walletType: string;
};

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

  const nextMonth =
    new Date(
      Date.UTC(
        year,
        monthNumber,
        1
      )
    );

  return (
    `${nextMonth.getUTCFullYear()}-` +
    `${String(
      nextMonth.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    )}-01`
  );
}

export default async function DashboardInsights({
  walletId,
  walletType,
}: DashboardInsightsProps) {
  const supabase =
    await createClient();

  // =========================================
  // MONTH
  // =========================================

  const currentMonth =
    getMalaysiaMonth();

  const monthStart =
    `${currentMonth}-01`;

  const nextMonthStart =
    getNextMonthStart(
      currentMonth
    );

  const walletParam =
    walletType === "couple"
      ? "couple"
      : "personal";

  // =========================================
  // MONTHLY BUDGET
  // =========================================

  const {
    data: budgetRows,
    error: budgetError,
  } = await supabase
    .from("budgets")
    .select(`
      id,
      amount
    `)
    .eq(
      "wallet_id",
      walletId
    )
    .eq(
      "budget_month",
      monthStart
    )
    .is(
      "category_id",
      null
    )
    .limit(1);

  if (budgetError) {
    throw new Error(
      budgetError.message
    );
  }

  const monthlyBudget =
    budgetRows?.[0]
      ? Number(
          budgetRows[0].amount
        )
      : null;

  // =========================================
  // EXPENSES
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
      walletId
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

  // =========================================
  // CURRENT WALLET CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      walletId
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
  // SPENDING BY CATEGORY
  // =========================================

  const spendingMap =
    new Map<
      string,
      number
    >();

  for (
    const expense
    of expenses ?? []
  ) {
    const categoryName =
      expense.category_id
        ? categoryMap.get(
            expense.category_id
          ) ||
          "Other"
        : "Uncategorized";

    const current =
      spendingMap.get(
        categoryName
      ) ?? 0;

    spendingMap.set(
      categoryName,
      current +
        Number(
          expense.amount
        )
    );
  }

  const categorySpending =
    Array.from(
      spendingMap.entries()
    )
      .map(
        ([
          name,
          amount,
        ]) => ({
          name,
          amount,
        })
      )
      .sort(
        (a, b) =>
          b.amount -
          a.amount
      )
      .slice(
        0,
        5
      );

  // =========================================
  // BUDGET CALCULATIONS
  // =========================================

  const budgetRemaining =
    monthlyBudget !== null
      ? monthlyBudget -
        monthlySpent
      : null;

  const budgetPercent =
    monthlyBudget !== null &&
    monthlyBudget > 0
      ? (
          monthlySpent /
          monthlyBudget
        ) * 100
      : 0;

  return (
    <>

      {/* MONTHLY BUDGET */}
      <section className="mt-8">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Budget
          </h2>

          <Link
            href={`/budget?wallet=${walletParam}&month=${currentMonth}`}
            className="text-sm font-semibold text-gray-600"
          >
            Manage →
          </Link>

        </div>


        {monthlyBudget !== null ? (

          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-sm text-gray-500">
                  Spent this month
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  RM{" "}
                  {formatMoney(
                    monthlySpent
                  )}
                </p>

              </div>


              <p className="text-sm font-medium text-gray-500">
                / RM{" "}
                {formatMoney(
                  monthlyBudget
                )}
              </p>

            </div>


            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-gray-900"
                style={{
                  width:
                    `${Math.min(
                      budgetPercent,
                      100
                    )}%`,
                }}
              />

            </div>


            <div className="mt-3">

              {budgetRemaining !==
                null &&
              budgetRemaining >=
                0 ? (

                <p className="text-sm text-gray-600">
                  RM{" "}
                  {formatMoney(
                    budgetRemaining
                  )}{" "}
                  remaining
                </p>

              ) : (

                <p className="text-sm font-semibold text-red-600">
                  RM{" "}
                  {formatMoney(
                    Math.abs(
                      budgetRemaining ??
                        0
                    )
                  )}{" "}
                  over budget
                </p>

              )}

            </div>

          </div>

        ) : (

          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">

            <p className="font-medium text-gray-900">
              No monthly budget yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              You spent RM{" "}
              {formatMoney(
                monthlySpent
              )}{" "}
              this month.
            </p>

            <Link
              href={`/budget?wallet=${walletParam}&month=${currentMonth}`}
              className="mt-4 inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Set Budget
            </Link>

          </div>

        )}

      </section>


      {/* SPENDING */}
      <section className="mt-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">

              {walletType ===
              "couple"
                ? "Where our money went"
                : "Where my money went"}

            </h2>

            <p className="mt-1 text-sm text-gray-500">
              This month
            </p>

          </div>

        </div>


        {categorySpending.length ===
        0 ? (

          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-8 text-center">

            <div className="text-3xl">
              📊
            </div>

            <p className="mt-3 font-medium text-gray-900">
              No spending yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Your spending categories will appear here.
            </p>

          </div>

        ) : (

          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">

            <div className="border-b border-gray-100 pb-4">

              <p className="text-sm text-gray-500">
                Total spending
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                RM{" "}
                {formatMoney(
                  monthlySpent
                )}
              </p>

            </div>


            <div className="mt-5 space-y-5">

              {categorySpending.map(
                (category) => {

                  const percentage =
                    monthlySpent > 0
                      ? (
                          category.amount /
                          monthlySpent
                        ) * 100
                      : 0;

                  return (
                    <div
                      key={
                        category.name
                      }
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div>

                          <p className="font-medium text-gray-900">
                            {
                              category.name
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">

                            {percentage.toFixed(
                              1
                            )}
                            %

                          </p>

                        </div>


                        <p className="font-semibold text-gray-900">
                          RM{" "}
                          {formatMoney(
                            category.amount
                          )}
                        </p>

                      </div>


                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-gray-900"
                          style={{
                            width:
                              `${Math.min(
                                percentage,
                                100
                              )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        )}

      </section>

    </>
  );
}