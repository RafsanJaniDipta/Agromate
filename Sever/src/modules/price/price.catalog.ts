import type { PriceCategory } from "../../generated/prisma/client.js";

// The items the app tracks out of the box. Admins can add more (e.g. pesticides) from the panel.

export type CatalogItem = {
  slug: string;
  category: PriceCategory;
  nameBn: string;
  nameEn: string;
  unitBn: string;
  unitEn: string;
  // Links the item to a crop whose English name starts with this, so its growers see it first
  cropPrefix?: string;
  // How the item and its unit are written in TCB's daily sheet
  tcb?: { name: string; unit: string };
  // Government-fixed price per unit (fertilizer)
  governmentPrice?: number;
};

const KG = { unitBn: "কেজি", unitEn: "kg" };
const HALI = { unitBn: "হালি", unitEn: "4 pieces" };
const PER_KG = "প্রতি কেজি";
const PER_HALI = "প্রতি হালি";

// Farm produce from TCB's "ঢাকা মহানগরীর নিত্য প্রয়োজনীয় পণ্যের দৈনিক খুচরা বাজার দর"
const tcbItems: CatalogItem[] = [
  { slug: "rice-coarse", nameBn: "চাল (মোটা)", nameEn: "Rice, coarse", cropPrefix: "Rice", tcb: { name: "চাল (মোটা)/স্বর্ণা/চায়না ইরি", unit: PER_KG } },
  { slug: "rice-medium", nameBn: "চাল (মাঝারি)", nameEn: "Rice, medium", cropPrefix: "Rice", tcb: { name: "চাল (মাঝারী)পাইজাম/আটাশ", unit: PER_KG } },
  { slug: "rice-fine", nameBn: "চাল (সরু)", nameEn: "Rice, fine", cropPrefix: "Rice", tcb: { name: "চাল সরু (নাজির/মিনিকেট)", unit: PER_KG } },
  { slug: "rice-aromatic", nameBn: "চাল (সুগন্ধি)", nameEn: "Rice, aromatic", cropPrefix: "Rice", tcb: { name: "চাল সুগন্ধী (পোলাও)", unit: PER_KG } },
  { slug: "wheat-flour", nameBn: "আটা (খোলা)", nameEn: "Wheat flour, loose", cropPrefix: "Wheat", tcb: { name: "আটা সাদা (খোলা)", unit: PER_KG } },
  { slug: "potato", nameBn: "আলু", nameEn: "Potato", cropPrefix: "Potato", tcb: { name: "আলু (নতুন/পুরাতন)", unit: PER_KG } },
  { slug: "onion", nameBn: "পেঁয়াজ (দেশি)", nameEn: "Onion, local", cropPrefix: "Onion", tcb: { name: "পিঁয়াজ (দেশী)", unit: PER_KG } },
  { slug: "garlic", nameBn: "রসুন (দেশি)", nameEn: "Garlic, local", cropPrefix: "Garlic", tcb: { name: "রসুন (দেশী)", unit: PER_KG } },
  { slug: "ginger", nameBn: "আদা (দেশি)", nameEn: "Ginger, local", cropPrefix: "Ginger", tcb: { name: "আদা (দেশী)", unit: PER_KG } },
  { slug: "turmeric", nameBn: "হলুদ (দেশি)", nameEn: "Turmeric, local", cropPrefix: "Turmeric", tcb: { name: "হলুদ (দেশী)", unit: PER_KG } },
  { slug: "dry-chili", nameBn: "শুকনা মরিচ (দেশি)", nameEn: "Dry chili, local", cropPrefix: "Chili", tcb: { name: "শুকনা মরিচ (দেশী)", unit: PER_KG } },
  { slug: "green-chili", nameBn: "কাঁচা মরিচ", nameEn: "Green chili", cropPrefix: "Chili", tcb: { name: "কাঁচামরিচ", unit: PER_KG } },
  { slug: "brinjal", nameBn: "বেগুন", nameEn: "Brinjal", cropPrefix: "Brinjal", tcb: { name: "বেগুন", unit: PER_KG } },
  { slug: "cucumber", nameBn: "শসা", nameEn: "Cucumber", cropPrefix: "Cucumber", tcb: { name: "শসা", unit: PER_KG } },
  { slug: "lemon", nameBn: "লেবু", nameEn: "Lemon", ...HALI, cropPrefix: "Lemon", tcb: { name: "লেবু", unit: PER_HALI } },
  { slug: "coriander-seed", nameBn: "ধনে", nameEn: "Coriander seed", cropPrefix: "Coriander", tcb: { name: "ধনে", unit: PER_KG } },
  { slug: "lentil-coarse", nameBn: "মসুর ডাল (বড় দানা)", nameEn: "Lentil, bold", cropPrefix: "Lentil", tcb: { name: "মশুর ডাল (বড় দানা)", unit: PER_KG } },
  { slug: "lentil-fine", nameBn: "মসুর ডাল (ছোট দানা)", nameEn: "Lentil, small", cropPrefix: "Lentil", tcb: { name: "মশুর ডাল (ছোট দানা)", unit: PER_KG } },
  { slug: "mung", nameBn: "মুগ ডাল", nameEn: "Mung bean", cropPrefix: "Mung", tcb: { name: "মুগ ডাল (মানভেদে)", unit: PER_KG } },
  { slug: "chickpea", nameBn: "ছোলা", nameEn: "Chickpea", cropPrefix: "Chickpea", tcb: { name: "ছোলা (মানভেদে)", unit: PER_KG } },
  { slug: "egg-farm", nameBn: "ডিম (ফার্ম)", nameEn: "Eggs, farm", ...HALI, tcb: { name: "ডিম (ফার্ম)", unit: PER_HALI } },
  { slug: "broiler", nameBn: "মুরগি (ব্রয়লার)", nameEn: "Chicken, broiler", tcb: { name: "মুরগী(ব্রয়লার)", unit: PER_KG } },
  { slug: "deshi-chicken", nameBn: "মুরগি (দেশি)", nameEn: "Chicken, local", tcb: { name: "মুরগী (দেশী)", unit: PER_KG } },
  { slug: "rohu", nameBn: "রুই মাছ", nameEn: "Rohu fish", tcb: { name: "রুই", unit: PER_KG } },
  { slug: "hilsa", nameBn: "ইলিশ মাছ", nameEn: "Hilsa fish", tcb: { name: "ইলিশ", unit: PER_KG } },
  { slug: "beef", nameBn: "গরুর মাংস", nameEn: "Beef", tcb: { name: "গরু", unit: PER_KG } },
  { slug: "mutton", nameBn: "খাসির মাংস", nameEn: "Mutton", tcb: { name: "খাসী", unit: PER_KG } },
].map((item) => ({ ...KG, ...item, category: "CROP" as const }));

// Farmer-level prices fixed by the Ministry of Agriculture (Tk per kg)
const fertilizerItems: CatalogItem[] = [
  { slug: "urea", nameBn: "ইউরিয়া", nameEn: "Urea", governmentPrice: 27 },
  { slug: "tsp", nameBn: "টিএসপি", nameEn: "TSP", governmentPrice: 27 },
  { slug: "dap", nameBn: "ডিএপি", nameEn: "DAP", governmentPrice: 21 },
  { slug: "mop", nameBn: "এমওপি", nameEn: "MoP", governmentPrice: 20 },
].map((item) => ({ ...KG, ...item, category: "FERTILIZER" as const }));

export const CATALOG: CatalogItem[] = [...tcbItems, ...fertilizerItems];

// Shown on the home page banner
export const HIGHLIGHT_SLUGS = {
  CROP: ["rice-coarse", "potato", "onion"],
  FERTILIZER: ["urea", "tsp", "mop"],
} as const;
