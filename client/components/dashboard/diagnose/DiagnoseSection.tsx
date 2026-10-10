"use client";

import { useState } from "react";
import DiagnoseWorkspace from "@/components/dashboard/diagnose/DiagnoseWorkspace";
import DiagnosisHistory from "@/components/dashboard/diagnose/DiagnosisHistory";

type DiagnoseSectionProps = {
  // Photo tips, shown right under the check
  tips?: React.ReactNode;
};

// The check and its history together: each saved check reloads the history below.
export default function DiagnoseSection({ tips }: DiagnoseSectionProps) {
  const [savedCount, setSavedCount] = useState(0);

  return (
    <>
      <DiagnoseWorkspace onSaved={() => setSavedCount((count) => count + 1)} />
      {tips}
      <DiagnosisHistory version={savedCount} />
    </>
  );
}
