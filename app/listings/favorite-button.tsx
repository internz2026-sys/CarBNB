"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  listingId: string;
  initialFavorited: boolean;
  // "card" = small overlay button positioned inside a card photo area;
  // "detail" = larger standalone button used on the listing detail page.
  variant?: "card" | "detail";
};

export function FavoriteButton({
  listingId,
  initialFavorited,
  variant = "card",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    // The card variant lives inside a parent <Link> — without these the
    // click navigates to the listing detail before the toggle fires.
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await toggleFavoriteAction(listingId);
      if (result.ok) {
        setFavorited(result.favorited);
        return;
      }
      if (result.needsLogin) {
        const redirectTo = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/login?redirectTo=${redirectTo}`);
        return;
      }
      // Non-auth error — for now just log; could surface a toast in a polish pass.
      console.error("toggleFavoriteAction:", result.error);
    });
  }

  const heartClasses = cn(
    variant === "card" ? "size-4" : "size-5",
    favorited
      ? "fill-rose-500 text-rose-500"
      : "text-on-surface-variant",
  );

  const buttonClasses = cn(
    "grid place-items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50",
    variant === "card"
      ? "absolute right-3 top-3 size-8 bg-white/90 hover:bg-white shadow-sm"
      : "size-12 bg-surface-container-highest hover:bg-surface-container-high",
  );

  const label = favorited ? "Remove from favorites" : "Save to favorites";

  return (
    <button
      aria-label={label}
      aria-pressed={favorited}
      className={buttonClasses}
      disabled={pending}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Heart className={heartClasses} />
    </button>
  );
}
