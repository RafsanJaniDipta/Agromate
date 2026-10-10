import "dotenv/config";
import path from "node:path";
import { prisma } from "../src/config/database.js";
import { auth } from "../src/config/auth.js";
import { cloudinary } from "../src/config/cloudinary.js";
import { env } from "../src/config/env.js";

/**
 * Demo success stories for the home page, so "Success stories" has farmers to show before
 * real ones are approved. Each story gets its own demo farmer account and a photo on Cloudinary.
 * Safe to run again: accounts, photos and stories are updated in place.
 * Every demo farmer logs in with SEED_FARMER_PASSWORD.
 */

// Same folder the app's own story uploads use (see successStory.service.ts)
const STORY_PHOTO_FOLDER = "agromate/stories";
// The photos ship with the client
const PHOTO_DIR = path.resolve(import.meta.dirname, "../../client/public/images/farmers");

type DemoStory = {
  // Names the account and the photo, so a second run finds them again
  slug: string;
  photo: string;
  // Where the face is, so round crops keep it in view
  imageFocus: string;
  nameBn: string;
  nameEn: string;
  roleBn: string;
  roleEn: string;
  locationBn: string;
  locationEn: string;
  quoteBn: string;
  quoteEn: string;
  yieldChangePercent: number;
  costChangePercent: number;
  incomeChangePercent: number;
};

const demoStories: DemoStory[] = [
  {
    slug: "shafiqul",
    photo: "farmer-spreading-fertilizer.jpg",
    imageFocus: "52% 25%",
    nameBn: "শফিকুল ইসলাম",
    nameEn: "Shafiqul Islam",
    roleBn: "সবজিচাষি",
    roleEn: "Vegetable farmer",
    locationBn: "রংপুর",
    locationEn: "Rangpur",
    quoteBn:
      "Agromate-এর সার পরামর্শে বুঝলাম আমার মাটির আসলে কী দরকার। ইউরিয়া কম দিয়েও দশ বছরের মধ্যে সেরা ফলন পেয়েছি।",
    quoteEn:
      "Fertilizer advice from Agromate showed me exactly what my soil needed. I used less urea and still got my best harvest in ten years.",
    yieldChangePercent: 42,
    costChangePercent: -30,
    incomeChangePercent: 55,
  },
  {
    slug: "karim",
    photo: "farmer-carrying-paddy.jpg",
    imageFocus: "48% 30%",
    nameBn: "আব্দুল করিম",
    nameEn: "Abdul Karim",
    roleBn: "আমন ধানচাষি",
    roleEn: "Aman rice farmer",
    locationBn: "দিনাজপুর",
    locationEn: "Dinajpur",
    quoteBn: "ঝড়ের দুই দিন আগেই আবহাওয়ার সতর্কবার্তা পেয়েছিলাম। আগেভাগে ধান কেটে পুরো ফসলই বাঁচাতে পেরেছি।",
    quoteEn: "The weather alert reached me two days before the storm. I cut my paddy early and saved the whole crop.",
    yieldChangePercent: 35,
    costChangePercent: -20,
    incomeChangePercent: 40,
  },
  {
    slug: "nurul",
    photo: "farmer-jute-harvest.jpg",
    imageFocus: "60% 28%",
    nameBn: "নুরুল হক",
    nameEn: "Nurul Haque",
    roleBn: "পাটচাষি",
    roleEn: "Jute farmer",
    locationBn: "ফরিদপুর",
    locationEn: "Faridpur",
    quoteBn:
      "রোগা গাছের ছবি তুললেই কয়েক মিনিটে সমাধান পাই। বাজারদর দেখে ঠিক সময়ে পাট বিক্রি করে ভালো দাম পেয়েছি।",
    quoteEn:
      "I photograph a sick plant and get an answer in minutes. Live market prices showed me the best time to sell my jute.",
    yieldChangePercent: 28,
    costChangePercent: -25,
    incomeChangePercent: 60,
  },
  {
    slug: "jamal",
    photo: "farmer-rice-field-portrait.jpg",
    imageFocus: "57% 28%",
    nameBn: "জামাল উদ্দিন",
    nameEn: "Jamal Uddin",
    roleBn: "বোরো ধানচাষি",
    roleEn: "Boro rice farmer",
    locationBn: "ময়মনসিংহ",
    locationEn: "Mymensingh",
    quoteBn:
      "বিশেষজ্ঞের সাথে একবার কথা বলেই ধানে সেচ দেওয়ার নিয়ম বদলে ফেলেছি। এখন পানি কম লাগে, আয়ও দ্বিগুণ হয়েছে।",
    quoteEn: "One talk with an expert changed how I water my paddy. I use less water now, and my income has doubled.",
    yieldChangePercent: 50,
    costChangePercent: -18,
    incomeChangePercent: 100,
  },
  {
    slug: "mongsa",
    photo: "farmer-portrait.jpg",
    imageFocus: "47% 38%",
    nameBn: "মংসা মারমা",
    nameEn: "Mongsa Marma",
    roleBn: "ফলচাষি",
    roleEn: "Fruit farmer",
    locationBn: "বান্দরবান",
    locationEn: "Bandarban",
    quoteBn:
      "আম গাছের পাতার ছবি বিশেষজ্ঞকে পাঠিয়ে সেদিনই রোগের সমাধান পেয়েছি। এখন বাগানের খরচ আর আয়ের হিসাবও Agromate-এ রাখি।",
    quoteEn:
      "I sent an expert photos of my mango leaves and had the cure the same day. Now I keep my orchard's costs and income in Agromate too.",
    yieldChangePercent: 33,
    costChangePercent: -22,
    incomeChangePercent: 48,
  },
];

