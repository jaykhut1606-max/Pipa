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

function Sleep({ size, className, id }: IconProps) {
  // Crescent moon with a soft radial gradient (warm top → deeper amber
  // bottom) so the moon catches a hint of "lit from above" depth.
  // Z stack uses Fraunces stylistic alternate for a curlier feel.
  const s = size * 0.62;
  const gradId = `${id}-moon`;
  return (
    <Tile size={size} className={className} bg="#FFE7BD">
      <svg viewBox="0 0 64 64" width={s} height={s} fill="none" aria-hidden>
        <defs>
          <radialGradient id={gradId} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#F2C97A" />
            <stop offset="55%" stopColor="#E8B86D" />
            <stop offset="100%" stopColor="#C99A52" />
          </radialGradient>
        </defs>
        <path
          d="M40 12c-2 0-4 .25-5.85.72A18 18 0 1 0 50.28 33.85 16 16 0 0 1 40 12Z"
          fill={`url(#${gradId})`}
          stroke="#3a2f33"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        {/* Inner specular highlight on the moon's upper-left curve */}
        <path
          d="M22 24a14 14 0 0 1 8-8"
          stroke="#FFF6DD"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Z stack */}
        <text
          x="40"
          y="22"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight="700"
          fontSize="13"
          fill="#3a2f33"
        >
          z
        </text>
        <text
          x="48"
          y="14"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight="700"
          fontSize="9"
          fill="#3a2f33"
        >
          z
        </text>
      </svg>
    </Tile>
  );
}

