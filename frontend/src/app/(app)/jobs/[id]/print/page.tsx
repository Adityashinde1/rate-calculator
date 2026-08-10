"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type Job } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PrintableQuote } from "@/components/PrintableQuote";

export default function PrintJobPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
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

  return (
    <PrintableQuote job={job} workshopName={user?.workshop_name ?? "Workshop"} />
  );
}