// The limits of the success_story columns; checked here so a long text fails with a clear message
const MAX_LENGTH = { name: 40, role: 30, location: 30, quote: 200 };

function assertFits(story: DemoStory) {
  const checks: [string, string, number][] = [
    ["nameBn", story.nameBn, MAX_LENGTH.name],
    ["nameEn", story.nameEn, MAX_LENGTH.name],
    ["roleBn", story.roleBn, MAX_LENGTH.role],
    ["roleEn", story.roleEn, MAX_LENGTH.role],
    ["locationBn", story.locationBn, MAX_LENGTH.location],
    ["locationEn", story.locationEn, MAX_LENGTH.location],
    ["quoteBn", story.quoteBn, MAX_LENGTH.quote],
    ["quoteEn", story.quoteEn, MAX_LENGTH.quote],
  ];
  for (const [field, text, max] of checks) {
    if (text.length > max) throw new Error(`${story.slug}.${field} is ${text.length} characters (max ${max})`);
  }
}

async function demoFarmerId(story: DemoStory) {
  const email = `${story.slug}.farmer@agromate.dev`;
  if (!(await prisma.user.findUnique({ where: { email } }))) {
    await auth.api.signUpEmail({ body: { name: story.nameEn, email, password: env.SEED_FARMER_PASSWORD } });
  }
  const user = await prisma.user.update({
    where: { email },
    data: { role: "FARMER", emailVerified: true, name: story.nameEn, location: story.locationEn },
  });
  return user.id;
}

async function seedStory(story: DemoStory, sortOrder: number, reviewedById: string | undefined) {
  assertFits(story);
  const userId = await demoFarmerId(story);

  // A fixed id, so running again replaces the photo instead of piling up copies
  const photo = await cloudinary.uploader.upload(path.join(PHOTO_DIR, story.photo), {
    folder: STORY_PHOTO_FOLDER,
    public_id: `demo-${story.slug}`,
    overwrite: true,
    resource_type: "image",
  });

  const { slug: _slug, photo: _photo, ...text } = story;
  const data = {
    ...text,
    userId,
    imageUrl: photo.secure_url,
    imageKey: photo.public_id,
    status: "APPROVED" as const,
    isFeatured: true,
    sortOrder,
    reviewedById,
    reviewedAt: new Date(),
  };

  const existing = await prisma.successStory.findFirst({ where: { imageKey: photo.public_id }, select: { id: true } });
  if (existing) {
    await prisma.successStory.update({ where: { id: existing.id }, data });
  } else {
    await prisma.successStory.create({ data: { ...data, consentAt: new Date() } });
  }
  console.log(`  ✅ ${story.nameEn} (${story.locationEn}) ${existing ? "updated" : "created"}`);
}

async function main() {
  console.log("🌾 Seeding demo success stories...");
  const admin = await prisma.user.findUnique({ where: { email: env.SEED_ADMIN_EMAIL }, select: { id: true } });

  for (const [index, story] of demoStories.entries()) {
    // From 1 up: farmers' own stories keep the default 0, so they are shown before the demo ones
    await seedStory(story, index + 1, admin?.id);
  }

  const shown = await prisma.successStory.count({ where: { status: "APPROVED", isFeatured: true } });
  console.log(`\n🎉 Done. Approved and featured stories on the home page: ${shown}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding demo stories failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
