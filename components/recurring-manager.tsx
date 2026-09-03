"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";


type Category = {
  id: string;
  name_en: string;
  category_type:
    | "income"
    | "expense"
    | "both";
};


type Member = {
  user_id: string;
  display_name: string;
};


type RecurringRule = {
  id: string;
  transaction_type:
    | "income"
    | "expense";

  amount: number;
  description: string;
  source: string | null;
  category_id: string;
  payment_method:
    | "wallet"
    | "personal_advance"
    | null;

  related_user_id: string | null;
  contributor_user_id: string | null;

  frequency:
    | "weekly"
    | "monthly";

  next_due_date: string;
  note: string | null;
};


type RecurringManagerProps = {
  walletId: string;
  walletType: string;
  userId: string;
  today: string;

  categories: Category[];
  members: Member[];
  rules: RecurringRule[];
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


function formatDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en-MY",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone:
        "Asia/Kuala_Lumpur",
    }
  ).format(
    new Date(
      `${date}T00:00:00+08:00`
    )
  );
}


export default function RecurringManager({
  walletId,
  walletType,
  userId,
  today,
  categories,
  members,
  rules,
}: RecurringManagerProps) {
  const router =
    useRouter();


  const [type, setType] =
    useState<
      "income" | "expense"
    >("expense");


  const [amount, setAmount] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [source, setSource] =
    useState("");

  const [
    categoryId,
    setCategoryId,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      "wallet" |
      "personal_advance"
    >("wallet");

  const [
    advanceUserId,
    setAdvanceUserId,
  ] =
    useState(userId);

  const [
    contributorUserId,
    setContributorUserId,
  ] =
    useState(userId);

  const [
    frequency,
    setFrequency,
  ] =
    useState<
      "weekly" |
      "monthly"
    >("monthly");

  const [
    nextDueDate,
    setNextDueDate,
  ] =
    useState(today);

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const availableCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          category.category_type ===
            type ||
          category.category_type ===
            "both"
      );
    }, [
      categories,
      type,
    ]);


  function changeType(
    newType:
      | "income"
      | "expense"
  ) {
    setType(newType);
    setCategoryId("");
    setError("");
  }


  // =========================================
  // CREATE RULE
  // =========================================

  async function createRule(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");


    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid amount."
      );

      return;
    }


    if (
      !description.trim()
    ) {
      setError(
        "Please enter a description."
      );

      return;
    }


    if (!categoryId) {
      setError(
        "Please choose a category."
      );

      return;
    }


    setLoading(true);


    const supabase =
      createClient();


    const {
      error: rpcError,
    } =
      await supabase.rpc(
        "create_recurring_rule",
        {
          wallet_id:
            walletId,

          transaction_type:
            type,

          amount:
            numericAmount,

          description:
            description.trim(),

          source:
            type === "income"
              ? source.trim() ||
                null
              : null,

          category_id:
            categoryId,

          payment_method:
            type === "expense"
                ? walletType === "personal"
                ? "wallet"
                : paymentMethod
                : null,

            related_user_id:
            type === "expense" &&
            walletType === "couple" &&
            paymentMethod ===
                "personal_advance"
                ? advanceUserId
                : null,

          contributor_user_id:
            type === "income"
              ? contributorUserId
              : null,

          frequency,

          next_due_date:
            nextDueDate,

          note:
            note.trim() ||
            null,
        }
      );


    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }


    setAmount("");
    setDescription("");
    setSource("");
    setCategoryId("");
    setNote("");

    router.refresh();

    setLoading(false);
  }


  // =========================================
  // CONFIRM
  // =========================================

  async function confirmRule(
    ruleId: string
  ) {
    setLoading(true);
    setError("");


    const supabase =
      createClient();


    const {
      error: rpcError,
    } =
      await supabase.rpc(
        "confirm_recurring_rule",
        {
          rule_id:
            ruleId,
        }
      );


    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }


    router.refresh();

    setLoading(false);
  }


  // =========================================
  // SKIP
  // =========================================

  async function skipRule(
    ruleId: string
  ) {
    const confirmed =
      window.confirm(
        "Skip this occurrence? No transaction will be created."
      );


    if (!confirmed) {
      return;
    }


    setLoading(true);
    setError("");


    const supabase =
      createClient();


    const {
      error: rpcError,
    } =
      await supabase.rpc(
        "skip_recurring_rule",
        {
          rule_id:
            ruleId,
        }
      );


    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }


    router.refresh();

    setLoading(false);
  }


  return (
    <div className="space-y-8">

      {/* ================================= */}
      {/* CREATE */}
      {/* ================================= */}

      <section className="rounded-3xl border border-gray-100 bg-white p-6">

        <h2 className="text-lg font-bold text-gray-900">
          New Recurring Transaction
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          This creates a reminder only.
          Nothing is recorded until you confirm it.
        </p>


        <form
          onSubmit={
            createRule
          }
          className="mt-6 space-y-5"
        >

          {/* TYPE */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              Type
            </label>

            <div className="mt-2 grid grid-cols-2 rounded-xl bg-gray-100 p-1">

              <button
                type="button"
                onClick={() =>
                  changeType(
                    "expense"
                  )
                }
                className={`rounded-lg py-2.5 text-sm font-semibold ${
                  type ===
                  "expense"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Expense
              </button>


              <button
                type="button"
                onClick={() =>
                  changeType(
                    "income"
                  )
                }
                className={`rounded-lg py-2.5 text-sm font-semibold ${
                  type ===
                  "income"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Income
              </button>

            </div>

          </div>


          {/* AMOUNT */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              Amount
            </label>

            <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200">

              <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">
                RM
              </div>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={
                  amount
                }
                onChange={(
                  event
                ) =>
                  setAmount(
                    event.target.value
                  )
                }
                required
                placeholder="0.00"
                className="w-full px-4 py-3 text-gray-900 outline-none"
              />

            </div>

          </div>


          {/* DESCRIPTION */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              Description
            </label>

            <input
              type="text"
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target.value
                )
              }
              required
              placeholder={
                type === "expense"
                  ? "e.g. Netflix"
                  : "e.g. Monthly Contribution"
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
            />

          </div>


          {/* INCOME */}
          {type === "income" && (
            <>

              <div>

                <label className="text-sm font-medium text-gray-700">
                  Source
                </label>

                <input
                  type="text"
                  value={
                    source
                  }
                  onChange={(
                    event
                  ) =>
                    setSource(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Salary"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
                />

              </div>


              <div>

                <label className="text-sm font-medium text-gray-700">
                  Added by
                </label>

                <select
                  value={
                    contributorUserId
                  }
                  onChange={(
                    event
                  ) =>
                    setContributorUserId(
                      event.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
                >

                  {members.map(
                    (member) => (

                      <option
                        key={
                          member.user_id
                        }
                        value={
                          member.user_id
                        }
                      >
                        {
                          member.display_name
                        }

                        {member.user_id ===
                        userId
                          ? " (You)"
                          : ""}
                      </option>

                    )
                  )}

                </select>

              </div>

            </>
          )}


          {/* EXPENSE PAYMENT */}
          {type === "expense" && (
            <div>

              <label className="text-sm font-medium text-gray-700">
                Paid from
              </label>

                <select
                value={
                    walletType === "personal"
                    ? "wallet"
                    : paymentMethod
                }
                onChange={(
                  event
                ) =>
                  setPaymentMethod(
                    event.target.value as
                      | "wallet"
                      | "personal_advance"
                  )
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
              >

                <option value="wallet">
                  {walletType ===
                  "couple"
                    ? "❤️ Our Wallet"
                    : "👤 My Wallet"}
                </option>


                {walletType ===
                  "couple" && (

                  <option value="personal_advance">
                    👤 Paid Personally
                  </option>

                )}

              </select>


              {walletType ===
                "couple" &&
              paymentMethod ===
                "personal_advance" && (

                <div className="mt-4">

                  <label className="text-sm font-medium text-gray-700">
                    Who will pay?
                  </label>

                  <select
                    value={
                      advanceUserId
                    }
                    onChange={(
                      event
                    ) =>
                      setAdvanceUserId(
                        event.target.value
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
                  >

                    {members.map(
                      (member) => (

                        <option
                          key={
                            member.user_id
                          }
                          value={
                            member.user_id
                          }
                        >
                          {
                            member.display_name
                          }

                          {member.user_id ===
                          userId
                            ? " (You)"
                            : ""}
                        </option>

                      )
                    )}

                  </select>

                </div>

              )}

            </div>
          )}


          {/* CATEGORY */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              Category
            </label>

            <select
              value={
                categoryId
              }
              onChange={(
                event
              ) =>
                setCategoryId(
                  event.target.value
                )
              }
              required
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
            >

              <option value="">
                Select category
              </option>


              {availableCategories.map(
                (category) => (

                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name_en
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* FREQUENCY */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              Repeat
            </label>

            <select
              value={
                frequency
              }
              onChange={(
                event
              ) =>
                setFrequency(
                  event.target.value as
                    | "weekly"
                    | "monthly"
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
            >

              <option value="weekly">
                Every week
              </option>

              <option value="monthly">
                Every month
              </option>

            </select>

          </div>


          {/* NEXT DUE */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              First / Next Due Date
            </label>

            <input
              type="date"
              value={
                nextDueDate
              }
              onChange={(
                event
              ) =>
                setNextDueDate(
                  event.target.value
                )
              }
              required
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
            />

          </div>


          {/* NOTE */}
          <div>

            <label className="text-sm font-medium text-gray-700">
              Note
              <span className="ml-1 font-normal text-gray-400">
                Optional
              </span>
            </label>

            <textarea
              value={
                note
              }
              onChange={(
                event
              ) =>
                setNote(
                  event.target.value
                )
              }
              rows={2}
              className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
            />

          </div>


          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full rounded-xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Create Reminder"}
          </button>

        </form>

      </section>


      {/* ================================= */}
      {/* RULE LIST */}
      {/* ================================= */}

      <section>

        <h2 className="text-lg font-bold text-gray-900">
          Recurring Reminders
        </h2>


        {rules.length === 0 ? (

          <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-8 text-center">

            <div className="text-4xl">
              🔁
            </div>

            <p className="mt-3 font-semibold text-gray-900">
              No recurring reminders
            </p>

          </div>

        ) : (

          <div className="mt-3 space-y-4">

            {rules.map(
              (rule) => {

                const isDue =
                  rule.next_due_date <=
                  today;


                const category =
                  categories.find(
                    (item) =>
                      item.id ===
                      rule.category_id
                  );


                return (

                  <article
                    key={
                      rule.id
                    }
                    className="rounded-3xl border border-gray-100 bg-white p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-bold text-gray-900">
                            {
                              rule.description
                            }
                          </p>


                          {isDue && (

                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                              Due
                            </span>

                          )}

                        </div>


                        <p className="mt-1 text-sm text-gray-500">
                          {
                            category?.name_en ??
                            "Category"
                          }
                          {" • "}
                          {rule.frequency ===
                          "weekly"
                            ? "Weekly"
                            : "Monthly"}
                        </p>

                      </div>


                      <p
                        className={`shrink-0 font-bold ${
                          rule.transaction_type ===
                          "income"
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >

                        {rule.transaction_type ===
                        "income"
                          ? "+"
                          : "-"}

                        RM{" "}

                        {formatMoney(
                          rule.amount
                        )}

                      </p>

                    </div>


                    <div className="mt-4 rounded-xl bg-gray-50 p-3">

                      <p className="text-xs text-gray-400">
                        {isDue
                          ? "Due date"
                          : "Next due"}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-700">
                        {formatDate(
                          rule.next_due_date
                        )}
                      </p>

                    </div>


                    {isDue ? (

                      <div className="mt-4 grid grid-cols-2 gap-3">

                        <button
                          type="button"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            confirmRule(
                              rule.id
                            )
                          }
                          className="rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Confirm
                        </button>


                        <button
                          type="button"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            skipRule(
                              rule.id
                            )
                          }
                          className="rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 disabled:opacity-50"
                        >
                          Skip
                        </button>

                      </div>

                    ) : (

                      <p className="mt-4 text-sm text-gray-400">
                        No action needed yet.
                      </p>

                    )}

                  </article>

                );
              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}