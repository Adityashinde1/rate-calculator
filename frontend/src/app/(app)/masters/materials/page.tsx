"use client";

import { useEffect, useState } from "react";
import { api, type Material } from "@/lib/api";
import { MaterialForm } from "@/components/MaterialForm";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setMaterials(await api.materials.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Materials</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage material densities and default rates per kg
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Add material</h2>
        <MaterialForm
          onSubmit={async (data) => {
            await api.materials.create(data);
            await load();
          }}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Density (g/cm³)</th>
              <th className="px-4 py-3 font-medium">Default rate (₹/kg)</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3">{m.density_gcm3}</td>
                <td className="px-4 py-3">{m.default_rate_per_kg ?? "—"}</td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="cursor-pointer text-blue-700">Edit</summary>
                    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <MaterialForm
                        defaultValues={m}
                        onSubmit={async (data) => {
                          await api.materials.update(m.id, data);
                          await load();
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await api.materials.remove(m.id);
                          await load();
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Soft delete
                      </button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