function Diaper({ size, className, id }: IconProps) {
  // Soft cream-to-white linear gradient on the diaper body so it doesn't
  // read as a flat white silhouette against the peach tile. Peach inner
  // band gets its own gradient for depth at the leg openings.
  const s = size * 0.62;
  const bodyGrad = `${id}-body`;
  const bandGrad = `${id}-band`;
  return (
    <Tile size={size} className={className} bg="#FCE5D5">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
        <defs>
          <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FAEEDF" />
          </linearGradient>
          <linearGradient id={bandGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB995" />
            <stop offset="100%" stopColor="#E89272" />
          </linearGradient>
        </defs>
        {/* trapezoid diaper outline */}
        <path
          d="M14 18h36c1 0 1.7.8 1.6 1.8L48 40c-1.4 7.2-7.7 12-15.8 12h-.4c-8.1 0-14.4-4.8-15.8-12L12.4 19.8c-.1-1 .6-1.8 1.6-1.8Z"
          fill={`url(#${bodyGrad})`}
          stroke="#3a2f33"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        {/* peach inner band */}
        <path
          d="M16.4 40c1.4 7.2 7.7 12 15.8 12h-.4c-8.1 0-14.4-4.8-15.8-12Z"
          fill={`url(#${bandGrad})`}
        />
        {/* fastener strip */}
        <rect x="22" y="22" width="20" height="3" rx="1.5" fill="#E8E2D5" />
        {/* tiny tab dot to break the symmetry */}
        <circle cx="42" cy="23.5" r="1" fill="#3a2f33" opacity="0.45" />
      </svg>
    </Tile>
  );
}

function Feed({ size, className, id }: IconProps) {
  // Soft cream gradient on the bottle body so it isn't a flat white
  // rectangle. Milk gets a top-down soft-blue gradient with a
  // surface-shine highlight so it reads as liquid, not as a sticker.
  const s = size * 0.62;
  const bodyGrad = `${id}-body`;
  const milkGrad = `${id}-milk`;
  return (
    <Tile size={size} className={className} bg="#DDE7EF">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
        <defs>
          <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F1EA" />
          </linearGradient>
          <linearGradient id={milkGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C5D8E8" />
            <stop offset="100%" stopColor="#94B0C9" />
          </linearGradient>
        </defs>
        {/* nipple */}
        <path
          d="M28 8h8a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3Z"
          fill="#FCE5D5"
          stroke="#3a2f33"
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
          stroke="#3a2f33"
          strokeWidth="2"
        />
        {/* bottle */}
        <rect
          x="20"
          y="22"
          width="24"
          height="32"
          rx="6"
          fill={`url(#${bodyGrad})`}
          stroke="#3a2f33"
          strokeWidth="2.25"
        />
        {/* milk fill */}
        <path
          d="M22 36h20v15a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3V36Z"
          fill={`url(#${milkGrad})`}
        />
        {/* milk surface line */}
        <line x1="22" y1="36" x2="42" y2="36" stroke="#3a2f33" strokeWidth="1" opacity="0.35" />
        {/* tick marks */}
        <line x1="38" y1="28" x2="42" y2="28" stroke="#3a2f33" strokeWidth="1.25" opacity="0.6" />
        <line x1="38" y1="33" x2="42" y2="33" stroke="#3a2f33" strokeWidth="1.25" opacity="0.6" />
        {/* bottle highlight strip */}
        <rect x="23" y="25" width="2" height="20" rx="1" fill="#FFFFFF" opacity="0.55" />
      </svg>
    </Tile>
  );
}

function Note({ size, className, id }: IconProps) {
  // Folded paper with a soft cream gradient on the body and a darker
  // sage line for the lower lines so the page reads as a real note.
  const s = size * 0.6;
  const paperGrad = `${id}-paper`;
  const foldGrad = `${id}-fold`;
  return (
    <Tile size={size} className={className} bg="#D9E5DA">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden>
        <defs>
          <linearGradient id={paperGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F4F0E7" />
          </linearGradient>
          <linearGradient id={foldGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6E1D2" />
            <stop offset="100%" stopColor="#C9C2B0" />
          </linearGradient>
        </defs>
        <path
          d="M16 12h24l8 8v32H16V12Z"
          fill={`url(#${paperGrad})`}
          stroke="#3a2f33"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        {/* folded corner triangle */}
        <path d="M40 12v8h8L40 12Z" fill={`url(#${foldGrad})`} stroke="#3a2f33" strokeWidth="2" strokeLinejoin="round" />
        <line x1="22" y1="30" x2="38" y2="30" stroke="#7BA081" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="22" y1="36" x2="42" y2="36" stroke="#7BA081" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="22" y1="42" x2="34" y2="42" stroke="#7BA081" strokeWidth="1.75" strokeLinecap="round" opacity="0.7" />
      </svg>
    </Tile>
  );
}

function Cry({ size, className, id }: IconProps) {
  // Soft face with a gentle radial gradient (warm-cream highlight at
  // the top, pale-blue cool tone at the bottom) — reads as a face
  // catching light. Two teardrops as soft-blue droplets, the mouth a
  // gentle wavy line.
  const s = size * 0.6;
  const faceGrad = `${id}-face`;
  const tearGrad = `${id}-tear`;
  return (
    <Tile size={size} className={className} bg="#DDE7EF">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        <defs>
          <radialGradient id={faceGrad} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFAF0" />
            <stop offset="100%" stopColor="#E8EEF4" />
          </radialGradient>
          <linearGradient id={tearGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C5D8E8" />
            <stop offset="100%" stopColor="#7DA3C2" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="34" r="14" fill={`url(#${faceGrad})`} stroke="#3a2f33" strokeWidth="2.25" />
        {/* eyes — closed-squinting */}
        <path d="M24 31a3 3 0 0 1 5 0" stroke="#3a2f33" strokeWidth="2.25" strokeLinecap="round" />
        <path d="M35 31a3 3 0 0 1 5 0" stroke="#3a2f33" strokeWidth="2.25" strokeLinecap="round" />
        {/* mouth — soft open frown */}
        <path d="M27 42c2 1.6 3.4 1.6 5 0c1.6 1.6 3 1.6 5 0" stroke="#3a2f33" strokeWidth="2.25" strokeLinecap="round" fill="none" />
        {/* teardrops */}
        <path d="M22 32 C 21 36, 19 39, 21 41 C 23 39, 23 36, 22 32 Z" fill={`url(#${tearGrad})`} stroke="#3a2f33" strokeWidth="1.25" strokeLinejoin="round" />
        <path d="M42 32 C 41 36, 39 39, 41 41 C 43 39, 43 36, 42 32 Z" fill={`url(#${tearGrad})`} stroke="#3a2f33" strokeWidth="1.25" strokeLinejoin="round" />
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
          stroke="#3a2f33"
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
          stroke="#3a2f33"
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
          stroke="#3a2f33"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="27" r="2" fill="#3a2f33" />
        <circle cx="32" cy="27" r="2" fill="#3a2f33" />
        <circle cx="40" cy="27" r="2" fill="#3a2f33" />
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
          stroke="#3a2f33"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M22 18h-4a4 4 0 0 0 4 4M42 18h4a4 4 0 0 1-4 4"
          fill="none"
          stroke="#3a2f33"
          strokeWidth="2.5"
        />
        <rect x="26" y="32" width="12" height="6" rx="1.5" fill="#fff" stroke="#3a2f33" strokeWidth="2" />
        <rect x="22" y="38" width="20" height="6" rx="1.5" fill="#fff" stroke="#3a2f33" strokeWidth="2" />
      </svg>
    </Tile>
  );
}

function Insights({ size, className }: IconProps) {
  const s = size * 0.6;
  return (
    <Tile size={size} className={className} bg="#D9E5DA">
      <svg viewBox="0 0 64 64" width={s} height={s} aria-hidden fill="none">
        <rect x="14" y="36" width="10" height="14" rx="2" fill="#7BA081" stroke="#3a2f33" strokeWidth="2" />
        <rect x="27" y="26" width="10" height="24" rx="2" fill="#F5A983" stroke="#3a2f33" strokeWidth="2" />
        <rect x="40" y="18" width="10" height="32" rx="2" fill="#A8C0D6" stroke="#3a2f33" strokeWidth="2" />
      </svg>
    </Tile>
  );
}
