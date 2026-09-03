"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  useTranslations,
} from "next-intl";


type WalletMode =
  | "personal"
  | "couple";


function getExplicitWalletMode(
  pathname: string,
  walletParam: string | null
): WalletMode | null {
  if (
    walletParam === "personal"
  ) {
    return "personal";
  }

  if (
    walletParam === "couple"
  ) {
    return "couple";
  }

  if (
    pathname.startsWith(
      "/couple"
    )
  ) {
    return "couple";
  }

  if (
    pathname.startsWith(
      "/transactions"
    )
  ) {
    return "personal";
  }

  return null;
}


export default function BottomNavigation() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const t =
    useTranslations(
      "Navigation"
    );

  const [
    rememberedWallet,
    setRememberedWallet,
  ] =
    useState<WalletMode>(
      "personal"
    );

  const walletParam =
    searchParams.get(
      "wallet"
    );

  const explicitWallet =
    getExplicitWalletMode(
      pathname,
      walletParam
    );

  const walletMode =
    explicitWallet ??
    rememberedWallet;


  useEffect(() => {
    if (explicitWallet) {
      localStorage.setItem(
        "active_wallet_mode",
        explicitWallet
      );

      setRememberedWallet(
        explicitWallet
      );

      return;
    }

    const stored =
      localStorage.getItem(
        "active_wallet_mode"
      );

    if (
      stored === "personal" ||
      stored === "couple"
    ) {
      setRememberedWallet(
        stored
      );
    }
  }, [
    explicitWallet,
  ]);


  const isEditPage =
    /^\/transactions\/[^/]+\/edit$/.test(
      pathname
    );


  const shouldHide =
    pathname === "/auth" ||
    pathname.startsWith(
      "/auth/"
    ) ||
    pathname === "/couple" ||
    pathname === "/transfer" ||
    pathname.endsWith(
      "/new"
    ) ||
    isEditPage;


  if (shouldHide) {
    return null;
  }


  // =========================================
  // ROUTES
  // =========================================

  const homeHref =
    `/?wallet=${walletMode}`;

  const transactionsHref =
    walletMode === "couple"
      ? "/couple/transactions"
      : "/transactions";

  const addHref =
    walletMode === "couple"
      ? "/couple/transactions/new"
      : "/transactions/new";

  const budgetHref =
    `/budget?wallet=${walletMode}`;

  const moreHref =
    `/more?wallet=${walletMode}`;


  // =========================================
  // ACTIVE
  // =========================================

  const homeActive =
    pathname === "/";

  const transactionsActive =
    (
      walletMode === "personal" &&
      pathname === "/transactions"
    ) ||
    (
      walletMode === "couple" &&
      pathname ===
        "/couple/transactions"
    );

  const budgetActive =
    pathname === "/budget";

  const moreActive =
    pathname === "/more" ||
    pathname === "/goals" ||
    pathname === "/recurring" ||
    pathname === "/reports" ||
    pathname === "/categories" ||
    pathname === "/settings";


  function navClass(
    active: boolean
  ) {
    return `
      flex flex-col
      items-center
      justify-center
      gap-1
      rounded-xl
      py-2
      text-xs
      font-medium
      transition
      ${
        active
          ? "text-[#D4AF37]"
          : "text-[#777066] hover:text-[#C9A86A]"
      }
    `;
  }


  return (
    <nav className="
      fixed
      bottom-0
      left-1/2
      z-50
      w-full
      max-w-3xl
      -translate-x-1/2
      border-t
      border-[#302819]
      bg-[#0D0D0D]/95
      px-2
      pb-[max(0.5rem,env(safe-area-inset-bottom))]
      pt-2
      shadow-[0_-8px_30px_rgba(0,0,0,0.55)]
      backdrop-blur-xl
    ">

      <div className="grid grid-cols-5 items-end">


        {/* HOME */}
        <Link
          href={homeHref}
          className={
            navClass(
              homeActive
            )
          }
        >

          <span className="text-xl">
            ⌂
          </span>

          <span>
            {t("home")}
          </span>

        </Link>


        {/* TRANSACTIONS */}
        <Link
          href={
            transactionsHref
          }
          className={
            navClass(
              transactionsActive
            )
          }
        >

          <span className="text-xl">
            ⇅
          </span>

          <span>
            {t(
              "transactions"
            )}
          </span>

        </Link>


        {/* ADD */}
        <div className="flex justify-center">

          <Link
            href={
              addHref
            }
            aria-label={
              t("add")
            }
            className="
              -mt-7
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-[#D4AF37]
              text-3xl
              font-light
              text-[#080808]
              shadow-[0_6px_25px_rgba(212,175,55,0.28)]
              ring-4
              ring-[#080808]
              transition
              hover:bg-[#E2C25A]
              active:scale-95
            "
          >
            +
          </Link>

        </div>


        {/* BUDGET */}
        <Link
          href={
            budgetHref
          }
          className={
            navClass(
              budgetActive
            )
          }
        >

          <span className="text-xl">
            ◎
          </span>

          <span>
            {t("budget")}
          </span>

        </Link>


        {/* MORE */}
        <Link
          href={
            moreHref
          }
          className={
            navClass(
              moreActive
            )
          }
        >

          <span className="text-xl tracking-tighter">
            •••
          </span>

          <span>
            {t("more")}
          </span>

        </Link>

      </div>

    </nav>
  );
}