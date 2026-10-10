import "dotenv/config";
import { prisma } from "../src/config/database.js";
import { auth } from "../src/config/auth.js";
import { env } from "../src/config/env.js";

/**
 * Demo experts, so the farmer's expert directory and its category filter have people to show.
 * Run after seed-expert-categories.ts. Every demo expert logs in with SEED_EXPERT_PASSWORD.
 * Kept apart from seed.ts so it can run on a shared database without touching other accounts.
 */

type DemoExpert = {
  name: string;
  email: string;
  location: string;
  status: "VERIFIED" | "PENDING";
  categorySlugs: string[];
  specialization: string;
  organization: string;
  experienceYears: number;
  bio: string;
  qualifications: string;
};

const demoExperts: DemoExpert[] = [
  {
    name: "Dr. Nasrin Akter",
    email: "nasrin.expert@agromate.dev",
    location: "Gazipur, Dhaka",
    status: "VERIFIED",
    categorySlugs: ["rice", "seed-variety"],
    specialization: "Rice Breeding & Seed Selection",
    organization: "Bangladesh Rice Research Institute (BRRI)",
    experienceYears: 15,
    bio: "Helps farmers choose the right rice variety for each season and get the most out of Boro and Aman crops.",
    qualifications: "PhD in Plant Breeding, BRRI Principal Scientific Officer",
  },
  {
    name: "Md. Kamrul Hasan",
    email: "kamrul.expert@agromate.dev",
    location: "Jashore, Khulna",
    status: "VERIFIED",
    categorySlugs: ["vegetables", "fruits", "organic-farming"],
    specialization: "Vegetable & Fruit Horticulture",
    organization: "Department of Agricultural Extension (DAE)",
    experienceYears: 9,
    bio: "Works with vegetable and fruit growers on year-round production, safe pest control and organic methods.",
    qualifications: "MS in Horticulture, Upazila Agriculture Officer",
  },
  {
    name: "Dr. Sharmin Sultana",
    email: "sharmin.expert@agromate.dev",
    location: "Mymensingh",
    status: "VERIFIED",
    categorySlugs: ["fisheries"],
    specialization: "Pond Fish Culture & Aquaculture",
    organization: "Bangladesh Fisheries Research Institute (BFRI)",
    experienceYears: 11,
    bio: "Advises on pond preparation, feed, water quality and fish disease for small and mid-sized fish farms.",
    qualifications: "PhD in Aquaculture, BFRI Senior Scientific Officer",
  },
  {
    name: "Dr. Abdul Karim",
    email: "karim.expert@agromate.dev",
    location: "Sirajganj, Rajshahi",
    status: "VERIFIED",
    categorySlugs: ["livestock", "poultry"],
    specialization: "Livestock & Poultry Health",
    organization: "Department of Livestock Services (DLS)",
    experienceYears: 14,
    bio: "Veterinarian helping farmers with cattle, goat and poultry care, vaccination and feed planning.",
    qualifications: "DVM, MS in Animal Science, Upazila Livestock Officer",
  },
  {
    name: "Tanvir Ahmed",
    email: "tanvir.expert@agromate.dev",
    location: "Rajshahi",
    status: "VERIFIED",
    categorySlugs: ["irrigation", "machinery", "field-crops"],
    specialization: "Irrigation & Farm Machinery",
    organization: "Bangladesh Agricultural Development Corporation (BADC)",
    experienceYears: 7,
    bio: "Helps farmers plan irrigation, save water in dry seasons and pick affordable machines for wheat, maize and jute.",
    qualifications: "BSc in Agricultural Engineering, BADC Assistant Engineer",
  },
  {
    // Left pending so the admin dashboard has an application to review
    name: "Farhana Yasmin",
    email: "farhana.expert@agromate.dev",
    location: "Khulna",
    status: "PENDING",
    categorySlugs: ["market-business"],
    specialization: "Agri Marketing & Farm Business",
    organization: "Khulna Agricultural University",
    experienceYears: 5,
    bio: "Teaches farmers to price their crops, find buyers and keep simple farm accounts.",
    qualifications: "MBA in Agribusiness, Lecturer",
  },
];

// The main seeded expert (seed.ts) gets categories that match their specialization
const mainExpertCategorySlugs = ["pest-disease", "soil-fertilizer"];

async function categoryIdsFor(slugs: string[]) {
  const categories = await prisma.expertCategory.findMany({ where: { slug: { in: slugs } } });
  if (categories.length !== slugs.length) {
    throw new Error(`Missing expert categories (${slugs.join(", ")}). Run seed-expert-categories.ts first.`);
  }
  return categories.map((category) => ({ categoryId: category.id }));
}

async function seedExpert(expert: DemoExpert) {
  const existing = await prisma.user.findUnique({ where: { email: expert.email } });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { name: expert.name, email: expert.email, password: env.SEED_EXPERT_PASSWORD },
    });
  }

  const user = await prisma.user.update({
    where: { email: expert.email },
    data: { role: "EXPERT", emailVerified: true, name: expert.name, location: expert.location },
  });

  const categories = await categoryIdsFor(expert.categorySlugs);
  const profile = {
    specialization: expert.specialization,
    organization: expert.organization,
    experienceYears: expert.experienceYears,
    bio: expert.bio,
    qualifications: expert.qualifications,
    status: expert.status,
  };

  await prisma.expertProfile.upsert({
    where: { userId: user.id },
    update: { ...profile, categories: { deleteMany: {}, create: categories } },
    create: { ...profile, userId: user.id, categories: { create: categories } },
  });

  console.log(`  ✅ ${expert.name} (${expert.status}): ${expert.categorySlugs.join(", ")}`);
}

async function main() {
  console.log("👨‍🔬 Seeding demo experts...");

  for (const expert of demoExperts) {
    await seedExpert(expert);
  }

  // Only when seed.ts has created the main expert's profile
  const mainExpert = await prisma.user.findUnique({
    where: { email: env.SEED_EXPERT_EMAIL },
    select: { name: true, expertProfile: { select: { id: true } } },
  });
  if (mainExpert?.expertProfile) {
    await prisma.expertProfile.update({
      where: { id: mainExpert.expertProfile.id },
      data: { categories: { deleteMany: {}, create: await categoryIdsFor(mainExpertCategorySlugs) } },
    });
    console.log(`  ✅ ${mainExpert.name}: ${mainExpertCategorySlugs.join(", ")}`);
  }

  console.log(`\n🎉 Demo experts ready. Password for all: SEED_EXPERT_PASSWORD`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding demo experts failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
