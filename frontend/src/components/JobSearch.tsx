"use client";

export function JobSearch({
  initialSearch,
  initialStatus,
  initialMaterial,
  onSearch,
}: {
  initialSearch: string;
  initialStatus: string;
  initialMaterial: string;
  onSearch: (params: { search: string; status: string; material: string }) => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSearch({
      search: (form.get("search") as string) || "",
      status: (form.get("status") as string) || "all",
      material: (form.get("material") as string) || "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-3">
      <input
        name="search"
        defaultValue={initialSearch}
        placeholder="Search component or customer..."
        className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="material"
        defaultValue={initialMaterial}
        placeholder="Filter by material..."
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        name="status"
        defaultValue={initialStatus}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="all">All statuses</option>
        <option value="draft">Draft</option>
        <option value="finalized">Finalized</option>
      </select>
      <button
        type="submit"
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
      >
        Search
      </button>
    </form>
  );
}
