import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

import TransactionForm from "@/components/transaction-form";

export default async function NewTransactionPage() {
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
    .eq(
      "wallet_type",
      "personal"
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

  const personalWallet =
    wallets?.[0];

  if (!personalWallet) {
    throw new Error(
      "Personal Wallet not found."
    );
  }

  // =========================================
  // SYSTEM + THIS WALLET CUSTOM CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      personalWallet.id
    );

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-xl px-4 py-6">

        <header className="flex items-center gap-4">

          <Link
            href="/?wallet=personal"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>

          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Add Transaction
            </h1>

            <p className="text-sm text-gray-500">
              👤 {personalWallet.name}
            </p>

          </div>

        </header>


        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6">

          <TransactionForm
            walletId={
              personalWallet.id
            }
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