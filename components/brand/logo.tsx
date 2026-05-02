// Pippa logo mark — peach disc with cream crescent moon inside.
// The crescent is a cream circle with an offset peach circle eclipsing it.
type Props = { size?: number; className?: string };

export function Logo({ size = 64, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Pippa"
    >
      <circle cx="32" cy="32" r="30" fill="#F5A983" />
      <circle cx="27" cy="32" r="14" fill="#FBF7F2" />
      <circle cx="34" cy="29" r="13" fill="#F5A983" />
    </svg>
  );
}
