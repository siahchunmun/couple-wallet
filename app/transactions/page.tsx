import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

import DeleteTransactionButton from "@/components/delete-transaction-button";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(
    new Date(`${date}T00:00:00+08:00`)
  );
}

function getNextMonthStart(
  month: string
) {
  const [year, monthNumber] =
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

  const nextYear =
    nextMonth.getUTCFullYear();

  const nextMonthNumber =
    String(
      nextMonth.getUTCMonth() + 1
    ).padStart(2, "0");

  return `${nextYear}-${nextMonthNumber}-01`;
}

type TransactionsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    month?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params =
    await searchParams;

  const search =
    params.q?.trim() ?? "";

  const typeFilter =
    params.type === "income" ||
    params.type === "expense"
      ? params.type
      : "";

  const requestedCategoryFilter =
    params.category ?? "";

  const monthFilter =
    params.month &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      params.month
    )
      ? params.month
      : "";

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
  // PERSONAL WALLET
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
    .eq("wallet_type", "personal")
    .eq("status", "active")
    .limit(1);

  if (walletError) {
    throw new Error(
      walletError.message
    );
  }

  const personalWallet =
    wallets?.[0];

  if (!personalWallet) {
    throw new Error(
      "Personal Wallet not found."
    );
  }

  // =========================================
  // CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      personalWallet.id
    );

  const categoryMap =
    new Map(
      categories.map(
        (category) => [
          category.id,
          category,
        ]
      )
    );

  const categoryFilter =
    requestedCategoryFilter &&
    categoryMap.has(
      requestedCategoryFilter
    )
      ? requestedCategoryFilter
      : "";

  // =========================================
  // TRANSACTIONS
  // =========================================

  let transactionQuery =
    supabase
      .from("transactions")
      .select(`
        id,
        transaction_type,
        amount,
        description,
        source,
        category_id,
        payment_method,
        occurred_on,
        note,
        created_by,
        created_at
      `)
      .eq(
        "wallet_id",
        personalWallet.id
      )
      .order(
        "occurred_on",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (search) {
    transactionQuery =
      transactionQuery.ilike(
        "description",
        `%${search}%`
      );
  }

  if (typeFilter) {
    transactionQuery =
      transactionQuery.eq(
        "transaction_type",
        typeFilter
      );
  }

  if (categoryFilter) {
    transactionQuery =
      transactionQuery.eq(
        "category_id",
        categoryFilter
      );
  }

  if (monthFilter) {
    const monthStart =
      `${monthFilter}-01`;

    const nextMonthStart =
      getNextMonthStart(
        monthFilter
      );

    transactionQuery =
      transactionQuery
        .gte(
          "occurred_on",
          monthStart
        )
        .lt(
          "occurred_on",
          nextMonthStart
        );
  }

  const {
    data: transactions,
    error: transactionError,
  } =
    await transactionQuery;

  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(typeFilter) ||
    Boolean(categoryFilter) ||
    Boolean(monthFilter);

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <Link
              href="/?wallet=personal"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
            >
              ←
            </Link>

            <div>

              <h1 className="text-xl font-bold text-gray-900">
                Transactions
              </h1>

              <p className="text-sm text-gray-500">
                👤 {personalWallet.name}
              </p>

            </div>

          </div>


          <Link
            href="/transactions/new"
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Add
          </Link>

        </header>


        {/* FILTERS */}
        <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-5">

          <form
            method="get"
            className="space-y-4"
          >

            <div>

              <label className="text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="search"
                name="q"
                defaultValue={
                  search
                }
                placeholder="Search e.g. Dinner"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
              />

            </div>


            <div className="grid gap-4 sm:grid-cols-3">

              <div>

                <label className="text-sm font-medium text-gray-700">
                  Type
                </label>

                <select
                  name="type"
                  defaultValue={
                    typeFilter
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none"
                >
                  <option value="">
                    All
                  </option>

                  <option value="income">
                    Income
                  </option>

                  <option value="expense">
                    Expense
                  </option>
                </select>

              </div>


              <div>

                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>

                <select
                  name="category"
                  defaultValue={
                    categoryFilter
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none"
                >
                  <option value="">
                    All categories
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
                  Month
                </label>

                <input
                  type="month"
                  name="month"
                  defaultValue={
                    monthFilter
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none"
                />

              </div>

            </div>


            <div className="flex gap-3">

              <button
                type="submit"
                className="flex-1 rounded-xl bg-gray-900 py-3 font-semibold text-white"
              >
                Apply Filters
              </button>


              {hasFilters && (
                <Link
                  href="/transactions"
                  className="flex items-center justify-center rounded-xl border border-gray-200 px-5 font-semibold text-gray-700"
                >
                  Clear
                </Link>
              )}

            </div>

          </form>

        </section>


        {/* COUNT */}
        <section className="mt-6">

          <p className="text-sm text-gray-500">
            {transactions?.length ?? 0}
            {" "}
            {transactions?.length === 1
              ? "transaction"
              : "transactions"}
          </p>

        </section>


        {/* EMPTY */}
        {(!transactions ||
          transactions.length === 0) && (

          <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-10 text-center">

            <div className="text-4xl">
              🔎
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              {hasFilters
                ? "No matching transactions"
                : "No transactions yet"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {hasFilters
                ? "Try changing or clearing your filters."
                : "Add your first income or expense."}
            </p>


            {hasFilters ? (
              <Link
                href="/transactions"
                className="mt-6 inline-flex rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700"
              >
                Clear Filters
              </Link>
            ) : (
              <Link
                href="/transactions/new"
                className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Add Transaction
              </Link>
            )}

          </section>

        )}


        {/* LIST */}
        {transactions &&
          transactions.length > 0 && (

          <section className="mt-4 space-y-3">

            {transactions.map(
              (transaction) => {

                const category =
                  transaction.category_id
                    ? categoryMap.get(
                        transaction.category_id
                      )
                    : null;

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

                const canEdit =
                  transaction.created_by ===
                    user.id &&
                  (
                    transaction.transaction_type ===
                      "income" ||
                    transaction.transaction_type ===
                      "expense"
                  );

                const canDelete =
                  transaction.created_by ===
                    user.id &&
                  (
                    transaction.transaction_type ===
                      "income" ||
                    transaction.transaction_type ===
                      "expense"
                  );

                return (
                  <article
                    key={
                      transaction.id
                    }
                    className="rounded-2xl border border-gray-100 bg-white p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="font-semibold text-gray-900">
                          {
                            transaction.description
                          }
                        </p>


                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">

                          {category && (
                            <span>
                              {
                                category.name_en
                              }
                            </span>
                          )}

                          {category && (
                            <span>
                              •
                            </span>
                          )}

                          <span>
                            {formatDate(
                              transaction.occurred_on
                            )}
                          </span>

                        </div>


                        {transaction.source && (
                          <p className="mt-2 text-sm text-gray-500">
                            Source:{" "}
                            {
                              transaction.source
                            }
                          </p>
                        )}


                        {transaction.note && (
                          <p className="mt-2 text-sm text-gray-500">
                            {
                              transaction.note
                            }
                          </p>
                        )}

                      </div>


                      <div className="shrink-0 text-right">

                        <p
                          className={`font-bold ${
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


                        <p className="mt-1 text-xs capitalize text-gray-400">
                          {transaction.transaction_type.replace(
                            "_",
                            " "
                          )}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 flex items-center gap-5 border-t border-gray-100 pt-4">

                      {canEdit ? (
                        <Link
                          href={`/transactions/${transaction.id}/edit`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-gray-400">
                          Edit
                        </span>
                      )}


                      {canDelete && (
                        <DeleteTransactionButton
                          transactionId={
                            transaction.id
                          }
                          description={
                            transaction.description
                          }
                        />
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </section>

        )}

      </div>

    </main>
  );
}