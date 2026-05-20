import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "wordmark" | "icon";
type BrandLogoSize = 7 | 8 | 9 | 10 | 12;

// Intrinsic dimensions of each PNG source — locked so next/image can lock
// aspect ratio without the browser console warning. CSS height (h-N) +
// w-auto handles the visual sizing.
const SOURCE: Record<BrandLogoVariant, { src: string; width: number; height: number }> = {
  wordmark: { src: "/driveXP-logo-wordmark.png", width: 161, height: 40 },
  icon: { src: "/driveXP-logo-icon.png", width: 35, height: 48 },
};

const HEIGHT_CLASS: Record<BrandLogoSize, string> = {
  7: "h-7",
  8: "h-8",
  9: "h-9",
  10: "h-10",
  12: "h-12",
};

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  eager?: boolean;
  alt?: string;
  className?: string;
};

export function BrandLogo({
  variant = "wordmark",
  size = 8,
  eager = true,
  alt = "DriveXP",
  className,
}: BrandLogoProps) {
  const { src, width, height } = SOURCE[variant];
  return (
    <Image
      alt={alt}
      className={cn(HEIGHT_CLASS[size], "w-auto", className)}
      height={height}
      loading={eager ? "eager" : "lazy"}
      src={src}
      style={{ width: "auto" }}
      width={width}
    />
  );
}
