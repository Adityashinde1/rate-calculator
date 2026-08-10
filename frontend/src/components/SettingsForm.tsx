"use client";

import { FormEvent, useState } from "react";
import type { AppSettings, CostBasis } from "@/lib/api";

export function SettingsForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: Partial<AppSettings>) => Promise<void>;
  defaultValues: AppSettings;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await onSubmit({
        default_plating_rate_per_kg: form.get("default_plating_rate_per_kg")
          ? parseFloat(form.get("default_plating_rate_per_kg") as string)
          : null,
        default_packing_basis: form.get("default_packing_basis") as CostBasis,
        default_packing_value: form.get("default_packing_value")
          ? parseFloat(form.get("default_packing_value") as string)
          : null,
        default_transport_basis: form.get("default_transport_basis") as CostBasis,
        default_transport_value: form.get("default_transport_value")
          ? parseFloat(form.get("default_transport_value") as string)
          : null,
      });
      setError(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSuccess(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Settings saved.</p>}

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Default plating rate (₹/kg)
        </label>
        <input
          name="default_plating_rate_per_kg"
          type="number"
          step="any"
          defaultValue={defaultValues.default_plating_rate_per_kg ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Default packing basis
          </label>
          <select
            name="default_packing_basis"
            defaultValue={defaultValues.default_packing_basis ?? "flat"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="flat">Flat (₹)</option>
            <option value="per_kg">Per kg (₹/kg)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Default packing value
          </label>
          <input
            name="default_packing_value"
            type="number"
            step="any"
            defaultValue={defaultValues.default_packing_value ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Default transport basis
          </label>
          <select
            name="default_transport_basis"
            defaultValue={defaultValues.default_transport_basis ?? "flat"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="flat">Flat (₹)</option>
            <option value="per_kg">Per kg (₹/kg)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Default transport value
          </label>
          <input
            name="default_transport_value"
            type="number"
            step="any"
            defaultValue={defaultValues.default_transport_value ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        Save settings
      </button>
    </form>
  );
}
