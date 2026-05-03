// Tracker-row icons — illustrated SVG, brand-controlled, non-emoji.
// Each takes a target px size; the gradient and accent colors are baked in
// so caller code stays clean.
import { cn } from "@/lib/utils";

type Variant =
  | "sleep"
  | "diaper"
  | "feed"
  | "note"
  | "cry"
  | "rash"
  | "chat"
  | "milestone"
  | "insights";

type Props = {
  variant: Variant;
  size?: number;
  className?: string;
};

export function TrackerIcon({ variant, size = 56, className }: Props) {
  const id = `${variant}-${size}`;
  switch (variant) {
    case "sleep":
      return <Sleep size={size} id={id} className={className} />;
    case "diaper":
      return <Diaper size={size} id={id} className={className} />;
    case "feed":
      return <Feed size={size} id={id} className={className} />;
    case "note":
      return <Note size={size} id={id} className={className} />;
    case "cry":
      return <Cry size={size} id={id} className={className} />;
    case "rash":
      return <Rash size={size} id={id} className={className} />;
    case "chat":
      return <Chat size={size} id={id} className={className} />;
    case "milestone":
      return <Milestone size={size} id={id} className={className} />;
    case "insights":
      return <Insights size={size} id={id} className={className} />;
  }
}

type IconProps = { size: number; id: string; className?: string };

