import { useState } from "react";
import { CreditCard, X } from "lucide-react";

const STORAGE_KEY = "themis:trial-banner-dismissed";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1"
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 text-[13px] shrink-0"
      style={{
        background: "color-mix(in srgb, #f59e0b 12%, var(--bg-card))",
        borderBottom: "1px solid color-mix(in srgb, #f59e0b 32%, var(--border))",
        color: "#b45309",
      }}
    >
      <CreditCard className="w-4 h-4 shrink-0" style={{ color: "#d97706" }} />
      <span className="flex-1 truncate">
        <strong className="font-semibold">Período de teste</strong>
        <span className="opacity-80"> — assine um plano para desbloquear todas as funcionalidades</span>
      </span>
      <button
        type="button"
        className="px-3 py-1 rounded-md text-[12px] font-semibold transition-colors"
        style={{
          border: "1px solid #d97706",
          color: "#b45309",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#d97706";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#b45309";
        }}
      >
        Assinar Agora
      </button>
      <button
        type="button"
        onClick={dismiss}
        title="Dispensar"
        className="p-1 rounded hover:opacity-80"
        style={{ color: "#b45309" }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
