import { apiFetch, clearToken, setToken } from "./client";
import type {
  AppSettings,
  Job,
  JobListItem,
  JobPayload,
  Material,
  Operation,
  QuoteResult,
  Shape,
  User,
} from "./types";

export * from "./types";
export { ApiError, clearToken, getToken } from "./client";

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await apiFetch<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      return res;
    },
    me: () => apiFetch<User>("/auth/me"),
    logout: () => clearToken(),
  },
  materials: {
    list: () => apiFetch<Material[]>("/materials"),
    create: (body: Omit<Material, "id">) =>
      apiFetch<Material>("/materials", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Omit<Material, "id">) =>
      apiFetch<Material>(`/materials/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      apiFetch<void>(`/materials/${id}`, { method: "DELETE" }),
  },
  operations: {
    list: () => apiFetch<Operation[]>("/operations"),
    create: (body: Omit<Operation, "id">) =>
      apiFetch<Operation>("/operations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Omit<Operation, "id">) =>
      apiFetch<Operation>(`/operations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      apiFetch<void>(`/operations/${id}`, { method: "DELETE" }),
  },
  shapes: {
    list: () => apiFetch<Shape[]>("/shapes"),
  },
  settings: {
    get: () => apiFetch<AppSettings>("/settings"),
    update: (body: Partial<AppSettings>) =>
      apiFetch<AppSettings>("/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  jobs: {
    list: (params?: { search?: string; status?: string; material?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status) qs.set("status", params.status);
      if (params?.material) qs.set("material", params.material);
      const q = qs.toString();
      return apiFetch<JobListItem[]>(`/jobs${q ? `?${q}` : ""}`);
    },
    get: (id: string) => apiFetch<Job>(`/jobs/${id}`),
    create: (body: JobPayload) =>
      apiFetch<Job>("/jobs", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: JobPayload) =>
      apiFetch<Job>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    duplicate: (id: string) =>
      apiFetch<Job>(`/jobs/${id}/duplicate`, { method: "POST" }),
  },
  quotes: {
    calculate: (body: Omit<JobPayload, "component_name" | "status" | "client_final_rate" | "material_name" | "raw_shape_id" | "raw_shape_name" | "finished_shape_id" | "finished_shape_name" | "material_id" | "customer_ref"> & {
      material_density: number;
      material_rate_per_kg: number;
      raw_formula_key: string;
      finished_formula_key: string;
    }) =>
      apiFetch<QuoteResult>("/quotes/calculate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
