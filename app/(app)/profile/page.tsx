"use client";

// Baby Profile — dark plum themed screen with the reference IA: usage
// gate at top, then Name / Avatar / Birthday cards, caregiver actions,
// and an About / social section. Avatar opens a modal grid picker
// backed by avatar.ts (Pippa logo + DiceBear "fun-emoji" seeds).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Lock,
  Plus,
  Star,
} from "lucide-react";
import {
  readProfile,
  writeProfile,
  type BabyProfile,
} from "@/components/onboarding/profile-store";
import {
  DEFAULT_AVATAR,
  allAvatarOptions,
  avatarAlt,
  avatarSrc,
  avatarStyle,
  isSameAvatar,
  readAvatar,
  writeAvatar,
  type AvatarSelection,
} from "@/components/onboarding/avatar";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<BabyProfile>>({});
  const [avatar, setAvatar] = useState<AvatarSelection>(DEFAULT_AVATAR);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    setProfile(readProfile());
    setAvatar(readAvatar());
  }, []);

  function commitName(next: string) {
    const trimmed = next.trim().slice(0, 24);
    if (!trimmed) {
      setEditingName(false);
      return;
    }
    writeProfile({ name: trimmed });
    setProfile((p) => ({ ...p, name: trimmed }));
    setEditingName(false);
  }

  function commitBirthday(value: string) {
    if (!value) return;
    writeProfile({ birthDate: value });
    setProfile((p) => ({ ...p, birthDate: value }));
  }

  function commitAvatar(next: AvatarSelection) {
    setAvatar(next);
    writeAvatar(next);
    setAvatarOpen(false);
  }

  return (
    <main className="flex-1 bg-plum text-cream pb-32">
      <header className="container-app pt-10 flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="size-10 rounded-pill bg-cream/15 grid place-items-center text-cream hover:bg-cream/25"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <h1 className="font-display text-h2">Baby Profile</h1>
      </header>

      <div className="container-app pt-6 flex flex-col gap-3">
        <Link
          href="/paywall"
          className="rounded-2xl border border-amber/60 bg-cream/5 p-3 flex items-center gap-3"
        >
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="text-micro uppercase tracking-wider text-cream/80">
              2 daily cry translations remaining
            </span>
            <span className="text-small text-amber font-medium">
              Unlock unlimited
            </span>
          </span>
          <span className="size-9 shrink-0 rounded-md bg-ink/40 grid place-items-center">
            <Lock className="size-4" aria-hidden />
          </span>
        </Link>

        <Card>
          <Field label="Name">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => commitName(nameDraft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName(nameDraft);
                  if (e.key === "Escape") setEditingName(false);
                }}
                maxLength={24}
                className="bg-transparent text-cream text-body outline-none border-b border-cream/40 w-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(profile.name ?? "");
                  setEditingName(true);
                }}
                className="text-body text-cream text-left"
              >
                {profile.name?.trim() ? profile.name : "Tap to set"}
              </button>
            )}
          </Field>
        </Card>

        <Card onClick={() => setAvatarOpen(true)}>
          <Field label="Avatar" />
          <span
            aria-hidden
            className="size-10 shrink-0 rounded-pill bg-cream overflow-hidden"
            style={avatarStyle(avatar) ?? undefined}
          >
            {avatarSrc(avatar) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarSrc(avatar) as string}
                alt=""
                width={40}
                height={40}
                className="size-full object-cover"
              />
            )}
          </span>
          <ChevronRight className="size-4 text-cream/60 shrink-0" aria-hidden />
        </Card>

        <Card>
          <Field label="Birthday">
            <input
              type="date"
              value={profile.birthDate ?? ""}
              onChange={(e) => commitBirthday(e.target.value)}
              className="bg-transparent text-cream text-body outline-none w-full"
            />
          </Field>
          <ChevronRight className="size-4 text-cream/60 shrink-0" aria-hidden />
        </Card>

        <Card asButton onClick={() => alert("Caregivers — coming soon")}>
          <span className="flex-1 text-small text-cream">Add a caregiver</span>
          <span
            aria-hidden
            className="size-9 rounded-pill bg-cream/15 grid place-items-center"
          >
            <Plus className="size-4" aria-hidden />
          </span>
        </Card>

        <Card asButton onClick={() => alert("Caregiver code — coming soon")}>
          <span className="flex-1 text-small text-cream">
            I have a caregiver code
          </span>
          <span
            aria-hidden
            className="size-9 rounded-pill bg-cream/15 grid place-items-center"
          >
            <Download className="size-4" aria-hidden />
          </span>
        </Card>

        <div className="rounded-2xl bg-cream/5 mt-2">
          <ListLink
            href="/(marketing)/about"
            label="About Pippa"
            icon={<Info className="size-4" aria-hidden />}
          />
          <ListLink
            href="https://tiktok.com"
            external
            label="Follow us on Tiktok"
            icon={
              <span aria-hidden className="text-small font-bold">
                𝓣
              </span>
            }
          />
          <ListLink
            href="https://instagram.com"
            external
            label="Follow us on Instagram"
            icon={
              <span aria-hidden className="text-small font-bold">
                IG
              </span>
            }
          />
          <ListLink
            href="https://apps.apple.com"
            external
            label="Rate Pippa"
            icon={<Star className="size-4" aria-hidden />}
            isLast
          />
        </div>
      </div>

      <AnimatePresence>
        {avatarOpen && (
          <AvatarPicker
            current={avatar}
            babyName={profile.name ?? null}
            onCancel={() => setAvatarOpen(false)}
            onAccept={commitAvatar}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function Card({
  children,
  onClick,
  asButton,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  asButton?: boolean;
}) {
  const className =
    "w-full rounded-2xl bg-cream/5 px-4 py-3 flex items-center gap-3 text-left";
  if (asButton || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(className, "hover:bg-cream/10 transition-colors")}
      >
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      <p className="text-micro uppercase tracking-wider text-cream/70">
        {label}
      </p>
      {children}
    </div>
  );
}

function ListLink({
  href,
  label,
  icon,
  external,
  isLast,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
  isLast?: boolean;
}) {
  const className = cn(
    "flex items-center gap-3 px-4 py-3 hover:bg-cream/10 transition-colors",
    !isLast && "border-b border-cream/10"
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        <span className="flex-1 text-small text-cream">{label}</span>
        <span aria-hidden className="text-cream/60">
          {icon}
        </span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <span className="flex-1 text-small text-cream">{label}</span>
      <span aria-hidden className="text-cream/60">
        {icon}
      </span>
    </Link>
  );
}

function AvatarPicker({
  current,
  babyName,
  onCancel,
  onAccept,
}: {
  current: AvatarSelection;
  babyName: string | null;
  onCancel: () => void;
  onAccept: (next: AvatarSelection) => void;
}) {
  const [picked, setPicked] = useState<AvatarSelection>(current);
  const options = allAvatarOptions();

  return (
    <>
      <motion.button
        type="button"
        aria-label="Dismiss avatar picker"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-ink/40"
      />
      <motion.div
        role="dialog"
        aria-label="Choose your baby's avatar"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl bg-vivid-peach-soft text-ink p-5 flex flex-col gap-5 max-w-md mx-auto shadow-[var(--shadow-pop)]"
      >
        <p className="font-display text-h3 self-center bg-plum text-cream rounded-pill px-4 py-1.5 text-center">
          Choose your baby&rsquo;s avatar
        </p>
        <ul className="grid grid-cols-4 gap-3">
          {options.map((opt, i) => {
            const isSelected = isSameAvatar(picked, opt);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setPicked(opt)}
                  aria-pressed={isSelected}
                  aria-label={avatarAlt(opt, babyName)}
                  className={cn(
                    "relative aspect-square w-full rounded-full overflow-hidden bg-cream grid place-items-center transition-all",
                    isSelected
                      ? "ring-4 ring-plum shadow-[var(--shadow-pop)] scale-105"
                      : "ring-1 ring-ink/10 hover:ring-ink/30"
                  )}
                  style={avatarStyle(opt) ?? undefined}
                >
                  {avatarSrc(opt) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarSrc(opt) as string}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {isSelected && (
                    <span
                      aria-hidden
                      className="absolute -top-1 -right-1 size-5 rounded-pill bg-sage text-cream grid place-items-center shadow-[var(--shadow-soft)]"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-center gap-3 mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-5 rounded-pill text-small text-ink/80 font-medium hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onAccept(picked)}
            className="h-11 px-6 rounded-pill bg-cream text-ink text-small font-medium shadow-[var(--shadow-soft)] hover:bg-cream/90"
          >
            Accept
          </button>
        </div>
      </motion.div>
    </>
  );
}
