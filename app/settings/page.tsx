import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  getTranslations,
} from "next-intl/server";

import {
  createClient,
} from "@/lib/supabase/server";

import SettingsForm from "@/components/settings-form";


type AppLocale =
  | "en"
  | "zh-CN";


export default async function SettingsPage() {
  const supabase =
    await createClient();


  // =========================================
  // AUTH
  // =========================================

  const {
    data: { user },
  } =
    await supabase.auth.getUser();


  if (!user) {
    redirect("/auth");
  }


  // =========================================
  // PROFILE
  // =========================================

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(`
        display_name,
        preferred_language
      `)
      .eq(
        "id",
        user.id
      )
      .single();


  if (profileError) {
    throw new Error(
      profileError.message
    );
  }


  const preferredLanguage:
    AppLocale =
    profile.preferred_language ===
      "zh-CN"
      ? "zh-CN"
      : "en";


  const t =
    await getTranslations(
      "Settings"
    );


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-2xl px-4 py-6">

        {/* HEADER */}
        <header className="flex items-center gap-4">

          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          >
            ←
          </Link>


          <div>

            <h1 className="text-xl font-bold text-gray-900">
              {t(
                "title"
              )}
            </h1>

            <p className="text-sm text-gray-500">
              {t(
                "subtitle"
              )}
            </p>

          </div>

        </header>


        <div className="mt-8">

          <SettingsForm
            userId={
              user.id
            }

            initialDisplayName={
              profile.display_name ||
              ""
            }

            initialLanguage={
              preferredLanguage
            }
          />

        </div>

      </div>

    </main>
  );
}