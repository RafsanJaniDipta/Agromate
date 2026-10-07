// Shrinks a photo in the browser so uploads stay small and fast on mobile data.
// The long side becomes at most `maxSide` pixels; the result is a JPEG of the given quality (0–1).
export async function shrinkImage(file: File, maxSide: number, quality = 0.9): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (context) {
    // Smoother downscaling than the default, so fine detail like crop rows stays crisp
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", quality),
  );
}
