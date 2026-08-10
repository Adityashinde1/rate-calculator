"use client";

import { FormEvent, useState } from "react";
import type { Material } from "@/lib/api";

export function MaterialForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: Omit<Material, "id">) => Promise<void>;
  defaultValues?: Material;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await onSubmit({
        name: form.get("name") as string,
        density_gcm3: parseFloat(form.get("density_gcm3") as string),
        default_rate_per_kg: form.get("default_rate_per_kg")
          ? parseFloat(form.get("default_rate_per_kg") as string)
          : null,
      });
      setError(null);
      if (!defaultValues) e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-4">
      {error && <p className="sm:col-span-4 text-sm text-red-600">{error}</p>}
      <input
        name="name"
        defaultValue={defaultValues?.name}
        placeholder="Name"
        required
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="density_gcm3"
        type="number"
        step="any"
        defaultValue={defaultValues?.density_gcm3}
        placeholder="Density"
        required
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="default_rate_per_kg"
        type="number"
        step="any"
        defaultValue={defaultValues?.default_rate_per_kg ?? undefined}
        placeholder="Default ₹/kg"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        {defaultValues ? "Update" : "Add"}
      </button>
    </form>
  );
}
