"use client";

import { useEffect, useState } from "react";
import { api, type AppSettings } from "@/lib/api";
import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.settings
      .get()
      .then(setSettings)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">App Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Default values pre-filled when creating new quotes
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        {settings ? (
          <SettingsForm
            defaultValues={settings}
            onSubmit={async (data) => {
              const updated = await api.settings.update(data);
              setSettings(updated);
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">Loading...</p>
        )}
      </div>
    </div>
  );
}
