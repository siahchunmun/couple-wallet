import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import GoalManager from "@/components/goal-manager";


type GoalsPageProps = {
  searchParams: Promise<{
    wallet?: string;
  }>;
};


export default async function GoalsPage({
  searchParams,
}: GoalsPageProps) {
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
  // WALLET TRANSACTIONS
  // =========================================

  const {
    data: transactions,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      transaction_type,
      amount,
      payment_method
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    );


  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }


  // =========================================
  // WALLET TOTAL
  // =========================================

  const walletTotal =
    (transactions ?? []).reduce(
      (
        total,
        transaction
      ) => {

        const amount =
          Number(
            transaction.amount
          );


        if (
          transaction.transaction_type ===
            "income" ||
          transaction.transaction_type ===
            "transfer_in"
        ) {
          return total + amount;
        }


        if (
          transaction.transaction_type ===
            "expense" &&
          transaction.payment_method ===
            "wallet"
        ) {
          return total - amount;
        }


        if (
          transaction.transaction_type ===
            "transfer_out" ||
          transaction.transaction_type ===
            "settlement"
        ) {
          return total - amount;
        }


        return total;

      },
      0
    );


  // =========================================
  // GOALS
  // =========================================

  const {
    data: goalRows,
    error: goalError,
  } = await supabase
    .from("savings_goals")
    .select(`
      id,
      name,
      target_amount,
      status,
      created_at
    `)
    .eq(
      "wallet_id",
      activeWallet.id
    )
    .order(
      "created_at",
      {
        ascending:
          true,
      }
    );


  if (goalError) {
    throw new Error(
      goalError.message
    );
  }


  const goalIds =
    (goalRows ?? []).map(
      (goal) =>
        goal.id
    );


  // =========================================
  // GOAL MOVEMENTS
  // =========================================

  let movementRows: {
    goal_id: string;
    movement_type: string;
    amount: number;
  }[] = [];


  if (
    goalIds.length > 0
  ) {

    const {
      data,
      error: movementError,
    } = await supabase
      .from("goal_movements")
      .select(`
        goal_id,
        movement_type,
        amount
      `)
      .in(
        "goal_id",
        goalIds
      );


    if (movementError) {
      throw new Error(
        movementError.message
      );
    }


    movementRows =
      data ?? [];

  }


  // =========================================
  // GOAL BALANCES
  // =========================================

  const goalBalanceMap =
    new Map<
      string,
      number
    >();


  for (
    const movement
    of movementRows
  ) {

    const current =
      goalBalanceMap.get(
        movement.goal_id
      ) ?? 0;


    const amount =
      Number(
        movement.amount
      );


    if (
      movement.movement_type ===
      "allocate"
    ) {

      goalBalanceMap.set(
        movement.goal_id,
        current + amount
      );

    }


    if (
      movement.movement_type ===
      "withdraw"
    ) {

      goalBalanceMap.set(
        movement.goal_id,
        current - amount
      );

    }

  }


  const goals =
    (goalRows ?? []).map(
      (goal) => ({

        id:
          goal.id,

        name:
          goal.name,

        targetAmount:
          Number(
            goal.target_amount
          ),

        balance:
          Math.max(
            0,
            goalBalanceMap.get(
              goal.id
            ) ?? 0
          ),

        status:
          goal.status,

      })
    );


  const totalAllocated =
    goals.reduce(
      (
        total,
        goal
      ) =>
        total +
        goal.balance,
      0
    );


  const availableBalance =
    walletTotal -
    totalAllocated;


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* HEADER */}
        <header className="flex items-center gap-4">

          <Link
            href={`/?wallet=${activeWallet.wallet_type}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>


          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Savings Goals
            </h1>

            <p className="text-sm text-gray-500">
              Set money aside for what matters.
            </p>

          </div>

        </header>


        {/* WALLET SWITCHER */}
        <section className="mt-8">

          <p className="text-sm font-medium text-gray-500">
            Wallet
          </p>


          <div className="mt-2 flex flex-wrap gap-3">

            <Link
              href="/goals?wallet=personal"
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
                href="/goals?wallet=couple"
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


        {/* GOALS */}
        <div className="mt-6">

          <GoalManager
            walletId={
              activeWallet.id
            }

            walletName={
              activeWallet.name
            }

            walletType={
              activeWallet.wallet_type
            }

            walletTotal={
              walletTotal
            }

            availableBalance={
              availableBalance
            }

            totalAllocated={
              totalAllocated
            }

            goals={
              goals
            }
          />

        </div>

      </div>

    </main>
  );
}