"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";


type Category = {
  id: string;
  name_en: string;
};


type CategoryBudget = {
  id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
};


type BudgetManagerProps = {
  walletId: string;
  month: string;

  monthlyBudget:
    | {
        id: string;
        amount: number;
      }
    | null;

  monthlySpent: number;

  categories: Category[];

  categoryBudgets:
    CategoryBudget[];
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


export default function BudgetManager({
  walletId,
  month,
  monthlyBudget,
  monthlySpent,
  categories,
  categoryBudgets,
}: BudgetManagerProps) {
  const router =
    useRouter();


  const [
    monthlyAmount,
    setMonthlyAmount,
  ] = useState(
    monthlyBudget
      ? monthlyBudget.amount.toFixed(2)
      : ""
  );


  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("");


  const [
    categoryAmount,
    setCategoryAmount,
  ] = useState("");


  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================
  // MONTHLY BUDGET
  // =========================================

  async function saveMonthlyBudget(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const amount =
      Number(
        monthlyAmount
      );


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid monthly budget."
      );

      return;
    }


    setLoading(true);

    const supabase =
      createClient();


    const {
      error: rpcError,
    } = await supabase.rpc(
      "set_budget",
      {
        wallet_id:
          walletId,

        budget_month:
          `${month}-01`,

        category_id:
          null,

        amount,
      }
    );


    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }


    router.refresh();

    setLoading(false);
  }


  // =========================================
  // CATEGORY BUDGET
  // =========================================

  async function saveCategoryBudget(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");


    if (!selectedCategory) {
      setError(
        "Please choose a category."
      );

      return;
    }


    const amount =
      Number(
        categoryAmount
      );


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid category budget."
      );

      return;
    }


    setLoading(true);

    const supabase =
      createClient();


    const {
      error: rpcError,
    } = await supabase.rpc(
      "set_budget",
      {
        wallet_id:
          walletId,

        budget_month:
          `${month}-01`,

        category_id:
          selectedCategory,

        amount,
      }
    );


    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }


    setSelectedCategory("");
    setCategoryAmount("");

    router.refresh();

    setLoading(false);
  }


  async function deleteBudget(
    budgetId: string
  ) {
    const confirmed =
      window.confirm(
        "Remove this budget?"
      );


    if (!confirmed) {
      return;
    }


    setLoading(true);
    setError("");


    const supabase =
      createClient();


    const {
      error: rpcError,
    } = await supabase.rpc(
      "delete_budget",
      {
        budget_id:
          budgetId,
      }
    );


    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }


    router.refresh();

    setLoading(false);
  }


  const monthlyLimit =
    monthlyBudget?.amount ?? 0;


  const monthlyRemaining =
    monthlyLimit -
    monthlySpent;


  const monthlyPercent =
    monthlyLimit > 0
      ? (
          monthlySpent /
          monthlyLimit
        ) * 100
      : 0;


  return (
    <div className="space-y-6">

      {/* ============================== */}
      {/* MONTHLY BUDGET */}
      {/* ============================== */}

      <section className="rounded-3xl border border-gray-100 bg-white p-6">

        <h2 className="text-lg font-bold text-gray-900">
          Monthly Budget
        </h2>


        {monthlyBudget && (

          <div className="mt-5 rounded-2xl bg-gray-50 p-5">

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-sm text-gray-500">
                  Spent
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
                  monthlyLimit
                )}
              </p>

            </div>


            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-gray-900"
                style={{
                  width:
                    `${Math.min(
                      monthlyPercent,
                      100
                    )}%`,
                }}
              />

            </div>


            <div className="mt-3">

              {monthlyRemaining >= 0 ? (

                <p className="text-sm text-gray-600">
                  RM{" "}
                  {formatMoney(
                    monthlyRemaining
                  )}{" "}
                  remaining
                </p>

              ) : (

                <p className="text-sm font-semibold text-red-600">
                  RM{" "}
                  {formatMoney(
                    Math.abs(
                      monthlyRemaining
                    )
                  )}{" "}
                  over budget
                </p>

              )}

            </div>

          </div>

        )}


        <form
          onSubmit={
            saveMonthlyBudget
          }
          className="mt-5"
        >

          <label className="text-sm font-medium text-gray-700">
            {monthlyBudget
              ? "Update monthly budget"
              : "Set monthly budget"}
          </label>


          <div className="mt-2 flex gap-3">

            <div className="flex flex-1 overflow-hidden rounded-xl border border-gray-200">

              <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">
                RM
              </div>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={
                  monthlyAmount
                }
                onChange={(
                  event
                ) =>
                  setMonthlyAmount(
                    event.target.value
                  )
                }
                required
                placeholder="2000.00"
                className="w-full px-4 py-3 text-gray-900 outline-none"
              />

            </div>


            <button
              type="submit"
              disabled={
                loading
              }
              className="rounded-xl bg-gray-900 px-5 font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>

          </div>

        </form>

      </section>


      {/* ============================== */}
      {/* CATEGORY BUDGET */}
      {/* ============================== */}

      <section className="rounded-3xl border border-gray-100 bg-white p-6">

        <h2 className="text-lg font-bold text-gray-900">
          Category Budgets
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Optional limits for individual spending categories.
        </p>


        {/* Existing */}
        {categoryBudgets.length >
        0 && (

          <div className="mt-5 space-y-4">

            {categoryBudgets.map(
              (budget) => {

                const remaining =
                  budget.amount -
                  budget.spent;

                const percent =
                  budget.amount > 0
                    ? (
                        budget.spent /
                        budget.amount
                      ) * 100
                    : 0;


                return (

                  <div
                    key={
                      budget.id
                    }
                    className="rounded-2xl border border-gray-100 p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="font-semibold text-gray-900">
                          {
                            budget.category_name
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          RM{" "}
                          {formatMoney(
                            budget.spent
                          )}
                          {" / "}
                          RM{" "}
                          {formatMoney(
                            budget.amount
                          )}
                        </p>

                      </div>


                      <button
                        type="button"
                        disabled={
                          loading
                        }
                        onClick={() =>
                          deleteBudget(
                            budget.id
                          )
                        }
                        className="text-sm font-medium text-red-600"
                      >
                        Remove
                      </button>

                    </div>


                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">

                      <div
                        className="h-full rounded-full bg-gray-900"
                        style={{
                          width:
                            `${Math.min(
                              percent,
                              100
                            )}%`,
                        }}
                      />

                    </div>


                    {remaining >= 0 ? (

                      <p className="mt-2 text-sm text-gray-500">
                        RM{" "}
                        {formatMoney(
                          remaining
                        )}{" "}
                        remaining
                      </p>

                    ) : (

                      <p className="mt-2 text-sm font-semibold text-red-600">
                        RM{" "}
                        {formatMoney(
                          Math.abs(
                            remaining
                          )
                        )}{" "}
                        over budget
                      </p>

                    )}

                  </div>

                );
              }
            )}

          </div>

        )}


        {/* Add / Update */}
        <form
          onSubmit={
            saveCategoryBudget
          }
          className="mt-6 space-y-4 border-t border-gray-100 pt-6"
        >

          <div>

            <label className="text-sm font-medium text-gray-700">
              Category
            </label>

            <select
              value={
                selectedCategory
              }
              onChange={(
                event
              ) =>
                setSelectedCategory(
                  event.target.value
                )
              }
              required
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
            >

              <option value="">
                Select category
              </option>


              {categories.map(
                (category) => (

                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name_en
                    }
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label className="text-sm font-medium text-gray-700">
              Budget
            </label>

            <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200">

              <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">
                RM
              </div>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={
                  categoryAmount
                }
                onChange={(
                  event
                ) =>
                  setCategoryAmount(
                    event.target.value
                  )
                }
                required
                placeholder="500.00"
                className="w-full px-4 py-3 text-gray-900 outline-none"
              />

            </div>

          </div>


          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50"
          >
            Set Category Budget
          </button>

        </form>

      </section>


      {error && (

        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>

      )}

    </div>
  );
}