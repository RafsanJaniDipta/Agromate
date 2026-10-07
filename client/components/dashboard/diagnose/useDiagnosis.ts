"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { DIAGNOSE_ERRORS, saveDiagnosis, type DiagnoseError, type Diagnosis } from "@/lib/diseases";
import { shrinkImage } from "@/lib/shrinkImage";

// Phone photos are shrunk to this many pixels on the long side before upload
const MAX_SIDE = 1024;

export type DiagnoseStatus = "idle" | "loading" | "done" | "error";
// Keeping the finished check in the farmer's history
export type SaveStatus = "idle" | "saving" | "saved" | "error";

// State of one disease check: the chosen photo, the request, Gemini's answer, and saving that
// answer to the farmer's history. `onSaved` runs after each save (e.g. to refresh the history list).
// Used by the disease-check page (DiagnoseWorkspace).
export function useDiagnosis(onSaved?: () => void) {
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<DiagnoseStatus>("idle");
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<DiagnoseError | null>(null);
  // Optional: which of the farmer's planted crops the photo is from
  const [cropCycleId, setCropCycleId] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // The shrunk photo Gemini looked at; the same file is kept with the saved check
  const checkedPhoto = useRef<Blob | null>(null);

  // Free the preview's memory when it changes or the component unmounts
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  function openPicker() {
    inputRef.current?.click();
  }

  // A photo chosen any way: file picker, camera or dragged onto the frame
  function chooseFile(picked: File) {
    if (!picked.type.startsWith("image/")) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setStatus("idle");
    setResult(null);
    setError(null);
    setSaveStatus("idle");
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = ""; // so picking the same photo again still triggers a change
    if (picked) chooseFile(picked);
  }

  async function save(diagnosis: Diagnosis) {
    if (!checkedPhoto.current) return;
    setSaveStatus("saving");
    try {
      await saveDiagnosis(checkedPhoto.current, diagnosis, cropCycleId || undefined);
      setSaveStatus("saved");
      onSaved?.();
    } catch {
      setSaveStatus("error");
    }
  }

  async function analyze() {
    if (!file) return;
    setStatus("loading");
    setError(null);
    setSaveStatus("idle");

    try {
      const photo = await shrinkImage(file, MAX_SIDE);
      checkedPhoto.current = photo;
      const body = new FormData();
      body.append("image", photo, "leaf.jpg");
      body.append("locale", locale);
      const res = await fetch("/api/diagnose", { method: "POST", body });
      const data = (await res.json()) as Partial<Diagnosis> & { error?: string };

      if (!res.ok || data.error) {
        const code = DIAGNOSE_ERRORS.find((e) => e === data.error) ?? "upstream";
        throw Object.assign(new Error(code), { code });
      }
      const diagnosis = data as Diagnosis;
      setResult(diagnosis);
      setStatus("done");
      // Every real plant check goes into the history; "not a plant" photos don't
      if (diagnosis.isPlant) void save(diagnosis);
    } catch (err) {
      const code = (err as { code?: DiagnoseError }).code ?? "network";
      setError(code);
      setStatus("error");
    }
  }

  // For the "try again" button when saving failed
  const retrySave = () => result && void save(result);

  return {
    inputRef,
    file,
    previewUrl,
    status,
    result,
    error,
    cropCycleId,
    setCropCycleId,
    saveStatus,
    openPicker,
    pickFile,
    chooseFile,
    analyze,
    retrySave,
  };
}

export type DiagnosisState = ReturnType<typeof useDiagnosis>;
