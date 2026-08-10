"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, type JobListItem } from "@/lib/api";
import { JobSearch } from "@/components/JobSearch";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const material = searchParams.get("material") ?? "";

  useEffect(() => {
    setLoading(true);
    api.jobs
      .list({
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        material: material || undefined,
      })
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, status, material]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Quotes</h1>
          <p className="text-sm text-slate-500">Search and manage saved quotes</p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          New quote
        </Link>
      </div>

      <JobSearch
        initialSearch={search}
        initialStatus={status}
        initialMaterial={material}
        onSearch={(params) => {
          const qs = new URLSearchParams();
          if (params.search) qs.set("search", params.search);
          if (params.status && params.status !== "all") qs.set("status", params.status);
          if (params.material) qs.set("material", params.material);
          router.push(`/jobs?${qs.toString()}`);
        }}
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Final rate</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No quotes found. Create your first quote.
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/jobs/${job.id}`} className="hover:text-blue-700">
                      {job.component_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{job.customer_ref ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{job.material_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.status === "finalized"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(job.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    ₹{job.final_rate.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="text-blue-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
