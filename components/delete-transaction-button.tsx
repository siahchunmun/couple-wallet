"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeleteTransactionButtonProps = {
  transactionId: string;
  description: string;
};

export default function DeleteTransactionButton({
  transactionId,
  description,
}: DeleteTransactionButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${description}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-sm font-medium text-red-600 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}