import multer from "multer";

import { AppError } from "../utils/AppError.js";

/**
 * Multer middleware configured to keep files in memory.
 *
 * We stream the raw buffer straight to Cloudinary so there is no need
 * to write anything to disk. Only image MIME types are accepted.
 *
 * Written by: Masud (profile-picture upload feature)
 */

/** Accept only common image formats */
const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(AppError.unprocessable("Only image files are allowed"));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: imageFilter,
});
