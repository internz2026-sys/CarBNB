"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Auto-dismiss the inline message after a few seconds so it doesn't
  // linger across pages or stack on rapid clicks.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

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
      if (result.notACustomer) {
        setMessage(result.error);
        return;
      }
      // Other failures — surface inline so the user isn't left wondering.
      setMessage(result.error || "Couldn't save right now. Try again.");
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
  const pressedValue: "true" | "false" = favorited ? "true" : "false";

  // Container span lets us position the inline message relative to the button
  // for the card variant (which is absolutely positioned inside the photo).
  // The detail variant gets the message anchored above-right of the button.
  const messageWrapperClass =
    variant === "card"
      ? "absolute right-3 top-3"
      : "relative inline-block";

  const messageBubbleClass =
    variant === "card"
      ? "absolute right-0 top-10 z-10 whitespace-nowrap rounded-md bg-on-surface px-3 py-1.5 text-xs font-semibold text-on-primary shadow-lg"
      : "absolute right-0 -top-10 whitespace-nowrap rounded-md bg-on-surface px-3 py-1.5 text-xs font-semibold text-on-primary shadow-lg";

  if (variant === "card") {
    return (
      <div className={messageWrapperClass}>
        <button
          aria-label={label}
          aria-pressed={pressedValue}
          className="grid size-8 place-items-center rounded-full bg-white/90 hover:bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
          disabled={pending}
          onClick={onClick}
          title={label}
          type="button"
        >
          <Heart className={heartClasses} />
        </button>
        {message ? <div className={messageBubbleClass} role="status">{message}</div> : null}
      </div>
    );
  }

  return (
    <div className={messageWrapperClass}>
      <button
        aria-label={label}
        aria-pressed={pressedValue}
        className={buttonClasses}
        disabled={pending}
        onClick={onClick}
        title={label}
        type="button"
      >
        <Heart className={heartClasses} />
      </button>
      {message ? <div className={messageBubbleClass} role="status">{message}</div> : null}
    </div>
  );
}