function Tile({
  children,
  size,
  className,
  bg,
}: {
  children: React.ReactNode;
  size: number;
  className?: string;
  bg: string;
}) {
  // Apple-app-icon-style squircle: ~28% radius for the soft tile shape.
  // Background uses a layered linear-gradient so the tile catches a
  // tiny top-edge highlight (lit-from-above) and rolls into a slightly
  // darker base — the "3D" feel without WebGL.
  const radius = Math.round(size * 0.28);
  return (
    <div
      className={cn(
        "shrink-0 relative grid place-items-center overflow-hidden",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 22%), linear-gradient(180deg, ${bg} 0%, ${bg} 100%)`,
        borderRadius: radius,
        boxShadow: `0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(74,53,64,0.06) inset, 0 4px 10px -2px rgba(74,53,64,0.10), 0 1px 2px rgba(74,53,64,0.05)`,
      }}
    >
      {children}
    </div>
  );
}

function Sleep({ size, className }: IconProps) {
  // Crescent moon with gentle Z stack.
  const s = size * 0.62;
  return (
    <Tile size={size} className={className} bg="#FFE7BD">
      <svg
        viewBox="0 0 64 64"
        width={s}
        height={s}
        fill="none"
        aria-hidden
      >
        <path
          d="M40 12c-2 0-4 .25-5.85.72A18 18 0 1 0 50.28 33.85 16 16 0 0 1 40 12Z"
          fill="#E8B86D"
          stroke="#1F1B18"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Z stack */}
        <text
          x="40"
          y="22"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight="700"
          fontSize="13"
          fill="#1F1B18"
        >
          z
        </text>
        <text
          x="48"
          y="14"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight="700"
          fontSize="9"
          fill="#1F1B18"
        >
          z
        </text>
      </svg>
    </Tile>
  );
}

function Diaper({ size, className }: IconProps) {
  const s = size * 0.62;
  return (
    <Tile size={size} className={className} bg="#FCE5D5">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
        {/* trapezoid diaper outline */}
        <path
          d="M14 18h36c1 0 1.7.8 1.6 1.8L48 40c-1.4 7.2-7.7 12-15.8 12h-.4c-8.1 0-14.4-4.8-15.8-12L12.4 19.8c-.1-1 .6-1.8 1.6-1.8Z"
          fill="#fff"
          stroke="#1F1B18"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* peach inner band */}
        <path
          d="M16.4 40c1.4 7.2 7.7 12 15.8 12h-.4c-8.1 0-14.4-4.8-15.8-12Z"
          fill="#F5A983"
        />
        {/* fastener strip */}
        <rect x="22" y="22" width="20" height="3" rx="1.5" fill="#E8E2D5" />
      </svg>
    </Tile>
  );
}

function Feed({ size, className }: IconProps) {
  const s = size * 0.62;
  return (
    <Tile size={size} className={className} bg="#DDE7EF">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
        {/* nipple */}
        <path
          d="M28 8h8a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3Z"
          fill="#FCE5D5"
          stroke="#1F1B18"
          strokeWidth="2"
        />
        {/* collar */}
        <rect
          x="22"
          y="17"
          width="20"
          height="5"
          rx="1.5"
          fill="#fff"
          stroke="#1F1B18"
          strokeWidth="2"
        />
        {/* bottle */}
        <rect
          x="20"
          y="22"
          width="24"
          height="32"
          rx="6"
          fill="#fff"
          stroke="#1F1B18"
          strokeWidth="2.5"
        />
        {/* milk fill */}
        <path
          d="M22 36h20v15a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3V36Z"
          fill="#A8C0D6"
        />
        {/* tick marks */}
        <line x1="38" y1="28" x2="42" y2="28" stroke="#1F1B18" strokeWidth="1.5" />
        <line x1="38" y1="33" x2="42" y2="33" stroke="#1F1B18" strokeWidth="1.5" />
      </svg>
    </Tile>
  );
}

function Note({ size, className }: IconProps) {
  const s = size * 0.6;
  return (
    <Tile size={size} className={className} bg="#D9E5DA">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
        <path
          d="M16 12h24l8 8v32H16V12Z"
          fill="#fff"
          stroke="#1F1B18"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M40 12v8h8" fill="none" stroke="#1F1B18" strokeWidth="2.5" />
        <line x1="22" y1="30" x2="38" y2="30" stroke="#7BA081" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="36" x2="42" y2="36" stroke="#7BA081" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="42" x2="34" y2="42" stroke="#7BA081" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Tile>
  );
}

function Cry({ size, className }: IconProps) {
  const s = size * 0.6;
  return (
    <Tile size={size} className={className} bg="#DDE7EF">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        <circle cx="32" cy="34" r="14" fill="#fff" stroke="#1F1B18" strokeWidth="2.5" />
        <path d="M26 32a2 2 0 1 1-2-2" stroke="#1F1B18" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 32a2 2 0 1 1-2-2" stroke="#1F1B18" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M27 42c2 1.4 3.4 1.4 5 0c1.6 1.4 3 1.4 5 0" stroke="#1F1B18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M22 30 L20 22 L24 26 Z M42 30 L46 22 L46 26 Z" fill="#A8C0D6" stroke="#1F1B18" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </Tile>
  );
}

function Rash({ size, className }: IconProps) {
  // Magnifying glass over a skin-tone patch with rash spots inside the
  // lens. Reads as "check the rash" instead of the prior heart-with-dots
  // which got mistaken for a generic favorites icon.
  const s = size * 0.62;
  return (
    <Tile size={size} className={className} bg="#F8D8DA">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        {/* Magnifier handle — drawn first so the lens sits on top. */}
        <path
          d="M40 40 L52 52"
          stroke="#1F1B18"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M40 40 L52 52"
          stroke="#E68E92"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lens — skin-tone fill so the spots inside read as on-skin. */}
        <circle
          cx="26"
          cy="26"
          r="16"
          fill="#FCE5D5"
          stroke="#1F1B18"
          strokeWidth="2.5"
        />
        {/* Rash spots inside the lens. */}
        <circle cx="22" cy="22" r="2.2" fill="#E68E92" />
        <circle cx="31" cy="21" r="1.8" fill="#E68E92" />
        <circle cx="20" cy="30" r="1.6" fill="#E68E92" />
        <circle cx="28" cy="31" r="2.4" fill="#E68E92" />
        {/* Specular highlight on the lens for that inspect-y feel. */}
        <path
          d="M16 18a8 8 0 0 1 6-5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </Tile>
  );
}

function Chat({ size, className }: IconProps) {
  const s = size * 0.6;
  return (
    <Tile size={size} className={className} bg="#D8C8E8">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        <path
          d="M14 20a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8H30l-8 8v-8a8 8 0 0 1-8-8V20Z"
          fill="#fff"
          stroke="#1F1B18"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="27" r="2" fill="#1F1B18" />
        <circle cx="32" cy="27" r="2" fill="#1F1B18" />
        <circle cx="40" cy="27" r="2" fill="#1F1B18" />
      </svg>
    </Tile>
  );
}

function Milestone({ size, className }: IconProps) {
  const s = size * 0.6;
  return (
    <Tile size={size} className={className} bg="#F8E5C0">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        <path
          d="M22 14h20v8a10 10 0 0 1-20 0v-8Z"
          fill="#E8B86D"
          stroke="#1F1B18"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M22 18h-4a4 4 0 0 0 4 4M42 18h4a4 4 0 0 1-4 4"
          fill="none"
          stroke="#1F1B18"
          strokeWidth="2.5"
        />
        <rect x="26" y="32" width="12" height="6" rx="1.5" fill="#fff" stroke="#1F1B18" strokeWidth="2" />
        <rect x="22" y="38" width="20" height="6" rx="1.5" fill="#fff" stroke="#1F1B18" strokeWidth="2" />
      </svg>
    </Tile>
  );
}

function Insights({ size, className }: IconProps) {
  const s = size * 0.6;
  return (
    <Tile size={size} className={className} bg="#D9E5DA">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        <rect x="14" y="36" width="10" height="14" rx="2" fill="#7BA081" stroke="#1F1B18" strokeWidth="2" />
        <rect x="27" y="26" width="10" height="24" rx="2" fill="#F5A983" stroke="#1F1B18" strokeWidth="2" />
        <rect x="40" y="18" width="10" height="32" rx="2" fill="#A8C0D6" stroke="#1F1B18" strokeWidth="2" />
      </svg>
    </Tile>
  );
}
