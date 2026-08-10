"use client";

import Link from "next/link";

export function AppNav({
  workshopName,
  userEmail,
  onLogout,
}: {
  workshopName: string;
  userEmail: string;
  onLogout: () => void;
}) {
  const links = [
    { href: "/jobs", label: "Jobs" },
    { href: "/jobs/new", label: "New Quote" },
    { href: "/masters/materials", label: "Materials" },
    { href: "/masters/operations", label: "Operations" },
    { href: "/masters/shapes", label: "Shapes" },
    { href: "/masters/settings", label: "Settings" },
  ];

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div>
          <Link href="/jobs" className="text-lg font-semibold text-slate-900">
            {workshopName}
          </Link>
          <p className="text-xs text-slate-500">Rate Calculator</p>
        </div>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{userEmail}</span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
