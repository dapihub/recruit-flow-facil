/**
 * Símbolo DAPI HUB — interpretação do "D + hub": ponto central com 5 conexões irradiando.
 * Cor única (terracota / branco / preto) seguindo o manual de marca.
 */
export function DapiSymbol({ className = "w-8 h-8", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="DAPI HUB">
      {/* arco do D */}
      <path
        d="M14 8 H30 A22 22 0 0 1 30 52 H14 Z"
        stroke={color}
        strokeWidth="6"
        strokeLinejoin="round"
        fill="none"
      />
      {/* ponto central */}
      <circle cx="32" cy="30" r="4.5" fill={color} />
      {/* 5 conexões irradiando */}
      <line x1="32" y1="30" x2="50" y2="14" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="30" x2="56" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="30" x2="50" y2="46" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="30" x2="40" y2="56" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="30" x2="40" y2="6" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* nós das pontas */}
      <circle cx="50" cy="14" r="2.5" fill={color} />
      <circle cx="56" cy="30" r="2.5" fill={color} />
      <circle cx="50" cy="46" r="2.5" fill={color} />
      <circle cx="40" cy="56" r="2.5" fill={color} />
      <circle cx="40" cy="6" r="2.5" fill={color} />
    </svg>
  );
}

export function DapiLogo({ color = "currentColor", accent = "var(--brand)" }: { color?: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3">
      <DapiSymbol className="w-9 h-9" color={accent} />
      <div className="leading-none">
        <span className="block font-black text-lg tracking-tight" style={{ color }}>
          DAPI<span style={{ color: accent }}>.</span>HUB
        </span>
        <span className="block text-[9px] uppercase tracking-[0.22em] opacity-60 mt-1" style={{ color }}>
          Recrutamento &amp; Seleção
        </span>
      </div>
    </div>
  );
}
