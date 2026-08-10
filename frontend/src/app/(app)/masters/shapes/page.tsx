"use client";

import { useEffect, useState } from "react";
import { api, type Shape } from "@/lib/api";

export default function ShapesPage() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.shapes
      .list()
      .then(setShapes)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Shapes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Standard cross-section shapes used for weight calculation (read-only)
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {shapes.map((shape) => (
          <div key={shape.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">{shape.name}</h2>
            <p className="mt-1 text-xs text-slate-400">formula: {shape.formula_key}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {shape.required_fields.map((field) => (
                <li key={field}>· {shape.dimension_labels[field] ?? field}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Weight = Area × Length × Density ÷ 1,000,000
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
