"use client";

import type { QuoteResult } from "@/lib/api";

function formatRs(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatKg(value: number) {
  return `${value.toFixed(3)} kg`;
}

export function CostBreakdown({ quote }: { quote: QuoteResult | null }) {
  if (!quote) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Enter job details to see cost breakdown.
      </div>
    );
  }

  const rows = [
    {
      label: "Raw material",
      detail: `${formatKg(quote.raw.weight_kg)} @ material rate`,
      value: quote.raw.material_cost,
    },
    ...quote.operations.map((op) => ({
      label: op.operation_name,
      detail: `${op.param_value} × ₹${op.rate_per_unit}/${op.driving_param_type}`,
      value: op.cost,
    })),
    {
      label: "Total labour",
      detail: `${quote.operations.length} operation(s)`,
      value: quote.total_labour_cost,
    },
    ...(quote.plating_cost > 0
      ? [
          {
            label: "Plating",
            detail: `on ${formatKg(quote.finished.weight_kg)}`,
            value: quote.plating_cost,
          },
        ]
      : []),
    { label: "Packing & forwarding", detail: "", value: quote.packing_cost },
    { label: "Transport", detail: "", value: quote.transport_cost },
    {
      label: "Running total",
      detail: "all costs before margin",
      value: quote.running_total,
      bold: true,
    },
    {
      label: "Final quoted rate",
      detail: "margin on material + labour only",
      value: quote.final_rate,
      final: true,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Cost Breakdown</h2>
      <dl className="mt-4 space-y-3">
        <div className="flex justify-between text-xs text-slate-500">
          <dt>Raw cross-section</dt>
          <dd>{quote.raw.cross_section_area.toFixed(2)} mm²</dd>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <dt>Raw weight</dt>
          <dd>{formatKg(quote.raw.weight_kg)}</dd>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <dt>Finished weight</dt>
          <dd>{formatKg(quote.finished.weight_kg)}</dd>
        </div>
        <hr className="border-slate-100" />
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-start justify-between gap-4 ${
              row.final ? "rounded-lg bg-blue-50 px-3 py-2" : ""
            }`}
          >
            <dt
              className={`text-sm ${
                row.bold || row.final ? "font-semibold text-slate-900" : "text-slate-700"
              }`}
            >
              {row.label}
              {row.detail && (
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  {row.detail}
                </span>
              )}
            </dt>
            <dd
              className={`text-sm tabular-nums ${
                row.bold || row.final ? "font-bold text-slate-900" : "text-slate-800"
              }`}
            >
              {row.final
                ? `₹${row.value.toLocaleString("en-IN")}`
                : formatRs(row.value)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-slate-400">Amounts are pre-tax.</p>
    </div>
  );
}
