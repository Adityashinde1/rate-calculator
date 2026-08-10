"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type AppSettings, type Job, type Material, type Operation, type Shape } from "@/lib/api";
import { JobQuoteForm } from "@/components/JobQuoteForm";

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.jobs.get(params.id),
      api.materials.list(),
      api.shapes.list(),
      api.operations.list(),
      api.settings.get(),
    ])
      .then(([j, m, s, o, st]) => {
        setJob(j);
        setMaterials(m);
        setShapes(s);
        setOperations(o);
        setSettings(st);
      })
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!job) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Edit Quote</h1>
      <p className="mt-1 text-sm text-slate-500">{job.component_name}</p>
      <div className="mt-6">
        <JobQuoteForm
          materials={materials}
          shapes={shapes}
          operations={operations}
          settings={settings}
          initialJob={job}
        />
      </div>
    </div>
  );
}
