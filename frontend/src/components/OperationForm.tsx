"use client";

import { FormEvent, useState } from "react";
import type { Operation } from "@/lib/api";
import { MACHINES, PARAM_TYPES } from "@/lib/constants";

export function OperationForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: Omit<Operation, "id">) => Promise<void>;
  defaultValues?: Operation;
}) {
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState(
    MACHINES.includes(defaultValues?.machine as (typeof MACHINES)[number])
      ? defaultValues!.machine
      : defaultValues?.machine
        ? "Other"
        : MACHINES[0]
  );
  const [paramType, setParamType] = useState(
    defaultValues?.driving_param_type ?? "length"
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const machineOther = form.get("machine_other") as string | null;
    try {
      await onSubmit({
        name: form.get("name") as string,
        machine: machine === "Other" ? machineOther || "Other" : machine,
        machine_other: machine === "Other" ? machineOther : null,
        driving_param_type: paramType as Operation["driving_param_type"],
        custom_unit_label:
          paramType === "custom" ? (form.get("custom_unit_label") as string) : null,
        rate_per_unit: parseFloat(form.get("rate_per_unit") as string),
      });
      setError(null);
      if (!defaultValues) e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <input
        name="name"
        defaultValue={defaultValues?.name}
        placeholder="Operation name"
        required
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        value={machine}
        onChange={(e) => setMachine(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {MACHINES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      {machine === "Other" && (
        <input
          name="machine_other"
          defaultValue={
            defaultValues &&
            !MACHINES.includes(defaultValues.machine as (typeof MACHINES)[number])
              ? defaultValues.machine
              : ""
          }
          placeholder="Machine name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
      <select
        value={paramType}
        onChange={(e) => setParamType(e.target.value as Operation["driving_param_type"])}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {PARAM_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {paramType === "custom" && (
        <input
          name="custom_unit_label"
          defaultValue={defaultValues?.custom_unit_label ?? ""}
          placeholder="Custom unit label"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
      <input
        name="rate_per_unit"
        type="number"
        step="any"
        defaultValue={defaultValues?.rate_per_unit}
        placeholder="Rate per unit (₹)"
        required
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
