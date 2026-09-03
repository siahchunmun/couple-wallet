import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  getTranslations,
} from "next-intl/server";

import {
  createClient,
} from "@/lib/supabase/server";

import LogoutButton from "@/components/logout-button";


type MorePageProps = {
  searchParams:
    Promise<{
      wallet?: string;
    }>;
};


export default async function MorePage({
  searchParams,
}: MorePageProps) {
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
  // PROFILE
  // =========================================

  const {
    data: profile,
  } = await supabase
    .from("profiles")
    .select(`
      display_name
    `)
    .eq(
      "id",
      user.id
    )
    .single();


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


  const walletMode =
    activeWallet.wallet_type ===
      "couple"
      ? "couple"
      : "personal";


  const t =
    await getTranslations(
      "Navigation"
    );


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* HEADER */}
        <header>

          <p className="text-sm text-gray-500">
            {profile?.display_name ||
              "Account"}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {t("more")}
          </h1>

        </header>


        {/* WALLET SWITCHER */}
        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Wallet
          </p>


          <div className="mt-2 flex flex-wrap gap-3">

            <Link
              href="/more?wallet=personal"
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                walletMode ===
                "personal"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              👤 My Wallet
            </Link>


            {coupleWallet && (

              <Link
                href="/more?wallet=couple"
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                  walletMode ===
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


        {/* ACTIVE WALLET */}
        <section className="mt-6 rounded-3xl bg-gray-900 p-5 text-white">

          <p className="text-xs text-gray-400">
            Current wallet
          </p>

          <p className="mt-1 text-lg font-bold">

            {walletMode ===
            "couple"
              ? "❤️"
              : "👤"}{" "}

            {activeWallet.name}

          </p>

        </section>


        {/* MONEY TOOLS */}
        <section className="mt-8">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Money Tools
          </h2>


          <div className="mt-3 overflow-hidden rounded-3xl border border-gray-100 bg-white">

            <MenuItem
              href={`/goals?wallet=${walletMode}`}
              icon="🎯"
              title={
                t("goals")
              }
              description="Set money aside for future plans."
            />


            <MenuItem
              href={`/recurring?wallet=${walletMode}`}
              icon="🔁"
              title={
                t(
                  "recurring"
                )
              }
              description="Review recurring transaction reminders."
            />


            <MenuItem
              href={`/reports?wallet=${walletMode}`}
              icon="📊"
              title={
                t("reports")
              }
              description="See monthly spending and financial trends."
            />


            <MenuItem
              href={`/categories?wallet=${walletMode}`}
              icon="🏷️"
              title={
                t(
                  "categories"
                )
              }
              description="Manage system and custom categories."
              last
            />

          </div>

        </section>


        {/* WALLET TOOLS */}
        <section className="mt-8">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Wallet
          </h2>


          <div className="mt-3 overflow-hidden rounded-3xl border border-gray-100 bg-white">

            {coupleWallet && (

              <MenuItem
                href="/transfer"
                icon="⇄"
                title="Transfer"
                description="Move money from your Personal Wallet to the Couple Wallet."
              />

            )}


            <MenuItem
              href="/couple"
              icon="❤️"
              title={
                coupleWallet
                  ? "Couple Wallet"
                  : "Create Couple Wallet"
              }
              description={
                coupleWallet
                  ? "View your shared wallet and partner."
                  : "Create or join a shared wallet."
              }
              last
            />

          </div>

        </section>


        {/* ACCOUNT */}
        <section className="mt-8">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Account
          </h2>


          <div className="mt-3 overflow-hidden rounded-3xl border border-gray-100 bg-white">

            <MenuItem
              href={`/settings?wallet=${walletMode}`}
              icon="⚙️"
              title={
                t(
                  "settings"
                )
              }
              description="Profile, language and preferences."
              last
            />

          </div>

        </section>


        {/* LOGOUT */}
        <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-5">

          <LogoutButton />

        </section>

      </div>

    </main>
  );
}


function MenuItem({
  href,
  icon,
  title,
  description,
  last = false,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <Link
      href={
        href
      }
      className={`flex items-center gap-4 p-5 ${
        !last
          ? "border-b border-gray-100"
          : ""
      }`}
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
        {icon}
      </div>


      <div className="min-w-0 flex-1">

        <p className="font-semibold text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>

      </div>


      <span className="text-xl text-gray-300">
        ›
      </span>

    </Link>
  );
}