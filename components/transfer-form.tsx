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


type TransferFormProps = {
  personalWalletId: string;
  personalWalletName: string;

  coupleWalletId: string;
  coupleWalletName: string;

  personalBalance: number;
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


export default function TransferForm({
  personalWalletId,
  personalWalletName,
  coupleWalletId,
  coupleWalletName,
  personalBalance,
}: TransferFormProps) {
  const router =
    useRouter();


  const [amount, setAmount] =
    useState("");


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


    setLoading(true);


    const supabase =
      createClient();


    const {
      error: rpcError,
    } =
      await supabase.rpc(
        "transfer_personal_to_couple",
        {
          from_wallet_id:
            personalWalletId,

          to_wallet_id:
            coupleWalletId,

          transfer_amount:
            numericAmount,

          transfer_date:
            date,

          transfer_note:
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

      {/* FROM / TO */}
      <div className="rounded-2xl bg-gray-50 p-5">

        <div className="flex items-center justify-between gap-4">

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              From
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              👤 {personalWalletName}
            </p>

          </div>


          <div className="text-xl text-gray-400">
            →
          </div>


          <div className="text-right">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              To
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              ❤️ {coupleWalletName}
            </p>

          </div>

        </div>


        <div className="mt-4 border-t border-gray-200 pt-4">

          <p className="text-sm text-gray-500">
            Current Personal Balance
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            RM{" "}
            {formatMoney(
              personalBalance
            )}
          </p>

        </div>

      </div>


      {/* AMOUNT */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Transfer amount
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
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 outline-none"
          />

        </div>


        <p className="mt-2 text-xs text-gray-400">
          This is a bookkeeping transfer.
          It is not counted as income or expense.
        </p>

      </div>


      {/* DATE */}
      <div>

        <label className="text-sm font-medium text-gray-700">
          Date
        </label>

        <input
          type="date"
          value={
            date
          }
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
          rows={3}
          placeholder="e.g. September shared fund"
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
        disabled={
          loading
        }
        className="w-full rounded-xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50"
      >

        {loading
          ? "Transferring..."
          : "Transfer to Couple Wallet"}

      </button>

    </form>
  );
}