"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Photo = { url: string };

export function PhotoGallery({
  photos,
  alt,
}: {
  photos: Photo[];
  alt: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const closeLightbox = () => setOpenIndex(null);
  const showPrev = () => {
    if (openIndex === null) return;
    setOpenIndex((openIndex - 1 + photos.length) % photos.length);
  };
  const showNext = () => {
    if (openIndex === null) return;
    setOpenIndex((openIndex + 1) % photos.length);
  };

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, photos.length]);

  if (photos.length === 0) return null;

  // Thumbnail strip — only render if there's more than one photo. The hero
  // image on the page already handles the single-photo case.
  if (photos.length === 1) {
    return (
      <button
        aria-label="View photo"
        className="hidden"
        onClick={() => setOpenIndex(0)}
        type="button"
      >
        Open
      </button>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <button
            aria-label={`Open photo ${i + 1}`}
            className="relative aspect-square overflow-hidden rounded-xl bg-surface-container transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary"
            key={p.url}
            onClick={() => setOpenIndex(i)}
            type="button"
          >
            <Image
              alt={`${alt} photo ${i + 1}`}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 33vw, 25vw"
              src={p.url}
            />
          </button>
        ))}
      </div>

      {openIndex !== null ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
        >
          <button
            aria-label="Close"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={closeLightbox}
            type="button"
          >
            <X className="size-5" />
          </button>

          <button
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            type="button"
          >
            <ChevronLeft className="size-6" />
          </button>

          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              alt={`${alt} photo ${openIndex + 1}`}
              className="object-contain"
              fill
              priority
              sizes="90vw"
              src={photos[openIndex].url}
            />
          </div>

          <button
            aria-label="Next photo"
            className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            type="button"
          >
            <ChevronRight className="size-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            {openIndex + 1} / {photos.length}
          </div>
        </div>
      ) : null}
    </>
  );
}
