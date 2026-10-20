"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  balance: number;
  status: string;
};

type GoalManagerProps = {
  walletId: string;
  walletName: string;
  walletType: string;
  walletTotal: number;
  availableBalance: number;
  totalAllocated: number;
  goals: Goal[];
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getMalaysiaDate() {
  // en-CA produces an ISO-style date (YYYY-MM-DD) in most runtimes.
  // Use formatToParts to guarantee that ordering for <input type="date">.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function GoalManager({
  walletId,
  walletName,
  walletType,
  walletTotal,
  availableBalance,
  totalAllocated,
  goals,
}: GoalManagerProps) {
  const router = useRouter();
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const amount = Number(targetAmount);

    if (!goalName.trim() || goalName.trim().length > 80) {
      setError("Goal name must contain 1 to 80 characters.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99 || !/^\d+(\.\d{1,2})?$/.test(targetAmount)) {
      setError("Enter a valid target amount with up to 2 decimal places.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("create_savings_goal", {
        wallet_id: walletId,
        goal_name: goalName.trim(),
        target_amount: amount,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setGoalName("");
      setTargetAmount("");
      router.refresh();
    } catch {
      setError("Unable to create goal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gray-900 p-6 text-white">
        <p className="text-sm text-gray-400">
          {walletType === "couple" ? "❤️" : "👤"} {walletName}
        </p>
        <p className="mt-6 text-sm text-gray-400">Available Balance</p>
        <p className="mt-1 text-4xl font-bold">RM {formatMoney(availableBalance)}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs text-gray-400">In Goals</p>
            <p className="mt-1 font-semibold">RM {formatMoney(totalAllocated)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs text-gray-400">Wallet Total</p>
            <p className="mt-1 font-semibold">RM {formatMoney(walletTotal)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">Available + Goals = Wallet Total</p>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Create Savings Goal</h2>
        <p className="mt-1 text-sm text-gray-500">Create a goal first, then allocate money to it.</p>
        <form onSubmit={createGoal} className="mt-5 space-y-4">
          <div>
            <label htmlFor="new-goal-name" className="text-sm font-medium text-gray-700">Goal Name</label>
            <input id="new-goal-name" type="text" value={goalName} onChange={(event) => setGoalName(event.target.value)} required maxLength={80} placeholder="e.g. Japan Trip" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none" />
          </div>
          <div>
            <label htmlFor="new-goal-target" className="text-sm font-medium text-gray-700">Target Amount</label>
            <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">RM</div>
              <input id="new-goal-target" type="number" min="0.01" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} required placeholder="8000.00" className="w-full px-4 py-3 text-gray-900 outline-none" />
            </div>
          </div>
          {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50">
            {loading ? "Creating..." : "Create Goal"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900">Your Goals</h2>
        {goals.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-8 text-center">
            <div className="text-4xl">🎯</div>
            <p className="mt-3 font-semibold text-gray-900">No Savings Goals yet</p>
            <p className="mt-1 text-sm text-gray-500">Create your first Goal above.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} availableBalance={availableBalance} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GoalCard({ goal, availableBalance }: { goal: Goal; availableBalance: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"allocate" | "withdraw">("allocate");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getMalaysiaDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(String(goal.targetAmount));

  const progress = goal.targetAmount > 0 ? (goal.balance / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(goal.targetAmount - goal.balance, 0);

  async function moveMoney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Enter a valid amount with up to 2 decimal places.");
      return;
    }
    if (mode === "allocate" && numericAmount > availableBalance) {
      setError(`Available Balance is RM ${formatMoney(availableBalance)}.`);
      return;
    }
    if (mode === "withdraw" && numericAmount > goal.balance) {
      setError(`Goal Balance is RM ${formatMoney(goal.balance)}.`);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("move_goal_money", {
        goal_id: goal.id,
        movement_type: mode,
        amount: numericAmount,
        occurred_on: date,
        note: note.trim() || null,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      setError("Unable to move money. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function editGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const newTarget = Number(editTarget);
    if (!editName.trim() || editName.trim().length > 80) {
      setError("Goal name must contain 1 to 80 characters.");
      return;
    }
    if (!Number.isFinite(newTarget) || newTarget <= 0 || newTarget > 999999999999.99 || !/^\d+(\.\d{1,2})?$/.test(editTarget)) {
      setError("Enter a valid target amount with up to 2 decimal places.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("update_savings_goal", {
        goal_id: goal.id,
        goal_name: editName.trim(),
        target_amount: newTarget,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Unable to update goal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteGoal() {
    setError("");
    if (goal.balance !== 0) {
      setError(`Withdraw RM ${formatMoney(goal.balance)} before deleting this goal.`);
      return;
    }
    if (!window.confirm(`Delete "${goal.name}"? Its history will be retained.`)) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("delete_savings_goal", {
        goal_id: goal.id,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to delete goal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">🎯 {goal.name}</h3>
          <p className="mt-1 text-sm text-gray-500">RM {formatMoney(goal.balance)} / RM {formatMoney(goal.targetAmount)}</p>
        </div>
        {goal.status === "completed" && <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Completed</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={loading} onClick={() => {
          if (!editing) {
            setEditName(goal.name);
            setEditTarget(String(goal.targetAmount));
          }
          setEditing(!editing);
          setError("");
        }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50">
          {editing ? "Cancel Edit" : "✏️ Edit Goal"}
        </button>
        <button type="button" disabled={loading} onClick={deleteGoal} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">
          🗑️ Delete Goal
        </button>
      </div>

      {editing && (
        <form onSubmit={editGoal} className="mt-4 space-y-3 rounded-2xl bg-gray-50 p-4">
          <div>
            <label htmlFor={`edit-name-${goal.id}`} className="block text-sm font-medium text-gray-700">Goal Name</label>
            <input id={`edit-name-${goal.id}`} type="text" value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={80} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900" />
          </div>
          <div>
            <label htmlFor={`edit-target-${goal.id}`} className="block text-sm font-medium text-gray-700">Target Amount (RM)</label>
            <input id={`edit-target-${goal.id}`} type="number" min="0.01" step="0.01" value={editTarget} onChange={(event) => setEditTarget(event.target.value)} required className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gray-900" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>{progress.toFixed(1)}%</span>
        <span>RM {formatMoney(remaining)} to goal</span>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        <button type="button" disabled={loading} onClick={() => { setMode("allocate"); setError(""); }} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === "allocate" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Add Money</button>
        <button type="button" disabled={loading} onClick={() => { setMode("withdraw"); setError(""); }} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === "withdraw" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Withdraw</button>
      </div>

      <form onSubmit={moveMoney} className="mt-4 space-y-4">
        <div>
          <label htmlFor={`amount-${goal.id}`} className="text-sm font-medium text-gray-700">{mode === "allocate" ? "Amount to save" : "Amount to withdraw"}</label>
          <div className="mt-1 flex overflow-hidden rounded-xl border border-gray-200">
            <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">RM</div>
            <input id={`amount-${goal.id}`} type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="0.00" className="w-full px-4 py-3 text-gray-900 outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor={`date-${goal.id}`} className="text-sm font-medium text-gray-700">Date</label>
          <input id={`date-${goal.id}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900" />
        </div>
        <div>
          <label htmlFor={`note-${goal.id}`} className="text-sm font-medium text-gray-700">Note <span className="font-normal text-gray-400">Optional</span></label>
          <input id={`note-${goal.id}`} type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder={mode === "allocate" ? "e.g. September savings" : "e.g. Use for flight tickets"} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900" />
        </div>
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50">
          {loading ? "Saving..." : mode === "allocate" ? "Add to Goal" : "Withdraw from Goal"}
        </button>
      </form>
    </article>
  );
}
