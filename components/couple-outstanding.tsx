import Link from "next/link";

import {
  createClient,
} from "@/lib/supabase/server";


type CoupleOutstandingProps = {
  walletId: string;
};


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


export default async function CoupleOutstanding({
  walletId,
}: CoupleOutstandingProps) {
  const supabase =
    await createClient();


  // =========================================
  // Transactions
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
      walletId
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


  const memberIds =
    Array.from(
      outstandingMap.keys()
    );


  if (
    memberIds.length === 0
  ) {
    return null;
  }


  const {
    data: profiles,
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


  const profileMap =
    new Map(
      (profiles ?? []).map(
        (profile) => [
          profile.id,
          profile.display_name,
        ]
      )
    );


  const outstanding =
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


  if (
    outstanding.length === 0
  ) {
    return null;
  }


  return (
    <section className="mt-6">

      <div className="flex items-center justify-between">

        <h2 className="text-lg font-semibold text-gray-900">
          Outstanding
        </h2>


        <Link
          href="/couple/advances"
          className="text-sm font-semibold text-gray-600"
        >
          Manage →
        </Link>

      </div>


      <div className="mt-3 space-y-3">

        {outstanding.map(
          (member) => (

            <Link
              key={
                member.userId
              }
              href="/couple/advances"
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5"
            >

              <div>

                <p className="text-sm text-gray-500">
                  Our Wallet owes
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {member.name}
                </p>

              </div>


              <p className="font-bold text-gray-900">
                RM{" "}
                {formatMoney(
                  member.amount
                )}
              </p>

            </Link>

          )
        )}

      </div>

    </section>
  );
}