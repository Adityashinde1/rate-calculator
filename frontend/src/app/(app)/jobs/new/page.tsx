"use client";

import { useEffect, useState } from "react";
import { api, type AppSettings, type Material, type Operation, type Shape } from "@/lib/api";
import { JobQuoteForm } from "@/components/JobQuoteForm";

export default function NewJobPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.materials.list(),
      api.shapes.list(),
      api.operations.list(),
      api.settings.get(),
    ])
      .then(([m, s, o, st]) => {
        setMaterials(m);
        setShapes(s);
        setOperations(o);
        setSettings(st);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">New Quote</h1>
      <p className="mt-1 text-sm text-slate-500">Calculate rate for a new component</p>
      <div className="mt-6">
        <JobQuoteForm
          materials={materials}
          shapes={shapes}
          operations={operations}
          settings={settings}
        />
      </div>
    </div>
  );
}
