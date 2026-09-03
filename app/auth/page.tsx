"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";


function getSafeNextPath() {
  if (
    typeof window === "undefined"
  ) {
    return "/";
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const next =
    params.get("next");


  // 防止把用户 Redirect 到外部网站
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//")
  ) {
    return next;
  }


  return "/";
}


export default function AuthPage() {
  const router =
    useRouter();

  const [mode, setMode] =
    useState<
      "login" | "register"
    >("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const supabase =
      createClient();

    const nextPath =
      getSafeNextPath();


    // =========================================
    // REGISTER
    // =========================================

    if (mode === "register") {

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,

          options: {

            data: {
              display_name: name,
            },

            // 如果 Email Confirmation 开着，
            // Confirm 后回到原本邀请页面
            emailRedirectTo:
              `${window.location.origin}${nextPath}`,
          },
        });


      if (error) {
        setError(
          error.message
        );

        setLoading(false);

        return;
      }


      // Email confirmation OFF
      if (data.session) {

        router.replace(
          nextPath
        );

        router.refresh();

        return;
      }


      // Email confirmation ON
      setMessage(
        "Account created! Check your email to confirm your account."
      );

    }


    // =========================================
    // LOGIN
    // =========================================

    else {

      const {
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });


      if (error) {
        setError(
          error.message
        );

        setLoading(false);

        return;
      }


      router.replace(
        nextPath
      );

      router.refresh();

      return;
    }


    setLoading(false);
  }


  function switchMode() {

    setMode(
      mode === "login"
        ? "register"
        : "login"
    );

    setError("");
    setMessage("");
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">

        {/* Header */}
        <div className="text-center">

          <div className="text-4xl">
            ❤️
          </div>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Our Wallet
          </h1>

          <p className="mt-2 text-gray-500">
            Manage money better, together.
          </p>

        </div>


        {/* Login / Register */}
        <div className="mt-8 flex rounded-xl bg-gray-100 p-1">

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              mode === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Login
          </button>


          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              mode === "register"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Register
          </button>

        </div>


        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >

          {mode === "register" && (

            <div>

              <label className="text-sm font-medium text-gray-700">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                required
                placeholder="Your name"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
              />

            </div>

          )}


          <div>

            <label className="text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
            />

          </div>


          <div>

            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
            />

          </div>


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
            className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create account"}
          </button>

        </form>


        <p className="mt-6 text-center text-sm text-gray-500">

          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

        </p>


        <button
          type="button"
          onClick={switchMode}
          className="mt-2 w-full text-sm font-semibold text-gray-900"
        >

          {mode === "login"
            ? "Create account"
            : "Login instead"}

        </button>

      </div>

    </main>
  );
}