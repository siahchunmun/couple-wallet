import {
  getRequestConfig,
} from "next-intl/server";

import {
  cookies,
} from "next/headers";


export const locales = [
  "en",
  "zh-CN",
] as const;


export type AppLocale =
  (typeof locales)[number];


export const defaultLocale:
  AppLocale = "en";


function isAppLocale(
  value: string | undefined
): value is AppLocale {
  return (
    value === "en" ||
    value === "zh-CN"
  );
}


export default getRequestConfig(
  async () => {
    const cookieStore =
      await cookies();


    const cookieLocale =
      cookieStore.get(
        "app_locale"
      )?.value;


    const locale:
      AppLocale =
      isAppLocale(
        cookieLocale
      )
        ? cookieLocale
        : defaultLocale;


    const messages =
      (
        await import(
          `../messages/${locale}.json`
        )
      ).default;


    return {
      locale,
      messages,

      timeZone:
        "Asia/Kuala_Lumpur",
    };
  }
);