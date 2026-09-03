"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import InviteShare from "@/components/invite-share";


type CoupleSetupProps = {
  initialInviteCode?: string;
};


export default function CoupleSetup({
  initialInviteCode = "",
}: CoupleSetupProps) {
  const router = useRouter();

  const cleanedInitialCode =
    initialInviteCode
      .replace(/\s+/g, "")
      .toUpperCase();

  const [mode, setMode] =
    useState<"create" | "join">(
      cleanedInitialCode
        ? "join"
        : "create"
    );

  const [walletName, setWalletName] =
    useState("Our Wallet");

  const [inviteCode, setInviteCode] =
    useState(cleanedInitialCode);

  const [createdCode, setCreatedCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // =========================================
  // CREATE COUPLE WALLET
  // =========================================

  async function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const supabase =
      createClient();

    const {
      data,
      error: rpcError,
    } = await supabase.rpc(
      "create_couple_wallet",
      {
        wallet_name:
          walletName.trim() ||
          "Our Wallet",
      }
    );

    if (rpcError) {
      setError(
        rpcError.message
      );

      setLoading(false);

      return;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!result?.invite_code) {
      setError(
        "Wallet created, but invite code was not returned."
      );

      setLoading(false);

      return;
    }

    setCreatedCode(
      result.invite_code
    );

    setLoading(false);
  }


  // =========================================
  // JOIN COUPLE WALLET
  // =========================================

  async function handleJoin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const code =
      inviteCode
        .replace(/\s+/g, "")
        .toUpperCase();

    if (!code) {
      setError(
        "Please enter an invite code."
      );

      setLoading(false);

      return;
    }

    const supabase =
      createClient();

    const {
      error: rpcError,
    } = await supabase.rpc(
      "join_couple_wallet",
      {
        invite_code: code,
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


  // =========================================
  // CREATED SUCCESSFULLY
  // =========================================

  if (createdCode) {
    return (
      <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6">

        <div className="text-center">

          <div className="text-5xl">
            ❤️
          </div>

          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Couple Wallet Created
          </h2>

          <p className="mt-2 text-gray-500">
            Invite your partner to join.
          </p>

        </div>


        <div className="mt-8">

          <InviteShare
            inviteCode={
              createdCode
            }
          />

        </div>


        <button
          type="button"
          onClick={() => {
            router.refresh();
          }}
          className="mt-6 w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-700"
        >
          Continue
        </button>

      </section>
    );
  }


  // =========================================
  // CREATE / JOIN UI
  // =========================================

  return (
    <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6">

      <div className="text-center">

        <div className="text-5xl">
          ❤️
        </div>

        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Money is better together
        </h2>

        <p className="mt-2 text-gray-500">
          Create a shared wallet or join your partner.
        </p>

      </div>


      {/* Create / Join */}
      <div className="mt-8 grid grid-cols-2 rounded-xl bg-gray-100 p-1">

        <button
          type="button"
          onClick={() => {
            setMode("create");
            setError("");
            setMessage("");
          }}
          className={`rounded-lg py-2.5 text-sm font-semibold ${
            mode === "create"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Create
        </button>


        <button
          type="button"
          onClick={() => {
            setMode("join");
            setError("");
            setMessage("");
          }}
          className={`rounded-lg py-2.5 text-sm font-semibold ${
            mode === "join"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Join
        </button>

      </div>


      {/* CREATE */}
      {mode === "create" ? (

        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-4"
        >

          <div>

            <label className="text-sm font-medium text-gray-700">
              Wallet Name
            </label>

            <input
              type="text"
              value={walletName}
              onChange={(event) =>
                setWalletName(
                  event.target.value
                )
              }
              maxLength={50}
              required
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
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
              ? "Creating..."
              : "Create Couple Wallet"}
          </button>

        </form>

      ) : (

        /* JOIN */

        <form
          onSubmit={handleJoin}
          className="mt-6 space-y-4"
        >

          <div>

            <label className="text-sm font-medium text-gray-700">
              Invite Code
            </label>

            <input
              type="text"
              value={inviteCode}
              onChange={(event) =>
                setInviteCode(
                  event.target.value
                    .toUpperCase()
                )
              }
              placeholder="A1B2C3D4E5F6"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold uppercase tracking-widest text-gray-900 outline-none focus:border-gray-400"
            />

          </div>


          {cleanedInitialCode && (
            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              Invite code loaded from your invite link.
            </div>
          )}


          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}


          {message && (
            <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Joining..."
              : "Join Couple Wallet"}
          </button>

        </form>

      )}

    </section>
  );
}