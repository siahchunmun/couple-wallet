import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import TransferForm from "@/components/transfer-form";


export default async function TransferPage() {
  const supabase =
    await createClient();


  // =========================================
  // USER
  // =========================================

  const {
    data: { user },
  } =
    await supabase.auth.getUser();


  if (!user) {
    redirect("/auth");
  }


  // =========================================
  // WALLETS
  // =========================================

  const {
    data: wallets,
    error: walletError,
  } = await supabase
    .from("wallets")
    .select(`
      id,
      name,
      wallet_type,
      status
    `)
    .eq(
      "status",
      "active"
    );


  if (walletError) {
    throw new Error(
      walletError.message
    );
  }


  const personalWallet =
    wallets?.find(
      (wallet) =>
        wallet.wallet_type ===
        "personal"
    );


  const coupleWallet =
    wallets?.find(
      (wallet) =>
        wallet.wallet_type ===
        "couple"
    );


  if (!personalWallet) {
    throw new Error(
      "Personal Wallet not found."
    );
  }


  if (!coupleWallet) {
    redirect("/couple");
  }


  // =========================================
  // PERSONAL BALANCE
  // =========================================

  const {
    data: transactions,
    error: transactionError,
  } = await supabase
    .from("transactions")
    .select(`
      transaction_type,
      amount,
      payment_method
    `)
    .eq(
      "wallet_id",
      personalWallet.id
    );


  if (transactionError) {
    throw new Error(
      transactionError.message
    );
  }


  const personalBalance =
    (transactions ?? []).reduce(
      (
        total,
        transaction
      ) => {

        const amount =
          Number(
            transaction.amount
          );


        if (
          transaction.transaction_type ===
            "income" ||
          transaction.transaction_type ===
            "transfer_in"
        ) {

          return total + amount;

        }


        if (
          transaction.transaction_type ===
            "expense" &&
          transaction.payment_method ===
            "wallet"
        ) {

          return total - amount;

        }


        if (
          transaction.transaction_type ===
            "transfer_out" ||
          transaction.transaction_type ===
            "settlement"
        ) {

          return total - amount;

        }


        return total;

      },
      0
    );


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-xl px-4 py-6">

        {/* HEADER */}
        <header className="flex items-center gap-4">

          <Link
            href="/?wallet=personal"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>


          <div>

            <h1 className="text-xl font-bold text-gray-900">
              Transfer Money
            </h1>

            <p className="text-sm text-gray-500">
              Personal → Couple
            </p>

          </div>

        </header>


        {/* FORM */}
        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6">

          <TransferForm
            personalWalletId={
              personalWallet.id
            }
            personalWalletName={
              personalWallet.name
            }
            coupleWalletId={
              coupleWallet.id
            }
            coupleWalletName={
              coupleWallet.name
            }
            personalBalance={
              personalBalance
            }
          />

        </section>

      </div>

    </main>
  );
}