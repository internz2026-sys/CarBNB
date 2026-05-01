"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateHostBioAction,
  type HostProfileActionState,
} from "@/app/actions/host-profile";

const BIO_MAX_LENGTH = 500;

export function BioForm({ initialBio }: { initialBio: string }) {
  const [bio, setBio] = useState<string>(initialBio);
  const [state, formAction, pending] = useActionState<HostProfileActionState, FormData>(
    updateHostBioAction,
    null,
  );

  const errorMessage = state && "error" in state ? state.error : null;
  const fieldError =
    state && "fieldErrors" in state ? state.fieldErrors?.bio?.[0] : null;
  const saved = state && "saved" in state && state.saved === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public bio</CardTitle>
        <CardDescription>
          A short intro for renters to read on your host profile. Keep it tight — first
          impressions matter.
        </CardDescription>
      </CardHeader>
      <form action={formAction} id="host-bio-form">
        <CardContent className="space-y-4">
          {errorMessage ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          {saved ? (
            <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              Bio saved.
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              className="resize-none h-40"
              id="bio"
              maxLength={BIO_MAX_LENGTH}
              name="bio"
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Lifelong driver based in Quezon City. I keep my cars meticulously clean and respond fast to messages. Happy to help with route tips for first-time visitors."
              value={bio}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-red-600">{fieldError ?? ""}</span>
              <span>
                {bio.length} / {BIO_MAX_LENGTH}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : "Save bio"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
