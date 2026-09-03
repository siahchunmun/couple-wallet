"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name_en: string;
  name_zh: string | null;
  category_type: "income" | "expense" | "both";
};

type Transaction = {
  id: string;
  transaction_type: "income" | "expense";
  amount: number;
  description: string;
  source: string | null;
  category_id: string | null;
  occurred_on: string;
  note: string | null;
};

type EditTransactionFormProps = {
  transaction: Transaction;
  userId: string;
  categories: Category[];
};

export default function EditTransactionForm({
  transaction,
  userId,
  categories,
}: EditTransactionFormProps) {
  const router = useRouter();

  const [type, setType] = useState<"income" | "expense">(
    transaction.transaction_type
  );

  const [amount, setAmount] = useState(
    Number(transaction.amount).toFixed(2)
  );

  const [description, setDescription] = useState(
    transaction.description
  );

  const [source, setSource] = useState(
    transaction.source ?? ""
  );

  const [categoryId, setCategoryId] = useState(
    transaction.category_id ?? ""
  );

  const [date, setDate] = useState(
    transaction.occurred_on
  );

  const [note, setNote] = useState(
    transaction.note ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        category.category_type === type ||
        category.category_type === "both"
    );
  }, [categories, type]);

  function changeType(newType: "income" | "expense") {
    if (newType === type) {
      return;
    }

    setType(newType);
    setCategoryId("");
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Please enter a valid amount.");
      return;
    }

    if (numericAmount > 999999999999.99) {
      setError("Amount is too large.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!categoryId) {
      setError("Please choose a category.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        transaction_type: type,

        amount: numericAmount,

        description: description.trim(),

        source:
          type === "income"
            ? source.trim() || null
            : null,

        category_id: categoryId,

        payment_method:
          type === "expense"
            ? "wallet"
            : null,

        occurred_on: date,

        note:
          note.trim() || null,

        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .eq("created_by", userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/transactions");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Type */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Transaction type
        </label>

        <div className="mt-2 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => changeType("expense")}
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
            onClick={() => changeType("income")}
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

      {/* Amount */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Amount
        </label>

        <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-gray-400">
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
              setAmount(event.target.value)
            }
            required
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>

        <input
          type="text"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          required
          maxLength={100}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
        />
      </div>

      {/* Source */}
      {type === "income" && (
        <div>
          <label className="text-sm font-medium text-gray-700">
            Source
          </label>

          <input
            type="text"
            value={source}
            onChange={(event) =>
              setSource(event.target.value)
            }
            maxLength={100}
            placeholder="e.g. Employer"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
          />
        </div>
      )}

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Category
        </label>

        <select
          value={categoryId}
          onChange={(event) =>
            setCategoryId(event.target.value)
          }
          required
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
        >
          <option value="">
            Select category
          </option>

          {availableCategories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(event) =>
            setDate(event.target.value)
          }
          required
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
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
          onChange={(event) =>
            setNote(event.target.value)
          }
          rows={3}
          placeholder="Add a note..."
          className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
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
          : "Save Changes"}
      </button>
    </form>
  );
}