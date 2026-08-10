"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type AppSettings, type Job, type Material, type Operation, type QuoteResult, type Shape } from "@/lib/api";
import { CostBreakdown } from "@/components/CostBreakdown";
import { NumberField } from "@/components/NumberField";

type OperationLine = {
  operation_id: string;
  operation_name: string;
  machine: string;
  driving_param_type: Operation["driving_param_type"];
  custom_unit_label: string | null;
  rate_per_unit: number;
  param_value: number;
};

function emptyDimensions(shape: Shape | undefined): Record<string, number> {
  if (!shape) return {};
  const dims: Record<string, number> = {};
  for (const field of shape.required_fields) dims[field] = 0;
  return dims;
}

function getShapeById(shapes: Shape[], id: string) {
  return shapes.find((s) => s.id === id);
}

function jobToLines(job: Job): OperationLine[] {
  return job.operations.map((op) => ({
    operation_id: op.operation_id ?? "",
    operation_name: op.operation_name,
    machine: op.machine,
    driving_param_type: op.driving_param_type,
    custom_unit_label: op.custom_unit_label,
    rate_per_unit: op.rate_per_unit,
    param_value: op.param_value,
  }));
}

export function JobQuoteForm({
  materials,
  shapes,
  operations,
  settings,
  initialJob,
  duplicateFrom,
}: {
  materials: Material[];
  shapes: Shape[];
  operations: Operation[];
  settings: AppSettings | null;
  initialJob?: Job;
  duplicateFrom?: Job;
}) {
  const router = useRouter();
  const source = duplicateFrom ?? initialJob;
  const isEdit = !!initialJob && !duplicateFrom;
  const isFinalized = initialJob?.status === "finalized";

  const defaultShape = shapes[0];
  const defaultMaterial = materials[0];

  const [componentName, setComponentName] = useState(
    duplicateFrom
      ? `${duplicateFrom.component_name} (copy)`
      : source?.component_name ?? ""
  );
  const [customerRef, setCustomerRef] = useState(source?.customer_ref ?? "");
  const [materialId, setMaterialId] = useState(
    source?.material_id ?? defaultMaterial?.id ?? ""
  );
  const [materialRatePerKg, setMaterialRatePerKg] = useState(
    source?.material_rate_per_kg ?? defaultMaterial?.default_rate_per_kg ?? 0
  );
  const [rawShapeId, setRawShapeId] = useState(
    source?.raw_shape_id ?? defaultShape?.id ?? ""
  );
  const [rawDimensions, setRawDimensions] = useState<Record<string, number>>(
    source?.raw_dimensions ?? emptyDimensions(defaultShape)
  );
  const [rawLength, setRawLength] = useState(source?.raw_length ?? 0);
  const [finishedShapeId, setFinishedShapeId] = useState(
    source?.finished_shape_id ?? source?.raw_shape_id ?? defaultShape?.id ?? ""
  );
  const [finishedDimensions, setFinishedDimensions] = useState<Record<string, number>>(
    source?.finished_dimensions ?? emptyDimensions(defaultShape)
  );
  const [finishedLength, setFinishedLength] = useState(
    source?.finished_length ?? source?.raw_length ?? 0
  );
  const [sameAsRaw, setSameAsRaw] = useState(
    !source || source.finished_shape_id === source.raw_shape_id
  );
  const [operationLines, setOperationLines] = useState<OperationLine[]>(
    source ? jobToLines(source) : []
  );
  const [platingEnabled, setPlatingEnabled] = useState(source?.plating_enabled ?? false);
  const [platingRatePerKg, setPlatingRatePerKg] = useState(
    source?.plating_rate_per_kg ?? settings?.default_plating_rate_per_kg ?? 0
  );
  const [packingBasis, setPackingBasis] = useState<"flat" | "per_kg">(
    source?.packing_basis ?? settings?.default_packing_basis ?? "flat"
  );
  const [packingValue, setPackingValue] = useState(
    source?.packing_value ?? settings?.default_packing_value ?? 0
  );
  const [transportBasis, setTransportBasis] = useState<"flat" | "per_kg">(
    source?.transport_basis ?? settings?.default_transport_basis ?? "flat"
  );
  const [transportValue, setTransportValue] = useState(
    source?.transport_value ?? settings?.default_transport_value ?? 0
  );
  const [marginPercent, setMarginPercent] = useState(source?.margin_percent ?? 10);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedMaterial =
    materials.find((m) => m.id === materialId) ?? defaultMaterial;
  const rawShape = getShapeById(shapes, rawShapeId) ?? defaultShape;
  const finishedShape = getShapeById(shapes, finishedShapeId) ?? rawShape;

  const calcPayload = useMemo(() => {
    if (!selectedMaterial || !rawShape || !finishedShape) return null;
    if (rawLength <= 0 || finishedLength <= 0) return null;
    return {
      material_density: selectedMaterial.density_gcm3,
      material_rate_per_kg: materialRatePerKg,
      raw_formula_key: rawShape.formula_key,
      raw_dimensions: rawDimensions,
      raw_length: rawLength,
      finished_formula_key: finishedShape.formula_key,
      finished_dimensions: finishedDimensions,
      finished_length: finishedLength,
      operations: operationLines.map((op) => ({
        operation_id: op.operation_id || null,
        operation_name: op.operation_name,
        machine: op.machine,
        driving_param_type: op.driving_param_type,
        custom_unit_label: op.custom_unit_label,
        rate_per_unit: op.rate_per_unit,
        param_value: op.param_value,
      })),
      plating_enabled: platingEnabled,
      plating_rate_per_kg: platingEnabled ? platingRatePerKg : null,
      packing_basis: packingBasis,
      packing_value: packingValue,
      transport_basis: transportBasis,
      transport_value: transportValue,
      margin_percent: marginPercent,
    };
  }, [
    selectedMaterial,
    materialRatePerKg,
    rawShape,
    rawDimensions,
    rawLength,
    finishedShape,
    finishedDimensions,
    finishedLength,
    operationLines,
    platingEnabled,
    platingRatePerKg,
    packingBasis,
    packingValue,
    transportBasis,
    transportValue,
    marginPercent,
  ]);

  useEffect(() => {
    if (!calcPayload) {
      setQuote(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const result = await api.quotes.calculate(calcPayload);
        setQuote(result);
        setError(null);
      } catch (err) {
        setQuote(null);
        if (err instanceof Error && !err.message.includes("must be")) {
          // keep silent for incomplete dims; show other errors lightly
        }
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [calcPayload]);

  function handleMaterialChange(id: string) {
    setMaterialId(id);
    const mat = materials.find((m) => m.id === id);
    if (mat?.default_rate_per_kg != null) setMaterialRatePerKg(mat.default_rate_per_kg);
  }

  function handleRawShapeChange(id: string) {
    setRawShapeId(id);
    const shape = getShapeById(shapes, id);
    setRawDimensions(emptyDimensions(shape));
    if (sameAsRaw) {
      setFinishedShapeId(id);
      setFinishedDimensions(emptyDimensions(shape));
    }
  }

  function handleSameAsRaw(checked: boolean) {
    setSameAsRaw(checked);
    if (checked) {
      setFinishedShapeId(rawShapeId);
      setFinishedDimensions({ ...rawDimensions });
      setFinishedLength(rawLength);
    }
  }

  function addOperation(opId: string) {
    const op = operations.find((o) => o.id === opId);
    if (!op) return;
    setOperationLines((prev) => [
      ...prev,
      {
        operation_id: op.id,
        operation_name: op.name,
        machine: op.machine,
        driving_param_type: op.driving_param_type,
        custom_unit_label: op.custom_unit_label,
        rate_per_unit: op.rate_per_unit,
        param_value: 0,
      },
    ]);
  }

  async function handleSave(status: "draft" | "finalized") {
    if (!quote || !selectedMaterial || !rawShape || !finishedShape || !calcPayload) {
      setError("Please complete all required fields with valid dimensions.");
      return;
    }
    if (!componentName.trim()) {
      setError("Component name is required.");
      return;
    }
    if (isFinalized && isEdit) {
      setError("Finalized quotes cannot be edited. Please duplicate instead.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...calcPayload,
      component_name: componentName,
      customer_ref: customerRef || null,
      status,
      material_id: selectedMaterial.id,
      material_name: selectedMaterial.name,
      raw_shape_id: rawShape.id,
      raw_shape_name: rawShape.name,
      finished_shape_id: finishedShape.id,
      finished_shape_name: finishedShape.name,
      client_final_rate: quote.final_rate,
    };

    try {
      const job = isEdit
        ? await api.jobs.update(initialJob!.id, payload)
        : await api.jobs.create(payload);
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function renderDimensionFields(
    shape: Shape,
    dimensions: Record<string, number>,
    onChange: (dims: Record<string, number>) => void
  ) {
    return shape.required_fields.map((field) => (
      <div key={field}>
        <label className="block text-sm font-medium text-slate-700">
          {shape.dimension_labels[field] ?? field}
        </label>
        <NumberField
          min="0"
          step="any"
          value={dimensions[field] ?? 0}
          onChange={(val) => onChange({ ...dimensions, [field]: val })}
          disabled={isFinalized && isEdit}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>
    ));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {isFinalized && isEdit && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This quote is finalized and read-only. Use Duplicate to create a new quote.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Component</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Component name *</label>
              <input
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Customer reference</label>
              <input
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Raw Material</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Material</label>
              <select
                value={materialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.density_gcm3} g/cm³)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Rate (₹/kg)</label>
              <NumberField
                min="0"
                step="any"
                value={materialRatePerKg}
                onChange={setMaterialRatePerKg}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Shape</label>
              <select
                value={rawShapeId}
                onChange={(e) => handleRawShapeChange(e.target.value)}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              >
                {shapes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Length (mm)</label>
              <NumberField
                min="0"
                step="any"
                value={rawLength}
                onChange={(val) => {
                  setRawLength(val);
                  if (sameAsRaw) setFinishedLength(val);
                }}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            {rawShape &&
              renderDimensionFields(rawShape, rawDimensions, (dims) => {
                setRawDimensions(dims);
                if (sameAsRaw) setFinishedDimensions(dims);
              })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Operations</h2>
          <div className="mt-4">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addOperation(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={isFinalized && isEdit}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">+ Add operation...</option>
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.machine})
                </option>
              ))}
            </select>
          </div>
          {operationLines.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No operations added yet.</p>
          )}
          <div className="mt-4 space-y-3">
            {operationLines.map((op, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="min-w-[120px] flex-1">
                  <p className="text-sm font-medium text-slate-800">{op.operation_name}</p>
                  <p className="text-xs text-slate-500">
                    {op.machine} · ₹{op.rate_per_unit}/{op.driving_param_type}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Value</label>
                  <NumberField
                    min="0"
                    step="any"
                    value={op.param_value}
                    onChange={(val) => {
                      setOperationLines((prev) =>
                        prev.map((line, i) =>
                          i === index ? { ...line, param_value: val } : line
                        )
                      );
                    }}
                    disabled={isFinalized && isEdit}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50"
                  />
                </div>
                {!(isFinalized && isEdit) && (
                  <button
                    type="button"
                    onClick={() =>
                      setOperationLines((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Finished Piece</h2>
          <p className="mt-1 text-sm text-slate-500">
            Usually same shape as raw stock, with smaller dimensions after machining.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sameAsRaw}
              onChange={(e) => handleSameAsRaw(e.target.checked)}
              disabled={isFinalized && isEdit}
            />
            Same shape and dimensions as raw
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {!sameAsRaw && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Finished shape</label>
                <select
                  value={finishedShapeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFinishedShapeId(id);
                    setFinishedDimensions(emptyDimensions(getShapeById(shapes, id)));
                  }}
                  disabled={isFinalized && isEdit}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                >
                  {shapes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Finished length (mm)
              </label>
              <NumberField
                min="0"
                step="any"
                value={finishedLength}
                onChange={setFinishedLength}
                disabled={(isFinalized && isEdit) || sameAsRaw}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            {finishedShape &&
              !sameAsRaw &&
              renderDimensionFields(finishedShape, finishedDimensions, setFinishedDimensions)}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">
            Plating, Packing, Transport & Margin
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={platingEnabled}
                onChange={(e) => setPlatingEnabled(e.target.checked)}
                disabled={isFinalized && isEdit}
              />
              Apply plating / surface treatment
            </label>
            {platingEnabled && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Plating rate (₹/kg)
                </label>
                <NumberField
                  min="0"
                  step="any"
                  value={platingRatePerKg}
                  onChange={setPlatingRatePerKg}
                  disabled={isFinalized && isEdit}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Packing basis</label>
              <select
                value={packingBasis}
                onChange={(e) => setPackingBasis(e.target.value as "flat" | "per_kg")}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              >
                <option value="flat">Flat amount (₹)</option>
                <option value="per_kg">Per kg (₹/kg)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Packing value</label>
              <NumberField
                min="0"
                step="any"
                value={packingValue}
                onChange={setPackingValue}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Transport basis</label>
              <select
                value={transportBasis}
                onChange={(e) => setTransportBasis(e.target.value as "flat" | "per_kg")}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              >
                <option value="flat">Flat amount (₹)</option>
                <option value="per_kg">Per kg (₹/kg)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Transport value</label>
              <NumberField
                min="0"
                step="any"
                value={transportValue}
                onChange={setTransportValue}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Profit margin (%)</label>
              <NumberField
                min="0"
                step="any"
                value={marginPercent}
                onChange={setMarginPercent}
                disabled={isFinalized && isEdit}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>
        </section>

        {!(isFinalized && isEdit) && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("finalized")}
              disabled={saving}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & finalize"}
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <CostBreakdown quote={quote} />
        </div>
      </div>
    </div>
  );
}
