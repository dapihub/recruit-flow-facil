import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const mobileMenu = {
  open: () => {
    open = true;
    emit();
  },
  close: () => {
    open = false;
    emit();
  },
  toggle: () => {
    open = !open;
    emit();
  },
};

export function useMobileMenu() {
  const isOpen = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => open,
    () => false,
  );
  return { open: isOpen, ...mobileMenu };
}
