const KNOWN_GREEK_PET_NAMES: Record<string, string> = {
  λεωνιδας: "Λεωνίδας",
  λεονιδας: "Λεωνίδας",
  μπεμπα: "Μπέμπα",
  μπεμπης: "Μπέμπης",
  πικος: "Πίκος",
  σαραμπι: "Σαραμπί",
  κυρκη: "Κύρκη",
  κλεομενης: "Κλεομένης",
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

function stripNamePrefix(value: string) {
  let cleaned = value
    .replace(/^[\s"'`.,;:!?()[\]{}<>]+|[\s"'`.,;:!?()[\]{}<>]+$/g, "")
    .trim();

  const phrasePatterns = [
    /^(?:τον|την|τη|το)\s+(?:λενε|λένε|λεγεται|λέγεται)\s+/iu,
    /^(?:ονοματαζεται|ονομάζεται|ονομαζεται)\s+/iu,
    /^(?:ο|η)\s+(?:σκυλος|σκύλος|γατα|γάτα|γατος|γάτος)\s+μου\s+(?:λενε|λένε|λεγεται|λέγεται)\s+/iu,
    /^(?:το\s+)?(?:ονομα|όνομα)(?:\s+(?:του|της))?\s+(?:ειναι|είναι)\s+/iu,
    /^(?:his|her|their|the|my\s+(?:dog|cat|pet)'?s)\s+name\s+is\s+/iu,
    /^(?:called|named)\s+/iu,
  ];

  for (const pattern of phrasePatterns) {
    cleaned = cleaned.replace(pattern, "").trim();
  }

  const inlineMarker = cleaned.match(
    /(?:τον|την|τη|το)\s+(?:λενε|λένε|λεγεται|λέγεται)\s+(.+)$/iu
  );
  if (inlineMarker?.[1]) cleaned = inlineMarker[1].trim();

  return cleaned
    .replace(/^[\s"'`.,;:!?()[\]{}<>]+|[\s"'`.,;:!?()[\]{}<>]+$/g, "")
    .trim();
}

export function formatPetDisplayName(input: unknown, fallback = "Pet") {
  const rawInput = String(input ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s"'`.,;:!?()[\]{}<>]+|[\s"'`.,;:!?()[\]{}<>]+$/g, "")
    .trim();
  const raw = stripNamePrefix(rawInput);
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
