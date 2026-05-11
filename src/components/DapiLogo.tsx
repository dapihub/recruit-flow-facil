import logoColor from "@/assets/dapi-logo-color.png";
import logoWhite from "@/assets/dapi-logo-white.png";

/**
 * Logotipo oficial DAPI HUB.
 * Use variant="white" sobre fundos escuros e variant="color" sobre fundos claros.
 */
export function DapiLogo({
  variant = "color",
  className = "h-9 w-auto",
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  const src = variant === "white" ? logoWhite : logoColor;
  return (
    <img
      src={src}
      alt="DAPI HUB — Recrutamento & Seleção"
      className={className}
      draggable={false}
    />
  );
}

/** Apenas o símbolo (sem wordmark) — recortado da arte oficial. */
export function DapiSymbol({
  variant = "color",
  className = "h-8 w-8",
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  const src = variant === "white" ? logoWhite : logoColor;
  // Recorta apenas o quadrante esquerdo (~24% da largura) onde está o símbolo.
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        backgroundSize: "auto 100%",
        width: "1em",
        aspectRatio: "1 / 1",
      }}
      aria-label="DAPI HUB"
      role="img"
    />
  );
}
