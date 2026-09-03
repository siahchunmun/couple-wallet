"use client";

import {
  useEffect,
  useState,
} from "react";

type InviteShareProps = {
  inviteCode: string;
};

export default function InviteShare({
  inviteCode,
}: InviteShareProps) {
  const [inviteLink, setInviteLink] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const link =
      `${window.location.origin}/couple?code=` +
      encodeURIComponent(inviteCode);

    setInviteLink(link);
  }, [inviteCode]);


  async function copyCode() {
    await navigator.clipboard.writeText(
      inviteCode
    );

    setMessage(
      "Invite code copied!"
    );
  }


  async function copyLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(
      inviteLink
    );

    setMessage(
      "Invite link copied!"
    );
  }


  return (
    <div className="space-y-4">

      {/* Invite Code */}
      <div className="rounded-2xl bg-gray-900 p-6 text-center text-white">

        <p className="text-sm text-gray-400">
          Invite Code
        </p>

        <p className="mt-2 break-all text-3xl font-bold tracking-widest">
          {inviteCode}
        </p>

      </div>


      <button
        type="button"
        onClick={copyCode}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 font-semibold text-gray-700"
      >
        Copy Invite Code
      </button>


      {/* Invite Link */}
      <div className="rounded-2xl bg-gray-50 p-4">

        <p className="text-sm font-medium text-gray-700">
          Invite Link
        </p>

        <p className="mt-2 break-all text-sm text-gray-500">
          {inviteLink ||
            "Creating invite link..."}
        </p>

      </div>


      <button
        type="button"
        onClick={copyLink}
        disabled={!inviteLink}
        className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50"
      >
        Copy Invite Link
      </button>


      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-center text-sm text-green-700">
          {message}
        </div>
      )}


      <p className="text-center text-xs text-gray-400">
        Send the code or link to your partner.
      </p>

    </div>
  );
}