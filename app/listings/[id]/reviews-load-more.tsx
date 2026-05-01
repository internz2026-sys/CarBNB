"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadMoreReviewsAction } from "@/app/actions/reviews";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string;
};

export function ReviewsLoadMore({
  listingId,
  initialSkip,
  initialHasMore,
}: {
  listingId: string;
  // The number of reviews already rendered server-side; load-more starts here.
  initialSkip: number;
  initialHasMore: boolean;
}) {
  const [extra, setExtra] = useState<Review[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const skip = initialSkip + extra.length;
      const result = await loadMoreReviewsAction(listingId, skip);
      setExtra((prev) => [...prev, ...result.reviews]);
      setHasMore(result.hasMore);
    });
  }

  if (!hasMore && extra.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {extra.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
      {hasMore ? (
        <Button
          className="w-full"
          disabled={pending}
          onClick={loadMore}
          size="sm"
          type="button"
          variant="outline"
        >
          {pending ? "Loading..." : "View more reviews"}
        </Button>
      ) : null}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <article className="rounded-xl border border-border/50 bg-surface-container-lowest p-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              className={
                review.rating >= n
                  ? "size-4 fill-amber-400 text-amber-400"
                  : "size-4 text-on-surface-variant"
              }
              key={n}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-on-surface">
          {review.customerName}
        </span>
        <span className="text-xs text-on-surface-variant">
          · {format(new Date(review.createdAt), "MMM d, yyyy")}
        </span>
      </div>
      {review.comment ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">
          {review.comment}
        </p>
      ) : null}
    </article>
  );
}
