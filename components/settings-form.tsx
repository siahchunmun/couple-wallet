"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useTranslations,
} from "next-intl";

import {
  createClient,
} from "@/lib/supabase/client";


type AppLocale =
  | "en"
  | "zh-CN";


type SettingsFormProps = {
  userId: string;

  initialDisplayName:
    string;

  initialLanguage:
    AppLocale;
};


export default function SettingsForm({
  userId,
  initialDisplayName,
  initialLanguage,
}: SettingsFormProps) {
  const router =
    useRouter();


  const t =
    useTranslations(
      "Settings"
    );


  const [
    displayName,
    setDisplayName,
  ] =
    useState(
      initialDisplayName
    );


  const [
    language,
    setLanguage,
  ] =
    useState<AppLocale>(
      initialLanguage
    );


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");


    const cleanName =
      displayName.trim();


    if (!cleanName) {
      setError(
        "Display name is required."
      );

      setLoading(false);

      return;
    }


    const supabase =
      createClient();


    const {
      error: updateError,
    } =
      await supabase
        .from("profiles")
        .update({
          display_name:
            cleanName,

          preferred_language:
            language,
        })
        .eq(
          "id",
          userId
        );


    if (updateError) {
      setError(
        updateError.message ||
          t("saveError")
      );

      setLoading(false);

      return;
    }


    // Save the locale for next-intl.
    document.cookie =
      `app_locale=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;


    setSuccess(
      language ===
        initialLanguage
        ? t("saved")
        : language ===
            "zh-CN"
        ? "设置已保存。"
        : "Settings saved."
    );


    router.refresh();

    setLoading(false);
  }


  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >

      {/* PROFILE */}
      <section className="rounded-3xl border border-gray-100 bg-white p-6">

        <h2 className="text-lg font-bold text-gray-900">
          {t("profile")}
        </h2>


        <div className="mt-5">

          <label className="text-sm font-medium text-gray-700">
            {t(
              "displayName"
            )}
          </label>


          <input
            type="text"
            value={
              displayName
            }
            onChange={(
              event
            ) =>
              setDisplayName(
                event.target.value
              )
            }
            required
            maxLength={80}
            placeholder={t(
              "displayNamePlaceholder"
            )}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
          />

        </div>

      </section>


      {/* LANGUAGE */}
      <section className="rounded-3xl border border-gray-100 bg-white p-6">

        <h2 className="text-lg font-bold text-gray-900">
          {t("language")}
        </h2>


        <p className="mt-1 text-sm text-gray-500">
          {t(
            "languageDescription"
          )}
        </p>


        <div className="mt-5 space-y-3">

          {/* EN */}
          <label
            className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${
              language ===
              "en"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200"
            }`}
          >

            <div>

              <p className="font-semibold text-gray-900">
                English
              </p>

              <p className="mt-1 text-sm text-gray-500">
                English
              </p>

            </div>


            <input
              type="radio"
              name="language"
              value="en"
              checked={
                language ===
                "en"
              }
              onChange={() =>
                setLanguage(
                  "en"
                )
              }
              className="h-4 w-4"
            />

          </label>


          {/* ZH */}
          <label
            className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${
              language ===
              "zh-CN"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200"
            }`}
          >

            <div>

              <p className="font-semibold text-gray-900">
                简体中文
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Simplified Chinese
              </p>

            </div>


            <input
              type="radio"
              name="language"
              value="zh-CN"
              checked={
                language ===
                "zh-CN"
              }
              onChange={() =>
                setLanguage(
                  "zh-CN"
                )
              }
              className="h-4 w-4"
            />

          </label>

        </div>


        <p className="mt-4 text-xs text-gray-400">
          {t(
            "languageNote"
          )}
        </p>

      </section>


      {/* MESSAGE */}
      {error && (

        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>

      )}


      {success && (

        <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </div>

      )}


      {/* SAVE */}
      <button
        type="submit"
        disabled={
          loading
        }
        className="w-full rounded-2xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? t("saving")
          : t(
              "saveProfile"
            )}
      </button>

    </form>
  );
}