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
  name_zh: string | null;
  category_type:
    | "income"
    | "expense"
    | "both";
};


type Member = {
  user_id: string;
  display_name: string;
};


type CoupleTransactionFormProps = {
  walletId: string;
  userId: string;
  categories: Category[];
  members: Member[];
};


export default function CoupleTransactionForm({
  walletId,
  userId,
  categories,
  members,
}: CoupleTransactionFormProps) {
  const router = useRouter();

  const [type, setType] =
    useState<
      "income" | "expense"
    >("expense");

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [source, setSource] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      "wallet" | "personal_advance"
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

  const [date, setDate] =
    useState(
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Kuala_Lumpur",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      ).format(new Date())
    );

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================
  // Categories
  // =========================================

  const availableCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          category.category_type ===
            type ||
          category.category_type ===
            "both"
      );
    }, [categories, type]);


  function changeType(
    newType: "income" | "expense"
  ) {
    setType(newType);
    setCategoryId("");
    setError("");
  }


  // =========================================
  // Submit
  // =========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
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


    if (!description.trim()) {
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


    if (
      type === "expense" &&
      paymentMethod ===
        "personal_advance" &&
      !advanceUserId
    ) {
      setError(
        "Please select who paid personally."
      );

      return;
    }


    if (
      type === "income" &&
      !contributorUserId
    ) {
      setError(
        "Please select who added the money."
      );

      return;
    }


    setLoading(true);

    const supabase =
      createClient();


    const {
      error: insertError,
    } = await supabase
      .from("transactions")
      .insert({

        wallet_id:
          walletId,

        created_by:
          userId,

        transaction_type:
          type,

        amount:
          numericAmount,

        description:
          description.trim(),

        source:
          type === "income"
            ? source.trim() || null
            : null,

        category_id:
          categoryId,

        payment_method:
          type === "expense"
            ? paymentMethod
            : null,

        // 垫付款的人
        related_user_id:
          type === "expense" &&
          paymentMethod ===
            "personal_advance"
            ? advanceUserId
            : null,

        // 收入是谁贡献
        contributor_user_id:
          type === "income"
            ? contributorUserId
            : null,

        occurred_on:
          date,

        note:
          note.trim() || null,
      });


    if (insertError) {
      setError(
        insertError.message
      );

      setLoading(false);

      return;
    }


    router.replace(
      "/?wallet=couple"
    );

    router.refresh();
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* TYPE */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Transaction type
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
              type === "expense"
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
              type === "income"
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

        <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">
            RM
          </div>

          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value
              )
            }
            required
            placeholder="0.00"
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 outline-none"
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
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          required
          maxLength={100}
          placeholder={
            type === "expense"
              ? "e.g. Dinner"
              : "e.g. September Contribution"
          }
          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
        />

      </div>


      {/* INCOME OPTIONS */}
      {type === "income" && (
        <>

          <div>

            <label className="text-sm font-medium text-gray-700">
              Source
            </label>

            <input
              type="text"
              value={source}
              onChange={(event) =>
                setSource(
                  event.target.value
                )
              }
              placeholder="e.g. Monthly contribution"
              maxLength={100}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none"
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
              onChange={(event) =>
                setContributorUserId(
                  event.target.value
                )
              }
              required
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none"
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


          <div className="mt-2 space-y-3">

            {/* Wallet */}
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4">

              <input
                type="radio"
                name="payment"
                checked={
                  paymentMethod ===
                  "wallet"
                }
                onChange={() =>
                  setPaymentMethod(
                    "wallet"
                  )
                }
              />

              <div>

                <p className="font-medium text-gray-900">
                  ❤️ Our Wallet
                </p>

                <p className="text-sm text-gray-500">
                  Deduct from shared wallet balance
                </p>

              </div>

            </label>


            {/* Personal Advance */}
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4">

              <input
                type="radio"
                name="payment"
                checked={
                  paymentMethod ===
                  "personal_advance"
                }
                onChange={() =>
                  setPaymentMethod(
                    "personal_advance"
                  )
                }
              />

              <div>

                <p className="font-medium text-gray-900">
                  👤 Paid Personally
                </p>

                <p className="text-sm text-gray-500">
                  Someone paid first using personal money
                </p>

              </div>

            </label>

          </div>


          {paymentMethod ===
            "personal_advance" && (

            <div className="mt-4">

              <label className="text-sm font-medium text-gray-700">
                Who paid?
              </label>

              <select
                value={
                  advanceUserId
                }
                onChange={(event) =>
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
          value={categoryId}
          onChange={(event) =>
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
                key={category.id}
                value={category.id}
              >
                {category.name_en}
              </option>
            )
          )}

        </select>

      </div>


      {/* DATE */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(event) =>
            setDate(
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
          value={note}
          onChange={(event) =>
            setNote(
              event.target.value
            )
          }
          rows={3}
          placeholder="Add a note..."
          className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
        />

      </div>


      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}


      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : type === "income"
          ? "Add Shared Income"
          : paymentMethod ===
            "personal_advance"
          ? "Add Advance Expense"
          : "Add Shared Expense"}
      </button>

    </form>
  );
}