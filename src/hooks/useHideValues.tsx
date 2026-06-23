import { createContext, useContext, useState, type ReactNode } from "react";

interface HideValuesContextValue {
  hidden: boolean;
  toggle: () => void;
}

const HideValuesContext = createContext<HideValuesContextValue | undefined>(undefined);

export function HideValuesProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const toggle = () => setHidden((h) => !h);
  return (
    <HideValuesContext.Provider value={{ hidden, toggle }}>
      {children}
    </HideValuesContext.Provider>
  );
}

export function useHideValues() {
  const ctx = useContext(HideValuesContext);
  if (!ctx) throw new Error("useHideValues must be used inside HideValuesProvider");
  return ctx;
}
