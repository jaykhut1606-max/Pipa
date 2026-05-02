// Pippa logo mark.
// A peach disc (slight gradient for depth) holding a cream crescent moon.
// The moon is built from two overlapping shapes so the crescent is real, not a
// thin disc-on-disc fake. Optional `withGlow` adds a soft halo when used as a
// hero element.
type Props = {
  size?: number;
  className?: string;
  withGlow?: boolean;
};

export function Logo({ size = 64, className, withGlow = false }: Props) {
  // Stable id per render so multiple Logos on a page don't collide.
  const id = `pippa-logo-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Pippa"
    >
      <defs>
        <radialGradient id={`${id}-disc`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFC9A7" />
          <stop offset="55%" stopColor="#F5A983" />
          <stop offset="100%" stopColor="#E8916A" />
        </radialGradient>
        {withGlow && (
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        )}
        <mask id={`${id}-crescent`}>
          {/* full white = visible */}
          <circle cx="27" cy="32" r="14" fill="#fff" />
          {/* black = subtracted, leaving a crescent */}
          <circle cx="34" cy="29" r="13.5" fill="#000" />
        </mask>
      </defs>

      {withGlow && (
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="#F5A983"
          opacity="0.35"
          filter={`url(#${id}-glow)`}
        />
      )}

      {/* peach disc with subtle inner shadow ring */}
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-disc)`} />
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="#1F1B18"
        strokeOpacity="0.06"
        strokeWidth="1"
      />

      {/* cream crescent — visible portion of the masked circle */}
      <rect
        x="0"
        y="0"
        width="64"
        height="64"
        fill="#FBF7F2"
        mask={`url(#${id}-crescent)`}
      />

      {/* tiny accent star */}
      <circle cx="46" cy="20" r="1.4" fill="#FBF7F2" opacity="0.9" />
    </svg>
  );
}
