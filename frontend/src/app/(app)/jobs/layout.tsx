import { Suspense } from "react";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>{children}</Suspense>;
}
