import "dotenv/config";
import { prisma } from "../src/config/database.js";
import { auth } from "../src/config/auth.js";
import { env } from "../src/config/env.js";
import { readCropPlansJson } from "../src/modules/cropPlan/cropPlan.engine.js";

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
      sowingStartMonth: 11,
      sowingEndMonth: 12,
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
      sowingStartMonth: 11,
      sowingEndMonth: 12,
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
      sowingStartMonth: 11,
      sowingEndMonth: 12,
      idealSoil: "Sandy Loam",
      optimalTemp: 18.0,
      optimalRainfall: 40.0,
      durationDays: 90,
      description: "Fast-growing high-yield tuber crop sensitive to late blight.",
      descriptionBn: "শীতকালীন গুরুত্বপূর্ণ অর্থকরী ফসল।",
    },
    {
      name: "Maize",
      nameBn: "ভুট্টা",
      category: "Cereal",
      season: "Kharif-2 / Summer",
      idealSoil: "Sandy Loam",
      optimalTemp: 27.0,
      optimalRainfall: 80.0,
      durationDays: 120,
      description: "Summer cereal grown for grain and fodder, sensitive to fall armyworm.",
      descriptionBn: "দানার জন্য চাষকৃত গ্রীষ্মকালীন ফসল।",
    },
    {
      name: "Tomato",
      nameBn: "টমেটো",
      category: "Vegetable",
      sowingStartMonth: 10,
      sowingEndMonth: 11,
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
      sowingStartMonth: 3,
      sowingEndMonth: 5,
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
      sowingStartMonth: 10,
      sowingEndMonth: 11,
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
  // 2. Crop-plan templates (milestones + tasks) from demo dataset
  // -------------------------------------------------------------
  console.log("\n🌾 Seeding crop-plan templates from src/data/crop-plans.json...");
  const planTemplates = readCropPlansJson();
  let plantedCrops = 0;

  for (const [planKey, plan] of Object.entries(planTemplates)) {
    const crop = await prisma.crop.findFirst({
      where: { name: { contains: planKey, mode: "insensitive" } },
    });
    if (!crop) {
      console.log(`  ⏭️  No crop row matches plan "${planKey}" — skipped.`);
      continue;
    }

    await prisma.crop.update({
      where: { id: crop.id },
      data: {
        planDurationDays: plan.durationDays,
        planDurationLabel: plan.durationLabel ?? null,
      },
    });

    // Rebuild the crop's template rows (templates are not referenced by
    // anything, so delete + recreate is safe and idempotent for a seed).
    await prisma.cropTaskTemplate.deleteMany({ where: { milestone: { cropId: crop.id } } });
    await prisma.cropMilestoneTemplate.deleteMany({ where: { cropId: crop.id } });

    for (const [mi, milestone] of plan.milestones.entries()) {
      await prisma.cropMilestoneTemplate.create({
        data: {
          cropId: crop.id,
          name: milestone.name,
          nameBn: milestone.nameBn,
          dayStart: milestone.dayStart,
          dayEnd: milestone.dayEnd,
          sortOrder: mi,
          tasks: {
            create: milestone.tasks.map((task, ti) => ({
              title: task.title,
              titleBn: task.titleBn,
              description: task.description,
              suggestedDay: task.suggestedDay,
              sortOrder: ti,
            })),
          },
        },
      });
    }
    plantedCrops++;
    console.log(`  ✅ "${crop.name}": ${plan.milestones.length} milestones seeded.`);
  }
  console.log(`✅ Crop-plan templates seeded for ${plantedCrops} crops.`);

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
      phone: "+8801799887766",
      phoneNumber: "+8801799887766",
      phoneNumberVerified: true,
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
      phoneNumber: "+8801711223344",
      phoneNumberVerified: true,
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
      phoneNumber: "+8801700112233",
      phoneNumberVerified: true,
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
