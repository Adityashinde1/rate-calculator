export type DrivingParamType =
  | "length"
  | "diameter"
  | "depth"
  | "area"
  | "passes"
  | "count"
  | "custom";

export type CostBasis = "flat" | "per_kg";
export type JobStatus = "draft" | "finalized";

export interface User {
  id: string;
  email: string;
  name: string | null;
  workshop_id: string;
  workshop_name: string;
}

export interface Material {
  id: string;
  name: string;
  density_gcm3: number;
  default_rate_per_kg: number | null;
}

export interface Shape {
  id: string;
  name: string;
  formula_key: string;
  required_fields: string[];
  dimension_labels: Record<string, string>;
}

export interface Operation {
  id: string;
  name: string;
  machine: string;
  machine_other: string | null;
  driving_param_type: DrivingParamType;
  custom_unit_label: string | null;
  rate_per_unit: number;
}

export interface AppSettings {
  id: string;
  workshop_id: string;
  default_plating_rate_per_kg: number | null;
  default_packing_basis: CostBasis | null;
  default_packing_value: number | null;
  default_transport_basis: CostBasis | null;
  default_transport_value: number | null;
}

export interface OperationLine {
  operation_id?: string | null;
  operation_name: string;
  machine: string;
  driving_param_type: DrivingParamType;
  custom_unit_label?: string | null;
  rate_per_unit: number;
  param_value: number;
}

export interface QuoteResult {
  raw: {
    cross_section_area: number;
    weight_kg: number;
    material_cost: number;
  };
  finished: {
    cross_section_area: number;
    weight_kg: number;
  };
  operations: Array<{
    operation_name: string;
    machine: string;
    driving_param_type: string;
    custom_unit_label?: string | null;
    rate_per_unit: number;
    param_value: number;
    cost: number;
  }>;
  total_labour_cost: number;
  plating_cost: number;
  packing_cost: number;
  transport_cost: number;
  running_total: number;
  final_rate: number;
}

export interface JobListItem {
  id: string;
  component_name: string;
  customer_ref: string | null;
  material_name: string;
  status: JobStatus;
  final_rate: number;
  created_at: string;
}

export interface JobOperation {
  id: string;
  sort_order: number;
  operation_id: string | null;
  operation_name: string;
  machine: string;
  driving_param_type: DrivingParamType;
  custom_unit_label: string | null;
  rate_per_unit: number;
  param_value: number;
  cost: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  component_name: string;
  customer_ref: string | null;
  material_id: string | null;
  material_name: string;
  material_density: number;
  material_rate_per_kg: number;
  raw_shape_id: string;
  raw_shape_name: string;
  raw_dimensions: Record<string, number>;
  raw_length: number;
  raw_cross_section_area: number;
  raw_weight: number;
  raw_material_cost: number;
  finished_shape_id: string;
  finished_shape_name: string;
  finished_dimensions: Record<string, number>;
  finished_length: number;
  finished_cross_section_area: number;
  finished_weight: number;
  plating_enabled: boolean;
  plating_rate_per_kg: number | null;
  plating_cost: number;
  packing_basis: CostBasis;
  packing_value: number;
  packing_cost: number;
  transport_basis: CostBasis;
  transport_value: number;
  transport_cost: number;
  total_labour_cost: number;
  margin_percent: number;
  running_total: number;
  final_rate: number;
  created_at: string;
  updated_at: string;
  operations: JobOperation[];
}

export interface JobPayload {
  component_name: string;
  customer_ref?: string | null;
  status: JobStatus;
  material_id?: string | null;
  material_name: string;
  material_density: number;
  material_rate_per_kg: number;
  raw_shape_id: string;
  raw_shape_name: string;
  raw_formula_key: string;
  raw_dimensions: Record<string, number>;
  raw_length: number;
  finished_shape_id: string;
  finished_shape_name: string;
  finished_formula_key: string;
  finished_dimensions: Record<string, number>;
  finished_length: number;
  operations: OperationLine[];
  plating_enabled: boolean;
  plating_rate_per_kg?: number | null;
  packing_basis: CostBasis;
  packing_value: number;
  transport_basis: CostBasis;
  transport_value: number;
  margin_percent: number;
  client_final_rate: number;
}
