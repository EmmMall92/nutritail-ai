import type { Advice } from "@/ai/nutritionAdvice";

type Props = {
  advice: Advice[];
};

export default function NutritionAdvice({ advice }: Props) {
  const finalAdvice =
    advice.length > 0
      ? advice
      : [
          {
            title: "Balanced Nutrition",
            description:
              "Your pet appears healthy. Maintain a balanced diet with high quality ingredients.",
          },
        ];

  return (
    <div className="space-y-4">
      {finalAdvice.map((item, index) => (
        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-semibold text-black">{item.title}</p>
          <p className="text-sm text-black">{item.description}</p>
        </div>
      ))}
    </div>
  );
}