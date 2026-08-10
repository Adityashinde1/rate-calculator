"use client";

import { useEffect, useState } from "react";
import { api, type Operation } from "@/lib/api";
import { OperationForm } from "@/components/OperationForm";

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setOperations(await api.operations.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Operations</h1>
      <p className="mt-1 text-sm text-slate-500">
        Define machining operations with rates per unit
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Add operation</h2>
        <OperationForm
          onSubmit={async (data) => {
            await api.operations.create(data);
            await load();
          }}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Machine</th>
              <th className="px-4 py-3 font-medium">Parameter</th>
              <th className="px-4 py-3 font-medium">Rate/unit</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {operations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No operations yet. Add your first operation above.
                </td>
              </tr>
            )}
            {operations.map((op) => (
              <tr key={op.id}>
                <td className="px-4 py-3 font-medium">{op.name}</td>
                <td className="px-4 py-3">{op.machine}</td>
                <td className="px-4 py-3">{op.driving_param_type}</td>
                <td className="px-4 py-3">₹{op.rate_per_unit}</td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="cursor-pointer text-blue-700">Edit</summary>
                    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <OperationForm
                        defaultValues={op}
                        onSubmit={async (data) => {
                          await api.operations.update(op.id, data);
                          await load();
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await api.operations.remove(op.id);
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
