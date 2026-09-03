import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

import EditTransactionForm from "@/components/edit-transaction-form";

type EditTransactionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // =========================================
  // TRANSACTION
  // =========================================

  const {
    data: transactions,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      id,
      wallet_id,
      created_by,
      transaction_type,
      amount,
      description,
      source,
      category_id,
      payment_method,
      occurred_on,
      note
    `)
    .eq(
      "id",
      id
    )
    .limit(1);

  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }

  const transaction =
    transactions?.[0];

  if (!transaction) {
    notFound();
  }

  if (
    transaction.created_by !==
    user.id
  ) {
    notFound();
  }

  if (
    transaction.transaction_type !==
      "income" &&
    transaction.transaction_type !==
      "expense"
  ) {
    notFound();
  }

  // =========================================
  // CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      transaction.wallet_id
    );

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-xl px-4 py-6">

        <header className="flex items-center gap-4">

          <Link
            href="/transactions"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>

          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Edit Transaction
            </h1>

            <p className="text-sm text-gray-500">
              {
                transaction.description
              }
            </p>

          </div>

        </header>


        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6">

          <EditTransactionForm
            transaction={{
              id:
                transaction.id,

              transaction_type:
                transaction.transaction_type,

              amount:
                Number(
                  transaction.amount
                ),

              description:
                transaction.description,

              source:
                transaction.source,

              category_id:
                transaction.category_id,

              occurred_on:
                transaction.occurred_on,

              note:
                transaction.note,
            }}
            userId={
              user.id
            }
            categories={
              categories.map(
                (category) => ({
                  id:
                    category.id,

                  name_en:
                    category.name_en,

                  name_zh:
                    category.name_zh,

                  category_type:
                    category.category_type as
                      | "income"
                      | "expense"
                      | "both",
                })
              )
            }
          />

        </section>

      </div>

    </main>
  );
}