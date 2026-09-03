import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getWalletCategories,
} from "@/lib/categories/server";


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


function formatDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      year:
        "numeric",

      month:
        "short",

      day:
        "numeric",

      timeZone:
        "Asia/Kuala_Lumpur",
    }
  ).format(
    new Date(
      `${date}T00:00:00+08:00`
    )
  );
}


function transactionLabel(
  type: string
) {
  if (
    type === "income"
  ) {
    return "Income";
  }

  if (
    type === "expense"
  ) {
    return "Expense";
  }

  if (
    type ===
    "transfer_in"
  ) {
    return "Transfer In";
  }

  if (
    type ===
    "transfer_out"
  ) {
    return "Transfer Out";
  }

  if (
    type ===
    "settlement"
  ) {
    return "Settlement";
  }

  return type;
}


export default async function CoupleTransactionsPage() {
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
  // COUPLE WALLET
  // =========================================

  const {
    data: wallets,
    error: walletError,
  } = await supabase
    .from("wallets")
    .select(`
      id,
      name
    `)
    .eq(
      "wallet_type",
      "couple"
    )
    .eq(
      "status",
      "active"
    )
    .limit(1);


  if (walletError) {
    throw new Error(
      walletError.message
    );
  }


  const coupleWallet =
    wallets?.[0];


  if (!coupleWallet) {
    redirect("/couple");
  }


  // =========================================
  // CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      coupleWallet.id
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
  // TRANSACTIONS
  // =========================================

  const {
    data: transactions,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      id,
      transaction_type,
      amount,
      description,
      source,
      category_id,
      payment_method,
      related_user_id,
      contributor_user_id,
      created_by,
      occurred_on,
      note,
      created_at
    `)
    .eq(
      "wallet_id",
      coupleWallet.id
    )
    .order(
      "occurred_on",
      {
        ascending:
          false,
      }
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );


  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }


  // =========================================
  // PEOPLE REFERENCED BY TRANSACTIONS
  // =========================================

  const profileIds =
    Array.from(
      new Set(
        (transactions ?? [])
          .flatMap(
            (
              transaction
            ) => [
              transaction.created_by,
              transaction.related_user_id,
              transaction.contributor_user_id,
            ]
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      )
    );


  let profiles: {
    id: string;
    display_name: string;
  }[] = [];


  if (
    profileIds.length > 0
  ) {
    const {
      data,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name
      `)
      .in(
        "id",
        profileIds
      );


    if (profileError) {
      throw new Error(
        profileError.message
      );
    }


    profiles =
      data ?? [];
  }


  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile.display_name,
        ]
      )
    );


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">

          <div>

            <p className="text-sm text-gray-500">
              ❤️{" "}
              {coupleWallet.name}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Shared Transactions
            </h1>

          </div>


          <Link
            href="/couple/transactions/new"
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Add
          </Link>

        </header>


        <p className="mt-3 text-sm text-gray-500">
          All shared income, expenses, advances, transfers and settlements.
        </p>


        {/* EMPTY */}
        {(!transactions ||
          transactions.length ===
            0) && (

          <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-10 text-center">

            <div className="text-4xl">
              🧾
            </div>

            <p className="mt-3 font-semibold text-gray-900">
              No shared transactions yet
            </p>

            <Link
              href="/couple/transactions/new"
              className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Add Shared Transaction
            </Link>

          </section>

        )}


        {/* TRANSACTIONS */}
        {transactions &&
          transactions.length >
            0 && (

          <section className="mt-6 space-y-3">

            {transactions.map(
              (
                transaction
              ) => {

                const isPositive =
                  transaction.transaction_type ===
                    "income" ||
                  transaction.transaction_type ===
                    "transfer_in";


                const categoryName =
                  transaction.category_id
                    ? categoryMap.get(
                        transaction.category_id
                      )
                    : null;


                const createdBy =
                  profileMap.get(
                    transaction.created_by
                  ) ||
                  "Member";


                const relatedName =
                  transaction.related_user_id
                    ? profileMap.get(
                        transaction.related_user_id
                      ) ||
                      "Member"
                    : null;


                const contributorName =
                  transaction.contributor_user_id
                    ? profileMap.get(
                        transaction.contributor_user_id
                      ) ||
                      "Member"
                    : null;


                return (
                  <article
                    key={
                      transaction.id
                    }
                    className="rounded-2xl border border-gray-100 bg-white p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      {/* LEFT */}
                      <div className="min-w-0">

                        <p className="font-semibold text-gray-900">
                          {
                            transaction.description
                          }
                        </p>


                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">

                          {categoryName && (
                            <>
                              <span>
                                {
                                  categoryName
                                }
                              </span>

                              <span>
                                •
                              </span>
                            </>
                          )}


                          <span>
                            {formatDate(
                              transaction.occurred_on
                            )}
                          </span>

                        </div>


                        {/* CREATED BY */}
                        <p className="mt-2 text-xs text-gray-400">
                          Added by{" "}
                          {createdBy}

                          {transaction.created_by ===
                          user.id
                            ? " (You)"
                            : ""}
                        </p>


                        {/* INCOME CONTRIBUTOR */}
                        {transaction.transaction_type ===
                          "income" &&
                          contributorName && (

                          <p className="mt-2 text-sm text-gray-500">
                            Contributed by{" "}
                            {
                              contributorName
                            }
                          </p>

                        )}


                        {/* ADVANCE */}
                        {transaction.transaction_type ===
                          "expense" &&
                          transaction.payment_method ===
                            "personal_advance" &&
                          relatedName && (

                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Paid personally by{" "}
                            {
                              relatedName
                            }
                          </p>

                        )}


                        {/* SETTLEMENT */}
                        {transaction.transaction_type ===
                          "settlement" &&
                          relatedName && (

                          <p className="mt-2 text-sm text-gray-500">
                            Settlement to{" "}
                            {
                              relatedName
                            }
                          </p>

                        )}


                        {/* SOURCE */}
                        {transaction.source && (

                          <p className="mt-2 text-sm text-gray-500">
                            Source:{" "}
                            {
                              transaction.source
                            }
                          </p>

                        )}


                        {/* NOTE */}
                        {transaction.note && (

                          <p className="mt-2 text-sm text-gray-500">
                            {
                              transaction.note
                            }
                          </p>

                        )}

                      </div>


                      {/* RIGHT */}
                      <div className="shrink-0 text-right">

                        <p
                          className={`font-bold ${
                            isPositive
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >

                          {isPositive
                            ? "+"
                            : "-"}

                          RM{" "}

                          {formatMoney(
                            Number(
                              transaction.amount
                            )
                          )}

                        </p>


                        <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                          {transactionLabel(
                            transaction.transaction_type
                          )}
                        </span>

                      </div>

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