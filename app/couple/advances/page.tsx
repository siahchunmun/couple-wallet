import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import SettleAdvanceForm from "@/components/settle-advance-form";


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


export default async function CoupleAdvancesPage() {
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
  // Couple Wallet
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
  // Members
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


  // =========================================
  // Advances + Settlements
  // =========================================

  const {
    data: transactions,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      transaction_type,
      amount,
      payment_method,
      related_user_id
    `)
    .eq(
      "wallet_id",
      coupleWallet.id
    )
    .in(
      "transaction_type",
      [
        "expense",
        "settlement",
      ]
    )
    .not(
      "related_user_id",
      "is",
      null
    );


  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }


  // =========================================
  // Calculate Outstanding Per Person
  //
  // NO automatic netting between partners.
  // =========================================

  const outstandingMap =
    new Map<
      string,
      number
    >();


  for (
    const transaction
    of transactions ?? []
  ) {

    if (
      !transaction.related_user_id
    ) {
      continue;
    }


    const current =
      outstandingMap.get(
        transaction.related_user_id
      ) ?? 0;


    const amount =
      Number(
        transaction.amount
      );


    if (
      transaction.transaction_type ===
        "expense" &&
      transaction.payment_method ===
        "personal_advance"
    ) {

      outstandingMap.set(
        transaction.related_user_id,
        current + amount
      );

    }


    if (
      transaction.transaction_type ===
        "settlement"
    ) {

      outstandingMap.set(
        transaction.related_user_id,
        current - amount
      );

    }

  }


  const outstandingMembers =
    memberIds
      .map(
        (memberId) => ({

          userId:
            memberId,

          name:
            profileMap.get(
              memberId
            ) ||
            "Partner",

          amount:
            Math.max(
              0,
              outstandingMap.get(
                memberId
              ) ?? 0
            ),

        })
      )
      .filter(
        (member) =>
          member.amount >
          0.005
      );


  const totalOutstanding =
    outstandingMembers.reduce(
      (
        total,
        member
      ) =>
        total +
        member.amount,

      0
    );


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
              Outstanding Advances
            </h1>

            <p className="text-sm text-gray-500">
              ❤️ {coupleWallet.name}
            </p>

          </div>

        </header>


        {/* Total */}
        <section className="mt-8 rounded-3xl bg-gray-900 p-6 text-white">

          <p className="text-sm text-gray-400">
            Total Outstanding
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            RM{" "}
            {formatMoney(
              totalOutstanding
            )}
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            Money the shared wallet still needs to reimburse.
          </p>

        </section>


        {/* Nothing Outstanding */}
        {outstandingMembers.length ===
        0 ? (

          <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-8 text-center">

            <div className="text-4xl">
              ✅
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              All settled
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              There are no outstanding personal advances.
            </p>

          </section>

        ) : (

          /* Members */

          <section className="mt-6 space-y-4">

            {outstandingMembers.map(
              (member) => (

                <article
                  key={
                    member.userId
                  }
                  className="rounded-3xl border border-gray-100 bg-white p-6"
                >

                  <p className="text-sm text-gray-500">
                    Our Wallet owes
                  </p>


                  <div className="mt-1 flex items-end justify-between gap-4">

                    <div>

                      <h2 className="text-xl font-bold text-gray-900">

                        {member.name}

                        {member.userId ===
                        user.id
                          ? " (You)"
                          : ""}

                      </h2>

                    </div>


                    <p className="text-xl font-bold text-gray-900">
                      RM{" "}
                      {formatMoney(
                        member.amount
                      )}
                    </p>

                  </div>


                  <SettleAdvanceForm
                    walletId={
                      coupleWallet.id
                    }
                    recipientUserId={
                      member.userId
                    }
                    recipientName={
                      member.name
                    }
                    outstanding={
                      member.amount
                    }
                  />

                </article>

              )
            )}

          </section>

        )}

      </div>

    </main>
  );
}