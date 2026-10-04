"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { DIAGNOSE_ERRORS, type DiagnoseError, type Diagnosis } from "@/lib/diseases";

// Phone photos are shrunk to this many pixels on the long side before upload
const MAX_SIDE = 1024;

export type DiagnoseStatus = "idle" | "loading" | "done" | "error";

// Shrinks the photo in the browser so uploads stay small and fast on mobile data
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.9),
  );
}

// State of one disease check: the chosen photo, the request and Gemini's answer.
// Used by the disease-check page (DiagnoseWorkspace).
export function useDiagnosis() {
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<DiagnoseStatus>("idle");
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<DiagnoseError | null>(null);

  // Free the preview's memory when it changes or the component unmounts
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  function openPicker() {
    inputRef.current?.click();
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setStatus("idle");
    setResult(null);
    setError(null);
  }

  async function analyze() {
    if (!file) return;
    setStatus("loading");
    setError(null);

    try {
      const body = new FormData();
      body.append("image", await shrinkImage(file), "leaf.jpg");
      body.append("locale", locale);
      const res = await fetch("/api/diagnose", { method: "POST", body });
      const data = (await res.json()) as Partial<Diagnosis> & { error?: string };

      if (!res.ok || data.error) {
        const code = DIAGNOSE_ERRORS.find((e) => e === data.error) ?? "upstream";
        throw Object.assign(new Error(code), { code });
      }
      setResult(data as Diagnosis);
      setStatus("done");
    } catch (err) {
      const code = (err as { code?: DiagnoseError }).code ?? "network";
      setError(code);
      setStatus("error");
    }
  }

  return { inputRef, file, previewUrl, status, result, error, openPicker, pickFile, analyze };
}

export type DiagnosisState = ReturnType<typeof useDiagnosis>;
