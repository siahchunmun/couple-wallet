import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type DashboardRecurringAlertsProps = {
  walletId: string;
  walletType: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getMalaysiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(
    new Date(`${date}T00:00:00+08:00`)
  );
}

export default async function DashboardRecurringAlerts({
  walletId,
  walletType,
}: DashboardRecurringAlertsProps) {
  const supabase = await createClient();

  const today = getMalaysiaDate();

  const {
    data: dueRules,
    error,
  } = await supabase
    .from("recurring_rules")
    .select(`
      id,
      transaction_type,
      amount,
      description,
      frequency,
      next_due_date
    `)
    .eq("wallet_id", walletId)
    .eq("status", "active")
    .lte("next_due_date", today)
    .order("next_due_date", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!dueRules || dueRules.length === 0) {
    return null;
  }

  const walletParam =
    walletType === "couple"
      ? "couple"
      : "personal";

  const visibleRules =
    dueRules.slice(0, 3);

  return (
    <section className="mt-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">
            ⚠️ Recurring reminders
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {dueRules.length}{" "}
            {dueRules.length === 1
              ? "payment needs"
              : "payments need"}{" "}
            your attention
          </p>

        </div>


        <Link
          href={`/recurring?wallet=${walletParam}`}
          className="text-sm font-semibold text-gray-600"
        >
          Review →
        </Link>

      </div>


      {/* Due Rules */}
      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white">

        {visibleRules.map(
          (rule, index) => {

            const isToday =
              rule.next_due_date === today;

            const isIncome =
              rule.transaction_type ===
              "income";

            return (
              <Link
                key={rule.id}
                href={`/recurring?wallet=${walletParam}`}
                className={`flex items-center justify-between gap-4 p-4 ${
                  index !==
                  visibleRules.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >

                {/* Left */}
                <div className="min-w-0">

                  <p className="truncate font-semibold text-gray-900">
                    {rule.description}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">

                    {isToday ? (

                      <span className="font-semibold text-amber-600">
                        Due today
                      </span>

                    ) : (

                      <span className="font-semibold text-red-600">
                        Overdue
                      </span>

                    )}

                    <span className="text-gray-300">
                      •
                    </span>

                    <span className="text-gray-500">
                      {formatDate(
                        rule.next_due_date
                      )}
                    </span>

                    <span className="text-gray-300">
                      •
                    </span>

                    <span className="capitalize text-gray-500">
                      {rule.frequency}
                    </span>

                  </div>

                </div>


                {/* Amount */}
                <p
                  className={`shrink-0 font-bold ${
                    isIncome
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >

                  {isIncome
                    ? "+"
                    : "-"}

                  RM{" "}

                  {formatMoney(
                    Number(
                      rule.amount
                    )
                  )}

                </p>

              </Link>
            );
          }
        )}


        {/* More */}
        {dueRules.length > 3 && (

          <Link
            href={`/recurring?wallet=${walletParam}`}
            className="block border-t border-gray-100 p-4 text-center text-sm font-semibold text-gray-600"
          >
            View all {dueRules.length} reminders →
          </Link>

        )}

      </div>

    </section>
  );
}