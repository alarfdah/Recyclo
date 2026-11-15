export type PlasticCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Plastic = {
  code: PlasticCode;
  name: string;
  fullName: string;
  uses: string[];
  recycle: string;
  aliases: string[];
};

export const PLASTICS: Plastic[] = [
  {
    code: 1,
    name: "PET",
    fullName: "Polyethylene terephthalate",
    uses: [
      "Clear drink bottles and many food jars are made of this.",
      "A sound bottle can be refilled with cold water or used for dry storage.",
      "Worn bottles are better recycled than kept for food.",
    ],
    recycle:
      "Empty it, give it a quick rinse, and put the bottle in curbside recycling if your program takes plastic bottles. Caps can usually stay on. This is one of the most widely accepted plastics.",
    aliases: [
      "pet",
      "pete",
      "polyethylene terephthalate",
      "water bottle",
      "soda bottle",
      "pop bottle",
      "soft drink bottle",
      "drink bottle",
      "clear bottle",
      "clear drink bottle",
      "beverage bottle",
      "number 1",
      "no 1",
      "code 1",
      "resin 1",
    ],
  },
  {
    code: 2,
    name: "HDPE",
    fullName: "High-density polyethylene",
    uses: [
      "Milk jugs, detergent bottles, and shampoo bottles are usually this.",
      "A clean jug can become a scoop, a watering can, or storage for non-food items.",
    ],
    recycle:
      "Empty and rinse it. Bottles and jugs made of this are widely accepted in curbside recycling. Leave the cap on if your local program says to.",
    aliases: [
      "hdpe",
      "high density polyethylene",
      "high-density polyethylene",
      "milk jug",
      "milk bottle",
      "detergent bottle",
      "detergent",
      "shampoo bottle",
      "shampoo",
      "laundry bottle",
      "laundry detergent",
      "bleach bottle",
      "number 2",
      "no 2",
      "code 2",
      "resin 2",
    ],
  },
  {
    code: 3,
    name: "PVC",
    fullName: "Polyvinyl chloride",
    uses: [
      "Pipes, some blister packs, and some clear packaging use this.",
      "Reuse is limited. Do not burn it, and do not use it to store food or drink.",
    ],
    recycle:
      "Most curbside programs do not take this. Small packaging usually has to go in the trash. Pipes and building materials need a specialty recycler, not the household bin.",
    aliases: [
      "pvc",
      "polyvinyl chloride",
      "vinyl plastic",
      "vinyl",
      "pvc pipe",
      "blister pack",
      "number 3",
      "no 3",
      "code 3",
      "resin 3",
    ],
  },
  {
    code: 4,
    name: "LDPE",
    fullName: "Low-density polyethylene",
    uses: [
      "Shopping bags, bread bags, and some squeezable bottles are this.",
      "A clean bag can be reused for shopping, storage, or lining a small bin.",
    ],
    recycle:
      "Do not put loose bags in curbside recycling; they jam the sorting machines. Many grocery stores collect clean, dry plastic bags and film at a front-of-store drop-off.",
    aliases: [
      "ldpe",
      "low density polyethylene",
      "low-density polyethylene",
      "plastic bag",
      "shopping bag",
      "grocery bag",
      "bread bag",
      "produce bag",
      "plastic film",
      "cling wrap",
      "squeezable bottle",
      "number 4",
      "no 4",
      "code 4",
      "resin 4",
    ],
  },
  {
    code: 5,
    name: "PP",
    fullName: "Polypropylene",
    uses: [
      "Yogurt cups, margarine tubs, medicine bottles, and many bottle caps are this.",
      "A clean tub can be reused for leftovers or small-parts storage.",
    ],
    recycle:
      "Empty and rinse it. Many curbside programs now take rigid containers marked 5, including tubs and bottle caps. If yours does not, the trash is the honest option.",
    aliases: [
      "pp",
      "polypropylene",
      "yogurt cup",
      "yoghurt cup",
      "yogurt pot",
      "yoghurt pot",
      "yogurt",
      "yoghurt",
      "margarine tub",
      "butter tub",
      "medicine bottle",
      "pill bottle",
      "bottle cap",
      "number 5",
      "no 5",
      "code 5",
      "resin 5",
    ],
  },
  {
    code: 6,
    name: "PS",
    fullName: "Polystyrene",
    uses: [
      "Foam cups, foam takeout boxes, and many disposable plates are this.",
      "Reuse is a poor fit: it cracks, holds food residue, and is hard to clean.",
    ],
    recycle:
      "Most curbside bins do not take foam or rigid polystyrene. A few drop-off or mail-back programs do. If you do not have one nearby, it goes in the trash.",
    aliases: [
      "ps",
      "polystyrene",
      "styrofoam",
      "styro foam",
      "foam cup",
      "foam container",
      "foam takeout",
      "foam box",
      "foam plate",
      "disposable foam",
      "number 6",
      "no 6",
      "code 6",
      "resin 6",
    ],
  },
  {
    code: 7,
    name: "Other",
    fullName: "Other or mixed plastics",
    uses: [
      "This mark covers mixed layers and plastics that are not codes 1–6, such as some polycarbonate and bioplastics.",
      "Reuse depends on the object. A sturdy container can be kept; a mixed pouch usually cannot.",
    ],
    recycle:
      "Standard recycling often refuses this because the mix varies. Look for a brand take-back if the package names one. Otherwise it usually belongs in the trash.",
    aliases: [
      "other plastic",
      "mixed plastic",
      "polycarbonate",
      "bioplastic",
      "compostable plastic",
      "number 7",
      "no 7",
      "code 7",
      "resin 7",
    ],
  },
];

