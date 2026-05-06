import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Tier 17 — three-step indicator rendered above the create form +
// at the top of /host/cars/[id]/edit when status=DRAFT.
//
// Steps complete in order: basics → photos → orcr. "currentStep" is
// the one the host is actively on right now (visually emphasized).
// "hasPhotos" / "hasOrCr" come from the listing row itself so the
// stepper reflects ground truth even after a refresh.

export type WizardStep = "basics" | "photos" | "orcr";

const STEP_LABELS: Record<WizardStep, string> = {
  basics: "Basics",
  photos: "Photos",
  orcr: "OR / CR",
};

const STEP_ORDER: WizardStep[] = ["basics", "photos", "orcr"];

export function ListingWizardStepper({
  currentStep,
  hasPhotos,
  hasOrCr,
}: {
  currentStep: WizardStep;
  hasPhotos: boolean;
  hasOrCr: boolean;
}) {
  // basics is implicitly complete once the listing row exists (we're
  // past /host/cars/new). Pass currentStep="basics" only on the create
  // page itself; on edit pages currentStep should reflect what the
  // host is actually working on.
  const completion: Record<WizardStep, boolean> = {
    basics: currentStep !== "basics",
    photos: hasPhotos,
    orcr: hasOrCr,
  };

  return (
    <ol className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface-container-low px-4 py-3 text-sm">
      {STEP_ORDER.map((step, idx) => {
        const isCurrent = step === currentStep;
        const isDone = completion[step];
        return (
          <li className="flex flex-1 items-center gap-2 min-w-0" key={step}>
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                isDone
                  ? "bg-emerald-100 text-emerald-700"
                  : isCurrent
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-on-surface-variant",
              )}
            >
              {isDone ? (
                <Check className="size-3.5" />
              ) : isCurrent ? (
                <Circle className="size-3 fill-on-primary stroke-none" />
              ) : (
                idx + 1
              )}
            </span>
            <span
              className={cn(
                "truncate text-xs sm:text-sm font-semibold",
                isCurrent ? "text-on-surface" : "text-on-surface-variant",
              )}
            >
              {STEP_LABELS[step]}
            </span>
            {idx < STEP_ORDER.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1 min-w-3",
                  isDone ? "bg-emerald-400" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
