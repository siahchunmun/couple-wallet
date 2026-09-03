import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CategoryManager from "@/components/category-manager";

type CategoriesPageProps = {
  searchParams: Promise<{
    wallet?: string;
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
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
  // SYSTEM CATEGORIES
  // =========================================

  const {
    data: systemCategories,
    error: systemError,
  } = await supabase
    .from("categories")
    .select(`
      id,
      name_en,
      name_zh,
      category_type
    `)
    .eq(
      "is_system",
      true
    )
    .order(
      "name_en"
    );

  if (systemError) {
    throw new Error(
      systemError.message
    );
  }

  // =========================================
  // CURRENT WALLET CUSTOM CATEGORIES
  // =========================================

  const {
    data: customCategories,
    error: customError,
  } = await supabase
    .from("categories")
    .select(`
      id,
      name_en,
      name_zh,
      category_type,
      created_by
    `)
    .eq(
      "is_system",
      false
    )
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .order(
      "name_en"
    );

  if (customError) {
    throw new Error(
      customError.message
    );
  }

  // =========================================
  // CREATOR NAMES
  // =========================================

  const creatorIds =
    Array.from(
      new Set(
        (customCategories ?? [])
          .map(
            (category) =>
              category.created_by
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      )
    );

  let profileRows: {
    id: string;
    display_name: string;
  }[] = [];

  if (
    creatorIds.length > 0
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
        creatorIds
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
              Categories
            </h1>

            <p className="text-sm text-gray-500">
              Manage your spending and income categories.
            </p>

          </div>

        </header>


        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Wallet
          </p>

          <div className="mt-2 flex flex-wrap gap-3">

            <Link
              href="/categories?wallet=personal"
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
                href="/categories?wallet=couple"
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


        <section className="mt-6 rounded-2xl bg-gray-900 p-5 text-white">

          <p className="text-sm text-gray-400">
            Managing categories for
          </p>

          <p className="mt-1 text-lg font-bold">

            {activeWallet.wallet_type ===
            "couple"
              ? "❤️"
              : "👤"}{" "}

            {activeWallet.name}

          </p>

        </section>


        <div className="mt-6">

          <CategoryManager
            walletId={
              activeWallet.id
            }
            userId={
              user.id
            }
            systemCategories={
              (systemCategories ?? []).map(
                (category) => ({
                  ...category,

                  category_type:
                    category.category_type as
                      | "income"
                      | "expense"
                      | "both",
                })
              )
            }
            customCategories={
              (customCategories ?? []).map(
                (category) => ({
                  ...category,

                  category_type:
                    category.category_type as
                      | "income"
                      | "expense"
                      | "both",

                  createdByName:
                    category.created_by
                      ? profileMap.get(
                          category.created_by
                        ) ||
                        "Member"
                      : "Member",
                })
              )
            }
          />

        </div>

      </div>

    </main>
  );
}