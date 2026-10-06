import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

/**
 * Cloudinary configuration (Masud — Profile Picture Upload).
 *
 * Credentials come from CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 * CLOUDINARY_API_SECRET in .env. The config is applied at import time.
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
