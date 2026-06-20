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

  const safePhrasePatterns = [
    /^(?:\u03c4\u03bf\u03bd|\u03c4\u03b7\u03bd|\u03c4\u03b7|\u03c4\u03bf)\s+(?:\u03bb\u03b5\u03bd\u03b5|\u03bb\u03ad\u03bd\u03b5|\u03bb\u03b5\u03b3\u03b5\u03c4\u03b1\u03b9|\u03bb\u03ad\u03b3\u03b5\u03c4\u03b1\u03b9)\s+/iu,
    /^(?:\u03bf\u03bd\u03bf\u03bc\u03b1\u03c4\u03b1\u03b6\u03b5\u03c4\u03b1\u03b9|\u03bf\u03bd\u03bf\u03bc\u03ac\u03b6\u03b5\u03c4\u03b1\u03b9|\u03bb\u03b5\u03b3\u03b5\u03c4\u03b1\u03b9|\u03bb\u03ad\u03b3\u03b5\u03c4\u03b1\u03b9)\s+/iu,
    /^(?:\u03bf|\u03b7)\s+(?:\u03c3\u03ba\u03c5\u03bb\u03bf\u03c2|\u03c3\u03ba\u03cd\u03bb\u03bf\u03c2|\u03b3\u03b1\u03c4\u03b1|\u03b3\u03ac\u03c4\u03b1|\u03b3\u03b1\u03c4\u03bf\u03c2|\u03b3\u03ac\u03c4\u03bf\u03c2)\s+\u03bc\u03bf\u03c5\s+(?:\u03bb\u03b5\u03bd\u03b5|\u03bb\u03ad\u03bd\u03b5|\u03bb\u03b5\u03b3\u03b5\u03c4\u03b1\u03b9|\u03bb\u03ad\u03b3\u03b5\u03c4\u03b1\u03b9)\s+/iu,
    /^(?:my\s+)?(?:dog|cat|pet)\s+is\s+(?:called|named)\s+/iu,
  ];

  for (const pattern of safePhrasePatterns) {
    cleaned = cleaned.replace(pattern, "").trim();
  }

  const inlineMarker = cleaned.match(
    /(?:τον|την|τη|το)\s+(?:λενε|λένε|λεγεται|λέγεται)\s+(.+)$/iu
  );
  if (inlineMarker?.[1]) cleaned = inlineMarker[1].trim();

  cleaned = cleaned.replace(
    /^(?:\u03c4\u03bf\u03bd|\u03c4\u03b7\u03bd|\u03c4\u03b7|\u03c4\u03bf)\s+(?=\S{2,})/iu,
    ""
  );

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
