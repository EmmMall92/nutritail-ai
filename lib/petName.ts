const KNOWN_GREEK_PET_NAMES: Record<string, string> = {
  λεωνιδας: "Λεωνίδας",
  λεονιδας: "Λεωνίδας",
  μπεμπα: "Μπέμπα",
  μπεμπης: "Μπέμπης",
  πικος: "Πίκος",
  σαραμπι: "Σαράμπι",
};

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR")
    .trim();
}

function titleCaseToken(value: string) {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("el-GR") + value.slice(1);
}

export function formatPetDisplayName(input: unknown, fallback = "Pet") {
  const raw = String(input ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return fallback;

  const known = KNOWN_GREEK_PET_NAMES[normalizeLookup(raw)];
  if (known) return known;

  return raw
    .split(" ")
    .map((part) =>
      part
        .split("-")
        .map((token) => titleCaseToken(token.toLocaleLowerCase("el-GR")))
        .join("-")
    )
    .join(" ");
}
