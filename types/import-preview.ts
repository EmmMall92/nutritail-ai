import type { Food } from "@/types/food";

export interface ImportWarning {
  rowIndex: number;
  field: string;
  message: string;
  severity?: "warning" | "error";
}

export interface ImportRowScore {
  rowIndex: number;
  id: string | null;
  name: string | null;
  completenessScore: number;
  isValid: boolean;
}

export interface ImportPreviewResult {
  foods: Food[];
  warnings: ImportWarning[];
  rowScores: ImportRowScore[];
  validCount: number;
  invalidCount: number;
}
