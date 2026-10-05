import "dotenv/config";
import { prisma } from "../src/config/database.js";
import { auth } from "../src/config/auth.js";
import { env } from "../src/config/env.js";

/**
 * AgroMate Database Seed Script (Admin, Expert, Farmer + Starter Crops).
 */
async function main() {
  console.log("🌱 Starting AgroMate database seeding...\n");

  // -------------------------------------------------------------
  // 1. Starter Crops
  // -------------------------------------------------------------
  console.log("📦 Seeding starter crops...");
  const starterCrops = [
    {
      name: "Rice (Boro)",
      nameBn: "বোরো ধান",
      category: "Cereal",
      season: "Rabi / Winter",
      idealSoil: "Clay Loam",
      optimalTemp: 25.0,
      optimalRainfall: 150.0,
      durationDays: 140,
      description: "High-yielding irrigated winter rice variety popular across Bangladesh.",
      descriptionBn: "উচ্চ ফলনশীল সেচ নির্ভর শীতকালীন ধান।",
    },
    {
      name: "Wheat",
      nameBn: "গম",
      category: "Cereal",
      season: "Rabi / Winter",
      idealSoil: "Loamy / Sandy Loam",
      optimalTemp: 20.0,
      optimalRainfall: 50.0,
      durationDays: 110,
      description: "Major cereal crop grown during the dry winter season.",
      descriptionBn: "শীতকালীন প্রধান দানাদার ফসল।",
    },
    {
      name: "Potato",
      nameBn: "আলু",
      category: "Tuber",
      season: "Winter",
      idealSoil: "Sandy Loam",
      optimalTemp: 18.0,
      optimalRainfall: 40.0,
      durationDays: 90,
      description: "Fast-growing high-yield tuber crop sensitive to late blight.",
      descriptionBn: "শীতকালীন গুরুত্বপূর্ণ অর্থকরী ফসল।",
    },
    {
      name: "Tomato",
      nameBn: "টমেটো",
      category: "Vegetable",
      season: "Winter / Year-round",
      idealSoil: "Rich Loamy",
      optimalTemp: 22.0,
      optimalRainfall: 60.0,
      durationDays: 85,
      description: "Popular vegetable crop requiring balanced nitrogen and potassium.",
      descriptionBn: "জনপ্রিয় ও লাভজনক সবজি ফসল।",
    },
    {
      name: "Jute",
      nameBn: "পাট",
      category: "Fiber",
      season: "Kharif-1",
      idealSoil: "Alluvial / Silt Loam",
      optimalTemp: 30.0,
      optimalRainfall: 200.0,
      durationDays: 120,
      description: "Golden fiber crop thriving in warm and humid monsoon climate.",
      descriptionBn: "বাংলাদেশের সোনালী আঁশ।",
    },
    {
      name: "Mustard",
      nameBn: "সরিষা",
      category: "Oilseed",
      season: "Rabi / Winter",
      idealSoil: "Sandy Loam",
      optimalTemp: 19.0,
      optimalRainfall: 35.0,
      durationDays: 75,
      description: "Short-duration winter oilseed crop widely cultivated in crop rotation.",
      descriptionBn: "শীতকালীন প্রধান তেলজাতীয় ফসল।",
    },
  ];

  for (const crop of starterCrops) {
    await prisma.crop.upsert({
      where: { name: crop.name },
      update: crop,
      create: crop,
    });
  }
  console.log(`✅ Seeded ${starterCrops.length} starter crops.`);

  // -------------------------------------------------------------
  // 2. Admin User
  // -------------------------------------------------------------
  console.log("\n👑 Seeding Admin account...");
  let adminUser = await prisma.user.findUnique({ where: { email: env.SEED_ADMIN_EMAIL } });

  if (!adminUser) {
    await auth.api.signUpEmail({
      body: {
        name: "System Admin",
        email: env.SEED_ADMIN_EMAIL,
        password: env.SEED_ADMIN_PASSWORD,
      },
    });
  }

  adminUser = await prisma.user.update({
    where: { email: env.SEED_ADMIN_EMAIL },
    data: {
      role: "ADMIN",
      emailVerified: true,
      name: "System Admin",
      location: "Dhaka Central",
    },
  });
  console.log(`✅ Admin account ready: ${adminUser.email} (Role: ${adminUser.role})`);

  // -------------------------------------------------------------
  // 3. Expert User & Expert Profile
  // -------------------------------------------------------------
  console.log("\n👨‍🔬 Seeding Expert account...");
  let expertUser = await prisma.user.findUnique({ where: { email: env.SEED_EXPERT_EMAIL } });

  if (!expertUser) {
    await auth.api.signUpEmail({
      body: {
        name: "Dr. Rafiqul Islam",
        email: env.SEED_EXPERT_EMAIL,
        password: env.SEED_EXPERT_PASSWORD,
      },
    });
  }

  expertUser = await prisma.user.update({
    where: { email: env.SEED_EXPERT_EMAIL },
    data: {
      role: "EXPERT",
      emailVerified: true,
      name: "Dr. Rafiqul Islam",
      location: "Gazipur, Dhaka",
      phone: "+8801711223344",
    },
  });

  await prisma.expertProfile.upsert({
    where: { userId: expertUser.id },
    update: {
      specialization: "Crop Protection & Soil Fertility",
      organization: "Bangladesh Agricultural Research Institute (BARI)",
      experienceYears: 12,
      bio: "Senior Agricultural Specialist focusing on integrated pest management and soil health.",
      qualifications: "PhD in Agronomy, BARI Senior Consultant",
      status: "VERIFIED",
    },
    create: {
      userId: expertUser.id,
      specialization: "Crop Protection & Soil Fertility",
      organization: "Bangladesh Agricultural Research Institute (BARI)",
      experienceYears: 12,
      bio: "Senior Agricultural Specialist focusing on integrated pest management and soil health.",
      qualifications: "PhD in Agronomy, BARI Senior Consultant",
      status: "VERIFIED",
    },
  });
  console.log(`✅ Expert account ready: ${expertUser.email} (Role: ${expertUser.role}, Status: VERIFIED)`);

  // -------------------------------------------------------------
  // 4. Farmer User & Sample Farm
  // -------------------------------------------------------------
  console.log("\n🧑‍🌾 Seeding Farmer account...");
  let farmerUser = await prisma.user.findUnique({ where: { email: env.SEED_FARMER_EMAIL } });

  if (!farmerUser) {
    await auth.api.signUpEmail({
      body: {
        name: "Md. Rahim Farmer",
        email: env.SEED_FARMER_EMAIL,
        password: env.SEED_FARMER_PASSWORD,
      },
    });
  }

  farmerUser = await prisma.user.update({
    where: { email: env.SEED_FARMER_EMAIL },
    data: {
      role: "FARMER",
      emailVerified: true,
      name: "Md. Rahim Farmer",
      location: "Bogura, Rajshahi",
      phone: "+8801700112233",
    },
  });

  // Create starter farm & field for farmer if none exists
  const existingFarm = await prisma.farm.findFirst({ where: { userId: farmerUser.id } });
  if (!existingFarm) {
    const farm = await prisma.farm.create({
      data: {
        name: "Green Valley Farm",
        location: "Bogura Sadar",
        areaInAcres: 5.5,
        soilType: "Loam",
        userId: farmerUser.id,
      },
    });

    await prisma.field.create({
      data: {
        name: "North Field (Paddy)",
        areaInAcres: 3.0,
        soilType: "Clay Loam",
        farmId: farm.id,
      },
    });
    console.log(`  🌾 Created starter farm: "Green Valley Farm" & "North Field" for Rahim.`);
  }
  console.log(`✅ Farmer account ready: ${farmerUser.email} (Role: ${farmerUser.role})`);

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