/** Short phrases that alone are too vague to assign a single resin code. */
const AMBIGUOUS_HINTS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /^(plastic )?bottles?$/,
    message:
      "Which kind of bottle? Try “water bottle” or “soda bottle” (usually 1), or “milk jug” / “detergent bottle” (usually 2).",
  },
  {
    pattern: /^(plastic )?cups?$/,
    message:
      "Which kind of cup? Try “yogurt cup” (usually 5) or “foam cup” / “styrofoam” (usually 6).",
  },
  {
    pattern: /^(plastic )?bags?$/,
    message:
      "If it’s a shopping or grocery bag, say “grocery bag” or “plastic bag” (usually 4). Store drop-off is typical for film.",
  },
  {
    pattern: /^(plastic )?jugs?$/,
    message: "Try a more specific jug, such as “milk jug” (usually 2).",
  },
  {
    pattern: /^(plastic )?containers?$/,
    message:
      "Name the item more specifically (for example yogurt cup, takeout foam, or the number in the recycling mark).",
  },
  {
    pattern: /^(plastic|plastics)$/,
    message:
      "Describe the item (yogurt cup, water bottle, grocery bag) or enter the number inside the recycling mark (1–7).",
  },
];

const CODE_IN_TEXT =
  /(?:^|\s)(?:#|no\.?|number|code|resin)\s*([1-7])(?:\s|$)/i;
const BARE_CODE = /^([1-7])$/;

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Light plural stemming so “water bottles” still hits “water bottle”. */
function singularizeToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("sses") || token.endsWith("shes") || token.endsWith("ches")) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function normalizeForMatch(input: string): string {
  return normalize(input)
    .split(" ")
    .filter(Boolean)
    .map(singularizeToken)
    .join(" ");
}

const ALIASES = PLASTICS.flatMap((plastic) =>
  plastic.aliases.map((alias) => ({
    alias: normalizeForMatch(alias),
    plastic,
  })),
).sort((a, b) => b.alias.length - a.alias.length);

export function getPlastic(code: number): Plastic | undefined {
  return PLASTICS.find((plastic) => plastic.code === code);
}

export type DescriptionMatch =
  | { status: "matched"; plastic: Plastic }
  | { status: "ambiguous"; message: string }
  | { status: "unmatched"; message: string };

const UNMATCHED_MESSAGE =
  "Could not match that to a plastic type. Try a common item name (water bottle, milk jug, yogurt cup, grocery bag, styrofoam) or the number in the recycling mark (1–7).";

/**
 * Match a user description to a resin code using the built-in guide.
 * Prefers explicit codes, then longest alias hits, then known-ambiguous prompts.
 */
export function matchDescription(input: string): DescriptionMatch {
  const raw = normalize(input);
  if (!raw) {
    return {
      status: "unmatched",
      message: "Enter a short description of the item (for example water bottle or yogurt cup).",
    };
  }

  const text = normalizeForMatch(input);

  const bare = text.match(BARE_CODE);
  if (bare) {
    const plastic = getPlastic(Number(bare[1]));
    if (plastic) return { status: "matched", plastic };
  }

  const coded = ` ${raw} `.match(CODE_IN_TEXT) ?? ` ${text} `.match(CODE_IN_TEXT);
  if (coded) {
    const plastic = getPlastic(Number(coded[1]));
    if (plastic) return { status: "matched", plastic };
  }

  const padded = ` ${text} `;
  for (const entry of ALIASES) {
    if (padded.includes(` ${entry.alias} `)) {
      return { status: "matched", plastic: entry.plastic };
    }
  }

  for (const hint of AMBIGUOUS_HINTS) {
    if (hint.pattern.test(text)) {
      return { status: "ambiguous", message: hint.message };
    }
  }

  return { status: "unmatched", message: UNMATCHED_MESSAGE };
}

/** @deprecated Prefer matchDescription; kept for simple exact/alias lookups. */
export function matchPlastic(input: string): Plastic | null {
  const result = matchDescription(input);
  return result.status === "matched" ? result.plastic : null;
}

export type PublicPlastic = Omit<Plastic, "aliases">;

export function toPublicPlastic(plastic: Plastic): PublicPlastic {
  return {
    code: plastic.code,
    name: plastic.name,
    fullName: plastic.fullName,
    uses: plastic.uses,
    recycle: plastic.recycle,
  };
}
