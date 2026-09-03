import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CoupleSetup from "@/components/couple-setup";
import InviteShare from "@/components/invite-share";


type CouplePageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};


export default async function CouplePage({
  searchParams,
}: CouplePageProps) {
  const params =
    await searchParams;

  const inviteCodeFromUrl =
    params.code
      ?.replace(/\s+/g, "")
      .toUpperCase() ?? "";

  const supabase =
    await createClient();


  // =========================================
  // User
  // =========================================

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }


  // =========================================
  // Existing Couple Wallet
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
      status,
      created_by
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
    wallets?.[0] ?? null;


  // =========================================
  // Members
  // =========================================

  let members: {
    user_id: string;
  }[] = [];

  if (coupleWallet) {
    const {
      data,
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

    members = data ?? [];
  }


  // =========================================
  // Active Invite
  // Only creator can retrieve it
  // =========================================

  let activeInviteCode = "";

  if (
    coupleWallet &&
    members.length === 1 &&
    coupleWallet.created_by === user.id
  ) {
    const {
      data: inviteData,
      error: inviteError,
    } = await supabase.rpc(
      "get_my_active_couple_invite",
      {
        target_wallet_id:
          coupleWallet.id,
      }
    );

    if (inviteError) {
      throw new Error(
        inviteError.message
      );
    }

    const invite =
      Array.isArray(inviteData)
        ? inviteData[0]
        : inviteData;

    activeInviteCode =
      invite?.invite_code ?? "";
  }


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-xl px-4 py-6">

        {/* Header */}
        <header className="flex items-center gap-4">

          <Link
            href="/?wallet=couple"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>

          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Couple Wallet
            </h1>

            <p className="text-sm text-gray-500">
              Manage money together ❤️
            </p>

          </div>

        </header>


        {/* Already has Couple Wallet */}
        {coupleWallet ? (

          <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6">

            <div className="text-4xl">
              ❤️
            </div>


            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {coupleWallet.name}
            </h2>


            <p className="mt-2 text-gray-500">

              {members.length === 1
                ? "Waiting for your partner to join."
                : "You and your partner are connected."}

            </p>


            <div className="mt-6 rounded-2xl bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Members
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {members.length} / 2
              </p>

            </div>


            {/* Invite still available */}
            {activeInviteCode && (
              <div className="mt-6">

                <h3 className="mb-3 font-semibold text-gray-900">
                  Invite your partner
                </h3>

                <InviteShare
                  inviteCode={
                    activeInviteCode
                  }
                />

              </div>
            )}


            {members.length === 2 && (
              <div className="mt-6 rounded-2xl bg-green-50 p-4">

                <p className="font-medium text-green-800">
                  ❤️ Partner connected
                </p>

                <p className="mt-1 text-sm text-green-700">
                  Your shared wallet is ready to use.
                </p>

              </div>
            )}

          </section>

        ) : (

          /* No Couple Wallet yet */
          <CoupleSetup
            initialInviteCode={
              inviteCodeFromUrl
            }
          />

        )}

      </div>

    </main>
  );
}