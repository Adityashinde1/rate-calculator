"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type Job } from "@/lib/api";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.jobs
      .get(params.id)
      .then(setJob)
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!job) return <p className="text-sm text-slate-500">Loading...</p>;

  const formatRs = (v: number) =>
    `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.component_name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {job.material_name} · {job.raw_shape_name} ·{" "}
            <span className="capitalize">{job.status}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.status === "draft" && (
            <Link
              href={`/jobs/${job.id}/edit`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Edit
            </Link>
          )}
          <Link
            href={`/jobs/${job.id}/duplicate`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Duplicate
          </Link>
          <Link
            href={`/jobs/${job.id}/print`}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Print
          </Link>
        </div>
      </div>

      {job.status === "finalized" && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This quote is finalized. To make changes, duplicate it to create a new quote.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Customer ref</dt>
              <dd>{job.customer_ref ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Raw weight</dt>
              <dd>{job.raw_weight.toFixed(3)} kg</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Finished weight</dt>
              <dd>{job.finished_weight.toFixed(3)} kg</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Created</dt>
              <dd>{new Date(job.created_at).toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="font-semibold text-blue-900">Final quoted rate</h2>
          <p className="mt-2 text-3xl font-bold text-blue-900">
            ₹{job.final_rate.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-sm text-blue-700">
            incl. {job.margin_percent}% margin on material + labour only
            (extras at cost). Costs before margin: {formatRs(job.running_total)}
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Cost breakdown</h2>
        <table className="mt-4 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2">Raw material</td>
              <td className="py-2 text-right">{formatRs(job.raw_material_cost)}</td>
            </tr>
            {job.operations.map((op) => (
              <tr key={op.id}>
                <td className="py-2">
                  {op.operation_name}
                  <span className="block text-xs text-slate-400">
                    {op.machine} · {op.param_value} × ₹{op.rate_per_unit}
                  </span>
                </td>
                <td className="py-2 text-right">{formatRs(op.cost)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-medium">Total labour</td>
              <td className="py-2 text-right font-medium">{formatRs(job.total_labour_cost)}</td>
            </tr>
            {job.plating_cost > 0 && (
              <tr>
                <td className="py-2">Plating</td>
                <td className="py-2 text-right">{formatRs(job.plating_cost)}</td>
              </tr>
            )}
            <tr>
              <td className="py-2">Packing & forwarding</td>
              <td className="py-2 text-right">{formatRs(job.packing_cost)}</td>
            </tr>
            <tr>
              <td className="py-2">Transport</td>
              <td className="py-2 text-right">{formatRs(job.transport_cost)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-xs text-slate-400">Amounts are pre-tax.</p>
      </section>
    </div>
  );
}
