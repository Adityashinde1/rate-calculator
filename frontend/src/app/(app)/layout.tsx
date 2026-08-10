"use client";

import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/components/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <AppNav
        workshopName={user.workshop_name}
        userEmail={user.email}
        onLogout={logout}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
