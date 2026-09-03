"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type CategoryType =
  | "income"
  | "expense"
  | "both";

type SystemCategory = {
  id: string;
  name_en: string;
  name_zh: string | null;
  category_type: CategoryType;
};

type CustomCategory = {
  id: string;
  name_en: string;
  name_zh: string | null;
  category_type: CategoryType;
  created_by: string;
  createdByName: string;
};

type CategoryManagerProps = {
  walletId: string;
  userId: string;
  systemCategories: SystemCategory[];
  customCategories: CustomCategory[];
};

function typeLabel(
  type: CategoryType
) {
  if (type === "income") {
    return "Income";
  }

  if (type === "expense") {
    return "Expense";
  }

  return "Income & Expense";
}

export default function CategoryManager({
  walletId,
  userId,
  systemCategories,
  customCategories,
}: CategoryManagerProps) {
  const router = useRouter();

  const [
    nameEn,
    setNameEn,
  ] = useState("");

  const [
    nameZh,
    setNameZh,
  ] = useState("");

  const [
    categoryType,
    setCategoryType,
  ] =
    useState<CategoryType>(
      "expense"
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function createCategory(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanEnglish =
      nameEn.trim();

    const cleanChinese =
      nameZh.trim();

    if (!cleanEnglish) {
      setError(
        "Please enter an English category name."
      );

      return;
    }

    setLoading(true);

    const supabase =
      createClient();

    const {
      error: insertError,
    } = await supabase
      .from("categories")
      .insert({
        wallet_id:
          walletId,

        name_en:
          cleanEnglish,

        name_zh:
          cleanChinese ||
          cleanEnglish,

        icon_key:
          "tag",

        category_type:
          categoryType,

        is_system:
          false,

        created_by:
          userId,
      });

    if (insertError) {
      setError(
        insertError.message
      );

      setLoading(false);

      return;
    }

    setNameEn("");
    setNameZh("");
    setCategoryType(
      "expense"
    );

    router.refresh();

    setLoading(false);
  }

  return (
    <div className="space-y-8">

      {/* CREATE */}
      <section className="rounded-3xl border border-gray-100 bg-white p-6">

        <h2 className="text-lg font-bold text-gray-900">
          Create Custom Category
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          This category will only belong to this wallet.
        </p>

        <form
          onSubmit={
            createCategory
          }
          className="mt-6 space-y-4"
        >

          <div>
            <label className="text-sm font-medium text-gray-700">
              English Name
            </label>

            <input
              type="text"
              value={nameEn}
              onChange={(
                event
              ) =>
                setNameEn(
                  event.target.value
                )
              }
              maxLength={50}
              required
              placeholder="e.g. Pet"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
            />
          </div>


          <div>
            <label className="text-sm font-medium text-gray-700">
              中文名称

              <span className="ml-1 font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              type="text"
              value={nameZh}
              onChange={(
                event
              ) =>
                setNameZh(
                  event.target.value
                )
              }
              maxLength={50}
              placeholder="例如：宠物"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-gray-400"
            />
          </div>


          <div>
            <label className="text-sm font-medium text-gray-700">
              Category Type
            </label>

            <select
              value={
                categoryType
              }
              onChange={(
                event
              ) =>
                setCategoryType(
                  event.target
                    .value as CategoryType
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900"
            >
              <option value="expense">
                Expense
              </option>

              <option value="income">
                Income
              </option>

              <option value="both">
                Income & Expense
              </option>
            </select>
          </div>


          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full rounded-xl bg-gray-900 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Category"}
          </button>

        </form>

      </section>


      {/* CUSTOM */}
      <section>

        <h2 className="text-lg font-bold text-gray-900">
          Custom Categories
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Categories created specifically for this wallet.
        </p>


        {customCategories.length ===
        0 ? (

          <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-8 text-center">

            <div className="text-4xl">
              🏷️
            </div>

            <p className="mt-3 font-semibold text-gray-900">
              No custom categories yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Create one above when the default categories are not enough.
            </p>

          </div>

        ) : (

          <div className="mt-3 space-y-3">

            {customCategories.map(
              (category) => (

                <CustomCategoryCard
                  key={
                    category.id
                  }
                  category={
                    category
                  }
                  userId={
                    userId
                  }
                />

              )
            )}

          </div>

        )}

      </section>


      {/* SYSTEM */}
      <section>

        <h2 className="text-lg font-bold text-gray-900">
          System Categories
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Default categories shared across all wallets.
        </p>


        <div className="mt-3 overflow-hidden rounded-3xl border border-gray-100 bg-white">

          {systemCategories.map(
            (
              category,
              index
            ) => (

              <div
                key={
                  category.id
                }
                className={`flex items-center justify-between gap-4 p-4 ${
                  index !==
                  systemCategories.length -
                    1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >

                <div>

                  <p className="font-medium text-gray-900">
                    {
                      category.name_en
                    }
                  </p>

                  {category.name_zh &&
                    category.name_zh !==
                      category.name_en && (

                    <p className="mt-0.5 text-sm text-gray-500">
                      {
                        category.name_zh
                      }
                    </p>

                  )}

                </div>


                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                  {typeLabel(
                    category.category_type
                  )}
                </span>

              </div>

            )
          )}

        </div>

      </section>

    </div>
  );
}


function CustomCategoryCard({
  category,
  userId,
}: {
  category: CustomCategory;
  userId: string;
}) {
  const router =
    useRouter();

  const canManage =
    category.created_by ===
    userId;

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    nameEn,
    setNameEn,
  ] =
    useState(
      category.name_en
    );

  const [
    nameZh,
    setNameZh,
  ] =
    useState(
      category.name_zh ?? ""
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function saveRename(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanEnglish =
      nameEn.trim();

    const cleanChinese =
      nameZh.trim();

    if (!cleanEnglish) {
      setError(
        "English name is required."
      );

      return;
    }

    setLoading(true);

    const supabase =
      createClient();

    const {
      error: updateError,
    } = await supabase
      .from("categories")
      .update({
        name_en:
          cleanEnglish,

        name_zh:
          cleanChinese ||
          cleanEnglish,
      })
      .eq(
        "id",
        category.id
      )
      .eq(
        "created_by",
        userId
      )
      .eq(
        "is_system",
        false
      );

    if (updateError) {
      setError(
        updateError.message
      );

      setLoading(false);

      return;
    }

    setEditing(false);

    router.refresh();

    setLoading(false);
  }


  async function deleteCategory() {
    const confirmed =
      window.confirm(
        `Delete "${category.name_en}"?`
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    const supabase =
      createClient();

    const {
      error: deleteError,
    } = await supabase
      .from("categories")
      .delete()
      .eq(
        "id",
        category.id
      )
      .eq(
        "created_by",
        userId
      )
      .eq(
        "is_system",
        false
      );

    if (deleteError) {
      if (
        deleteError.code ===
        "23503"
      ) {
        setError(
          "This category is already in use. Rename it instead of deleting it."
        );
      } else {
        setError(
          deleteError.message
        );
      }

      setLoading(false);

      return;
    }

    router.refresh();

    setLoading(false);
  }


  if (editing) {
    return (
      <article className="rounded-3xl border border-gray-100 bg-white p-5">

        <form
          onSubmit={
            saveRename
          }
          className="space-y-4"
        >

          <div>
            <label className="text-sm font-medium text-gray-700">
              English Name
            </label>

            <input
              type="text"
              value={
                nameEn
              }
              onChange={(
                event
              ) =>
                setNameEn(
                  event.target.value
                )
              }
              required
              maxLength={50}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
            />
          </div>


          <div>
            <label className="text-sm font-medium text-gray-700">
              中文名称
            </label>

            <input
              type="text"
              value={
                nameZh
              }
              onChange={(
                event
              ) =>
                setNameZh(
                  event.target.value
                )
              }
              maxLength={50}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
            />
          </div>


          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}


          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => {
                setEditing(false);

                setNameEn(
                  category.name_en
                );

                setNameZh(
                  category.name_zh ??
                    ""
                );

                setError("");
              }}
              className="rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                loading
              }
              className="rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>

          </div>

        </form>

      </article>
    );
  }


  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="font-semibold text-gray-900">
            🏷️{" "}
            {category.name_en}
          </p>


          {category.name_zh &&
            category.name_zh !==
              category.name_en && (

            <p className="mt-1 text-sm text-gray-500">
              {
                category.name_zh
              }
            </p>

          )}


          <div className="mt-2 flex flex-wrap gap-2">

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              {typeLabel(
                category.category_type
              )}
            </span>


            <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-400">
              Created by{" "}
              {
                category.createdByName
              }

              {canManage
                ? " (You)"
                : ""}
            </span>

          </div>

        </div>


        {canManage && (

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() =>
                setEditing(
                  true
                )
              }
              className="text-sm font-medium text-gray-700"
            >
              Edit
            </button>


            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                deleteCategory
              }
              className="text-sm font-medium text-red-600 disabled:opacity-50"
            >
              Delete
            </button>

          </div>

        )}

      </div>


      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

    </article>
  );
}