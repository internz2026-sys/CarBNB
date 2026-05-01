"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createReviewAction, type ReviewActionState } from "@/app/actions/reviews";

const COMMENT_MAX_LENGTH = 1000;

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(
    createReviewAction,
    null,
  );

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];
  const display = hover > 0 ? hover : rating;

  return (
    <Card className="border-border/50 shadow-sm mt-8">
      <CardHeader>
        <CardTitle className="text-base">Leave a review</CardTitle>
        <CardDescription>
          Share how the trip went. Your review will appear on the listing for future renters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input name="bookingId" type="hidden" value={bookingId} />
          <input name="rating" type="hidden" value={rating} />

          {state?.error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Rating</Label>
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHover(0)}
              role="radiogroup"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                  className="rounded p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  role="radio"
                  type="button"
                >
                  <Star
                    className={
                      display >= n
                        ? "size-7 fill-amber-400 text-amber-400"
                        : "size-7 text-on-surface-variant"
                    }
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-on-surface-variant">
                {rating > 0 ? `${rating} / 5` : "Pick a rating"}
              </span>
            </div>
            {fieldError("rating") ? (
              <p className="text-xs text-red-600">{fieldError("rating")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              className="resize-none h-32"
              id="comment"
              maxLength={COMMENT_MAX_LENGTH}
              name="comment"
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the car? How was communication with the host? Any tips for future renters?"
              value={comment}
            />
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>{fieldError("comment") ?? ""}</span>
              <span>
                {comment.length} / {COMMENT_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled={pending || rating === 0} type="submit">
              {pending ? "Submitting..." : "Submit review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
