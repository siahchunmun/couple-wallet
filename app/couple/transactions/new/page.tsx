import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

import CoupleTransactionForm from "@/components/couple-transaction-form";

export default async function NewCoupleTransactionPage() {
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
      name,
      wallet_type,
      status
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
  // MEMBERS
  // =========================================

  const {
    data: memberRows,
    error: memberError,
  } = await supabase
    .from("wallet_members")
    .select("user_id")
    .eq(
      "wallet_id",
      coupleWallet.id
    );

  if (memberError) {
    throw new Error(
      memberError.message
    );
  }

  const memberIds =
    (memberRows ?? []).map(
      (member) =>
        member.user_id
    );

  let profileRows: {
    id: string;
    display_name: string;
  }[] = [];

  if (
    memberIds.length > 0
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
        memberIds
      );

    if (profileError) {
      throw new Error(
        profileError.message
      );
    }

    profileRows =
      data ?? [];
  }

  const profileMap =
    new Map(
      profileRows.map(
        (profile) => [
          profile.id,
          profile.display_name,
        ]
      )
    );

  const members =
    memberIds.map(
      (memberId) => ({
        user_id:
          memberId,

        display_name:
          profileMap.get(
            memberId
          ) ||
          "Partner",
      })
    );

  // =========================================
  // SYSTEM + COUPLE CUSTOM CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      coupleWallet.id
    );

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-xl px-4 py-6">

        <header className="flex items-center gap-4">

          <Link
            href="/?wallet=couple"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>

          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Add Transaction
            </h1>

            <p className="text-sm text-gray-500">
              ❤️{" "}
              {coupleWallet.name}
            </p>

          </div>

        </header>


        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6">

          <CoupleTransactionForm
            walletId={
              coupleWallet.id
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
            members={
              members
            }
          />

        </section>

      </div>

    </main>
  );
}