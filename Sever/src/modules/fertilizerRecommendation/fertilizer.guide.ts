// General fertilizer doses (kg per hectare, medium soil fertility, without a soil test) for the
// crops in the crop list, from Bangladesh government research recommendations. A range is
// [lowest, highest]. Each entry names its source so it can be checked and updated.

export type Dose = number | [number, number];

export const FERTILIZERS = ["urea", "tsp", "mop", "gypsum", "zinc", "boric"] as const;
export type Fertilizer = (typeof FERTILIZERS)[number];

export type CropGuide = {
  // Matches a crop whose English name starts with this
  cropPrefix: string;
  doses: Partial<Record<Fertilizer, Dose>>;
  // Compost / cow dung, tonnes per hectare
  organicTonsPerHa?: Dose;
  timing: { bn: string; en: string };
  source: { name: string; url: string };
};

// How much of each nutrient a fertilizer holds, for turning nutrient doses into fertilizer
export const NUTRIENT_SHARE = { urea: 0.46, tsp: 0.2, mop: 0.5, gypsum: 0.18, zinc: 0.36, boric: 0.17 } as const;

// Nutrient doses (kg/ha) → fertilizer (kg/ha), rounded
const fromNutrients = (n: { N: number; P: number; K: number; S?: number; Zn?: number; B?: number }) => ({
  urea: Math.round(n.N / NUTRIENT_SHARE.urea),
  tsp: Math.round(n.P / NUTRIENT_SHARE.tsp),
  mop: Math.round(n.K / NUTRIENT_SHARE.mop),
  ...(n.S && { gypsum: Math.round(n.S / NUTRIENT_SHARE.gypsum) }),
  ...(n.Zn && { zinc: Math.round(n.Zn / NUTRIENT_SHARE.zinc) }),
  ...(n.B && { boric: Math.round(n.B / NUTRIENT_SHARE.boric) }),
});

export const CROP_GUIDES: CropGuide[] = [
  {
    cropPrefix: "Rice",
    doses: { urea: 300, tsp: 112, mop: 127, gypsum: 75, zinc: 11 },
    timing: {
      bn: "ইউরিয়া তিন সমান ভাগে: রোপণের ১৫, ৩০ ও ৪৫ দিন পর। বাকি সব সার শেষ চাষের সময় মাটিতে মিশিয়ে দিন।",
      en: "Urea in three equal parts at 15, 30 and 45 days after transplanting. All other fertilizer at final land preparation.",
    },
    source: {
      name: "BARC Fertilizer Recommendation Guide dose for Boro rice (Rabbani et al., J. Sher-e-Bangla Agric. Univ., 2017)",
      url: "https://jsau.sau.ac.bd/wp-content/uploads/2019/06/13-Asia-Rabbani.pdf",
    },
  },
  {
    cropPrefix: "Wheat",
    doses: { urea: [225, 265], tsp: [135, 150], mop: [100, 110], gypsum: [110, 125], zinc: 12.5, boric: 6.5 },
    organicTonsPerHa: [7.5, 10],
    timing: {
      bn: "ইউরিয়ার প্রায় দুই-তৃতীয়াংশ ও বাকি সব সার শেষ চাষে। বাকি ইউরিয়া চারার তিন পাতা হলে প্রথম সেচের সাথে।",
      en: "About two-thirds of the urea and all other fertilizer at final land preparation; the rest of the urea at the three-leaf stage with the first irrigation.",
    },
    source: { name: "BAMIS, Package & Practices of Cultivation: Wheat (DAE / BARI)", url: "https://www.bamis.gov.bd/en/croppnp/1/all/9/" },
  },
  {
    cropPrefix: "Maize",
    doses: { urea: [172, 312], tsp: [168, 216], mop: [96, 144], gypsum: [144, 168], zinc: [10, 15], boric: [5, 7] },
    organicTonsPerHa: [4, 6],
    timing: {
      bn: "ইউরিয়ার এক-তৃতীয়াংশ ও বাকি সব সার শেষ চাষে। বাকি ইউরিয়া দুই ভাগে: গজানোর ২৫–৩০ ও ৪০–৫০ দিন পর।",
      en: "One-third of the urea and all other fertilizer at land preparation; the rest of the urea in two top dressings at 25-30 and 40-50 days after germination.",
    },
    source: { name: "BAMIS, Package & Practices of Cultivation: Maize, Rabi season (DAE / BARI)", url: "https://www.bamis.gov.bd/en/croppnp/1/all/8/" },
  },
  {
    cropPrefix: "Potato",
    // NPKSZnB 198-44-194-24-6-1.2 kg/ha
    doses: fromNutrients({ N: 198, P: 44, K: 194, S: 24, Zn: 6, B: 1.2 }),
    timing: {
      bn: "ইউরিয়ার অর্ধেক ও বাকি সব সার রোপণের সময়। বাকি অর্ধেক ইউরিয়া রোপণের ৩০–৩৫ দিন পর মাটি তুলে দেওয়ার সময়।",
      en: "Half the urea and all other fertilizer at planting; the other half of the urea 30-35 days after planting, when earthing up.",
    },
    source: { name: "BARI recommended dose for potato, NPKSZnB 198-44-194-24-6-1.2 kg/ha (Bangladesh Agronomy Journal)", url: "https://banglajol.info/index.php/BAJ/article/view/44938/32871" },
  },
  {
    cropPrefix: "Mustard",
    // N120 P35 K65 S20 Zn5 B1.5 kg/ha
    doses: fromNutrients({ N: 120, P: 35, K: 65, S: 20, Zn: 5, B: 1.5 }),
    organicTonsPerHa: 5,
    timing: {
      bn: "ইউরিয়ার অর্ধেক ও বাকি সব সার শেষ চাষে। বাকি অর্ধেক ইউরিয়া ফুল আসার আগে (বোনার ২০–২৫ দিন পর)।",
      en: "Half the urea and all other fertilizer at final land preparation; the other half before flowering (20-25 days after sowing).",
    },
    source: { name: "Recommended blanket dose for mustard, N120 P35 K65 S20 Zn5 + B1.5 kg/ha (Journal of Agronomy, 2007)", url: "https://scialert.net/fulltext/?doi=ja.2007.171.174" },
  },
  {
    cropPrefix: "Tomato",
    // BAMIS gives it per decimal: urea 1.2 kg, TSP 810 g, MoP 970 g, compost 40 kg (1 ha = 247.1 decimals)
    doses: { urea: 297, tsp: 200, mop: 240 },
    organicTonsPerHa: 10,
    timing: {
      bn: "সব গোবর, সব টিএসপি ও এক-তৃতীয়াংশ পটাশ শেষ চাষে। ইউরিয়া তিন সমান ভাগে চারা রোপণের ১০, ২৫ ও ৪০ দিন পর; বাকি পটাশ দ্বিতীয় ও তৃতীয় কিস্তির সাথে।",
      en: "All the compost, all the TSP and a third of the potash at final land preparation. Urea in three equal parts at 10, 25 and 40 days after transplanting; the rest of the potash with the second and third parts.",
    },
    source: { name: "BAMIS, Tomato cultivation at a glance (DAE / BARI)", url: "https://www.bamis.gov.bd/en/crops/view/13/" },
  },
];

export const guideFor = (cropName: string) =>
  CROP_GUIDES.find((guide) => cropName.toLowerCase().startsWith(guide.cropPrefix.toLowerCase())) ?? null;
