import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
}

const MAX_WIDTHS = { sm: "400px", md: "520px", lg: "720px" };

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.55)" }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl flex flex-col"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            width: "90vw",
            maxWidth: MAX_WIDTHS[size],
            maxHeight: "90vh",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Dialog.Title
              className="text-base font-semibold"
              style={{ color: "var(--fg)" }}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-md transition-colors hover:bg-[var(--border)]"
                style={{ color: "var(--fg-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div
              className="shrink-0 px-5 py-4 flex justify-end gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
