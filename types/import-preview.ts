import type { Food } from "@/types/food";

export interface ImportWarning {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ImportPreviewResult {
  foods: Food[];
  warnings: ImportWarning[];
}