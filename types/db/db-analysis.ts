export interface DbPetAnalysis {
  id: string;
  pet_id: string;
  rer: number;
  der: number;
  protein: string;
  fat: string;
  fiber: string;
  sodium: string;
  magnesium: string;
  calcium: string;
  phosphorus: string;
  advice: {
    title: string;
    description: string;
  }[];
  created_at: string;
}