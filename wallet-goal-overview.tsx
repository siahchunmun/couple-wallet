import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type WalletGoalOverviewProps = {
  walletId: string;
  walletName: string;
  walletType: string;
  walletTotal: number;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function WalletGoalOverview({
  walletId,
  walletName,
  walletType,
  walletTotal,
}: WalletGoalOverviewProps) {
  const supabase = await createClient();

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
  .eq("wallet_id", walletId)
  .in("status", ["active", "completed"])
  .order("created_at", {
    ascending: true,
  });

  if (goalError) {
    throw new Error(goalError.message);
  }

  const goalIds =
    (goalRows ?? []).map(
      (goal) => goal.id
    );

  // =========================================
  // GOAL MOVEMENTS
  // =========================================

  let movementRows: {
    goal_id: string;
    movement_type: string;
    amount: number;
  }[] = [];

  if (goalIds.length > 0) {
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
      .in("goal_id", goalIds);

    if (movementError) {
      throw new Error(
        movementError.message
      );
    }

    movementRows = data ?? [];
  }

  // =========================================
  // CALCULATE EACH GOAL BALANCE
  // =========================================

  const goalBalanceMap =
    new Map<string, number>();

  for (const movement of movementRows) {
    const current =
      goalBalanceMap.get(
        movement.goal_id
      ) ?? 0;

    const amount =
      Number(movement.amount);

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
        id: goal.id,

        name: goal.name,

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

  // =========================================
  // RESERVED + AVAILABLE
  // =========================================

  const totalReserved =
    goals.reduce(
      (total, goal) =>
        total + goal.balance,
      0
    );

  const availableBalance =
    walletTotal -
    totalReserved;

  const walletParam =
    walletType === "couple"
      ? "couple"
      : "personal";

  return (
    <>
      {/* ================================= */}
      {/* BALANCE CARD */}
      {/* ================================= */}

      <section className="mt-6 rounded-3xl border border-[#3A301B] bg-gradient-to-br from-[#17140D] via-[#101010] to-[#080808] p-6 text-[#F5F0E6] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">

        <div className="flex items-center justify-between gap-4">

          <p className="text-sm text-gray-300">
            {walletType === "couple"
              ? "❤️"
              : "👤"}{" "}
            {walletName}
          </p>

          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">

            {walletType === "couple"
              ? "Shared"
              : "Personal"}

          </span>

        </div>


        {/* AVAILABLE */}
        <p className="mt-6 text-sm text-gray-400">
          Available Balance
        </p>

        <h2 className="mt-1 text-4xl font-bold">
          RM{" "}
          {formatMoney(
            availableBalance
          )}
        </h2>


        {/* RESERVED / TOTAL */}
        <div className="mt-6 grid grid-cols-2 gap-3">

          <div className="rounded-2xl border border-[#302819] bg-[#17140D] p-4">

            <p className="text-xs text-gray-400">
              Reserved in Goals
            </p>

            <p className="mt-1 font-semibold">
              RM{" "}
              {formatMoney(
                totalReserved
              )}
            </p>

          </div>


          <div className="rounded-2xl border border-[#302819] bg-[#17140D] p-4">

            <p className="text-xs text-gray-400">
              Total Wallet Value
            </p>

            <p className="mt-1 font-semibold">
              RM{" "}
              {formatMoney(
                walletTotal
              )}
            </p>

          </div>

        </div>


        {totalReserved > 0 && (
          <p className="mt-4 text-xs text-gray-400">
            Available + Reserved =
            Total Wallet Value
          </p>
        )}

      </section>


      {/* ================================= */}
      {/* SAVINGS GOALS */}
      {/* ================================= */}

      <section className="mt-8">

        <div className="flex items-center justify-between gap-4">

          <h2 className="text-lg font-semibold text-gray-900">
            Savings Goals
          </h2>

          <Link
            href={`/goals?wallet=${walletParam}`}
            className="text-sm font-semibold text-gray-600"
          >
            Manage →
          </Link>

        </div>


        {goals.length === 0 ? (

          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">

            <p className="font-medium text-gray-900">
              No Savings Goals yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Set money aside without counting it as an expense.
            </p>

            <Link
              href={`/goals?wallet=${walletParam}`}
              className="mt-4 inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create Goal
            </Link>

          </div>

        ) : (

          <div className="mt-3 space-y-3">

            {goals
              .slice(0, 3)
              .map((goal) => {
                const progress =
                  goal.targetAmount > 0
                    ? (
                        goal.balance /
                        goal.targetAmount
                      ) * 100
                    : 0;

                return (
                  <Link
                    key={goal.id}
                    href={`/goals?wallet=${walletParam}`}
                    className="block rounded-2xl border border-gray-100 bg-white p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="truncate font-semibold text-gray-900">
                          🎯 {goal.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          RM{" "}
                          {formatMoney(
                            goal.balance
                          )}
                          {" / "}
                          RM{" "}
                          {formatMoney(
                            goal.targetAmount
                          )}
                        </p>

                      </div>


                      {goal.status ===
                        "completed" && (

                        <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Completed
                        </span>

                      )}

                    </div>


                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className="h-full rounded-full bg-gray-900"
                        style={{
                          width:
                            `${Math.min(
                              progress,
                              100
                            )}%`,
                        }}
                      />

                    </div>


                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">

                      <span>
                        {progress.toFixed(
                          1
                        )}
                        %
                      </span>

                      <span>
                        RM{" "}
                        {formatMoney(
                          Math.max(
                            goal.targetAmount -
                              goal.balance,
                            0
                          )
                        )}{" "}
                        left
                      </span>

                    </div>

                  </Link>
                );
              })}

          </div>

        )}

      </section>
    </>
  );
}