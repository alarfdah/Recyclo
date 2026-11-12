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
      "detergent bottle",
      "shampoo bottle",
      "laundry bottle",
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
      "pvc pipe",
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
      "plastic film",
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
      "margarine tub",
      "medicine bottle",
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
      "foam cup",
      "foam container",
      "foam takeout",
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

const CODE_ALIASES = new Set(["1", "2", "3", "4", "5", "6", "7"]);

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIASES = PLASTICS.flatMap((plastic) =>
  plastic.aliases.map((alias) => ({
    alias: normalize(alias),
    plastic,
  })),
).sort((a, b) => b.alias.length - a.alias.length);

export function getPlastic(code: number): Plastic | undefined {
  return PLASTICS.find((plastic) => plastic.code === code);
}

export function matchPlastic(input: string): Plastic | null {
  const text = normalize(input);
  if (!text) return null;

  if (CODE_ALIASES.has(text)) {
    return getPlastic(Number(text)) ?? null;
  }

  const padded = ` ${text} `;
  for (const entry of ALIASES) {
    if (padded.includes(` ${entry.alias} `)) return entry.plastic;
  }

  return null;
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
