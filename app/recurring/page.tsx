import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWalletCategories } from "@/lib/categories/server";

import RecurringManager from "@/components/recurring-manager";

function getMalaysiaDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Asia/Kuala_Lumpur",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}

type RecurringPageProps = {
  searchParams: Promise<{
    wallet?: string;
  }>;
};

export default async function RecurringPage({
  searchParams,
}: RecurringPageProps) {
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
      activeWallet.id
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
  // CURRENT WALLET CATEGORIES
  // =========================================

  const categories =
    await getWalletCategories(
      activeWallet.id
    );

  // =========================================
  // RECURRING RULES
  // =========================================

  const {
    data: rules,
    error: recurringError,
  } = await supabase
    .from("recurring_rules")
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
      frequency,
      next_due_date,
      note
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .eq(
      "status",
      "active"
    )
    .order(
      "next_due_date",
      {
        ascending:
          true,
      }
    );

  if (recurringError) {
    throw new Error(
      recurringError.message
    );
  }

  const today =
    getMalaysiaDate();

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
              Recurring
            </h1>

            <p className="text-sm text-gray-500">
              Reminder only — confirm before recording.
            </p>

          </div>

        </header>


        {/* WALLET */}
        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Wallet
          </p>

          <div className="mt-2 flex flex-wrap gap-3">

            <Link
              href="/recurring?wallet=personal"
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
                href="/recurring?wallet=couple"
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


        <div className="mt-6">

          <RecurringManager
            walletId={
              activeWallet.id
            }
            walletType={
              activeWallet.wallet_type
            }
            userId={
              user.id
            }
            today={
              today
            }
            categories={
              categories.map(
                (category) => ({
                  id:
                    category.id,

                  name_en:
                    category.name_en,

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
            rules={
              (rules ?? []).map(
                (rule) => ({
                  ...rule,

                  amount:
                    Number(
                      rule.amount
                    ),

                  transaction_type:
                    rule.transaction_type as
                      | "income"
                      | "expense",

                  payment_method:
                    rule.payment_method as
                      | "wallet"
                      | "personal_advance"
                      | null,

                  frequency:
                    rule.frequency as
                      | "weekly"
                      | "monthly",
                })
              )
            }
          />

        </div>

      </div>

    </main>
  );
}