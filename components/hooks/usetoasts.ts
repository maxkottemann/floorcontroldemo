import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);

  const showToast = (message: string, type: "error" | "success" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return { toast, showToast, hideToast: () => setToast(null) };
}
