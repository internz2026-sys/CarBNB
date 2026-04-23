"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import { ArrowDown, ArrowUp, Star, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  addHostListingPhotoAction,
  moveHostPhotoAction,
  removeHostListingPhotoAction,
  setHostPrimaryPhotoAction,
  type HostListingActionState,
} from "@/app/actions/host-listings";

const MAX_PHOTOS = 8;

type Photo = { path: string; url: string };

export function HostListingPhotoGallery({
  listingId,
  photos,
}: {
  listingId: string;
  photos: Photo[];
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState<
    HostListingActionState,
    FormData
  >(addHostListingPhotoAction, null);
  const [removeState, removeAction] = useActionState<HostListingActionState, FormData>(
    removeHostListingPhotoAction,
    null,
  );
  const [primaryState, primaryAction] = useActionState<HostListingActionState, FormData>(
    setHostPrimaryPhotoAction,
    null,
  );
  const [moveState, moveAction] = useActionState<HostListingActionState, FormData>(
    moveHostPhotoAction,
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error =
    uploadState?.error ?? removeState?.error ?? primaryState?.error ?? moveState?.error;
  const atMax = photos.length >= MAX_PHOTOS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
        <CardDescription>
          Upload up to {MAX_PHOTOS}. The first photo is the primary — shown as the cover
          on listing cards and customer-facing pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <form action={uploadAction} className="flex flex-wrap items-center gap-3">
          <input name="listingId" type="hidden" value={listingId} />
          <label
            className={`inline-flex items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition ${
              atMax
                ? "border-muted cursor-not-allowed opacity-50"
                : "border-primary/40 hover:bg-primary/5 cursor-pointer"
            }`}
          >
            <UploadCloud className="size-4" />
            {atMax ? "Max photos reached" : "Choose photo"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={atMax}
              name="file"
              onChange={(e) => {
                if (e.target.files?.length) {
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              ref={fileInputRef}
              type="file"
            />
          </label>
          <span className="text-xs text-muted-foreground">
            {photos.length} of {MAX_PHOTOS} · JPG, PNG, WebP · Max 5 MB each
          </span>
          {uploadPending ? (
            <span className="text-xs text-primary">Uploading...</span>
          ) : null}
        </form>

        {photos.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No photos uploaded yet. Add at least one so your listing looks complete.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, i) => (
              <div
                className="relative overflow-hidden rounded-lg border border-border bg-muted"
                key={photo.path}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    alt={`Photo ${i + 1}`}
                    className="object-cover"
                    fill
                    src={photo.url}
                  />
                  {i === 0 ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary">
                      <Star className="size-3" />
                      Primary
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-background border-t border-border">
                  <span className="text-xs text-muted-foreground">Photo {i + 1}</span>
                  <div className="flex gap-1">
                    {i !== 0 ? (
                      <form action={primaryAction}>
                        <input name="listingId" type="hidden" value={listingId} />
                        <input name="path" type="hidden" value={photo.path} />
                        <Button
                          aria-label="Set as primary"
                          size="icon"
                          title="Set as primary"
                          type="submit"
                          variant="ghost"
                        >
                          <Star className="size-4" />
                        </Button>
                      </form>
                    ) : null}
                    {i > 0 ? (
                      <form action={moveAction}>
                        <input name="listingId" type="hidden" value={listingId} />
                        <input name="path" type="hidden" value={photo.path} />
                        <input name="direction" type="hidden" value="up" />
                        <Button
                          aria-label="Move up"
                          size="icon"
                          title="Move up"
                          type="submit"
                          variant="ghost"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                      </form>
                    ) : null}
                    {i < photos.length - 1 ? (
                      <form action={moveAction}>
                        <input name="listingId" type="hidden" value={listingId} />
                        <input name="path" type="hidden" value={photo.path} />
                        <input name="direction" type="hidden" value="down" />
                        <Button
                          aria-label="Move down"
                          size="icon"
                          title="Move down"
                          type="submit"
                          variant="ghost"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </form>
                    ) : null}
                    <form action={removeAction}>
                      <input name="listingId" type="hidden" value={listingId} />
                      <input name="path" type="hidden" value={photo.path} />
                      <Button
                        aria-label="Remove photo"
                        className="text-destructive hover:text-destructive"
                        size="icon"
                        title="Remove"
                        type="submit"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
