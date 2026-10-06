import { prisma } from "../src/config/database.js";

const expertCategories = [
  { slug: "rice", nameBn: "ধান", nameEn: "Rice" },
  { slug: "field-crops", nameBn: "মাঠ ফসল (গম, ভুট্টা, পাট)", nameEn: "Field Crops" },
  { slug: "vegetables", nameBn: "সবজি", nameEn: "Vegetables" },
  { slug: "fruits", nameBn: "ফল", nameEn: "Fruits" },
  { slug: "pest-disease", nameBn: "রোগ ও পোকামাকড় দমন", nameEn: "Pest & Disease" },
  { slug: "soil-fertilizer", nameBn: "মাটি ও সার", nameEn: "Soil & Fertilizer" },
  { slug: "irrigation", nameBn: "সেচ ও পানি ব্যবস্থাপনা", nameEn: "Irrigation" },
  { slug: "seed-variety", nameBn: "বীজ ও জাত", nameEn: "Seed & Variety" },
  { slug: "livestock", nameBn: "গবাদিপশু", nameEn: "Livestock" },
  { slug: "poultry", nameBn: "হাঁস-মুরগি", nameEn: "Poultry" },
  { slug: "fisheries", nameBn: "মৎস্য চাষ", nameEn: "Fisheries" },
  { slug: "machinery", nameBn: "কৃষি যন্ত্রপাতি", nameEn: "Machinery" },
  { slug: "organic-farming", nameBn: "জৈব কৃষি", nameEn: "Organic Farming" },
  { slug: "market-business", nameBn: "বাজার ও কৃষি ব্যবসা", nameEn: "Market & Agribusiness" },
];

async function main() {
  console.log("Seeding expert categories...");

  for (const cat of expertCategories) {
    await prisma.expertCategory.upsert({
      where: { slug: cat.slug },
      update: {
        nameBn: cat.nameBn,
        nameEn: cat.nameEn,
      },
      create: {
        slug: cat.slug,
        nameBn: cat.nameBn,
        nameEn: cat.nameEn,
      },
    });
  }

  console.log("Successfully seeded 14 expert categories!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
