"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";


type SettleAdvanceFormProps = {
  walletId: string;
  recipientUserId: string;
  recipientName: string;
  outstanding: number;
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


export default function SettleAdvanceForm({
  walletId,
  recipientUserId,
  recipientName,
  outstanding,
}: SettleAdvanceFormProps) {
  const router =
    useRouter();


  const [amount, setAmount] =
    useState(
      outstanding.toFixed(2)
    );


  const [date, setDate] =
    useState(
      new Intl.DateTimeFormat(
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
      )
    );


  const [note, setNote] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  async function handleSubmit(
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
      numericAmount >
      outstanding
    ) {
      setError(
        `Maximum settlement is RM ${formatMoney(
          outstanding
        )}.`
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
        "settle_advance",
        {
          wallet_id:
            walletId,

          recipient_user_id:
            recipientUserId,

          amount:
            numericAmount,

          occurred_on:
            date,

          note:
            note.trim() || null,
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
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-4"
    >

      {/* Amount */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Settlement amount
        </label>


        <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">
            RM
          </div>


          <input
            type="number"
            min="0.01"
            step="0.01"
            max={
              outstanding
            }
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
            className="w-full px-4 py-3 text-gray-900 outline-none"
          />

        </div>


        <p className="mt-1 text-xs text-gray-400">
          Outstanding: RM{" "}
          {formatMoney(
            outstanding
          )}
        </p>

      </div>


      {/* Date */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Date
        </label>


        <input
          type="date"
          value={date}
          onChange={(
            event
          ) =>
            setDate(
              event.target.value
            )
          }
          required
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
        />

      </div>


      {/* Note */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Note
          <span className="ml-1 font-normal text-gray-400">
            Optional
          </span>
        </label>


        <textarea
          value={note}
          onChange={(
            event
          ) =>
            setNote(
              event.target.value
            )
          }
          rows={2}
          placeholder={`e.g. Reimburse ${recipientName}`}
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
        className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Settling..."
          : `Settle ${recipientName}`}
      </button>

    </form>
  );
}