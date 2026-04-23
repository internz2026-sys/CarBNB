import "server-only";
import { db } from "@/lib/db";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // excludes I, O, 0, 1 for readability
const REF_LENGTH = 6;
const MAX_ATTEMPTS = 10;

function randomRef(): string {
  let out = "BK-";
  for (let i = 0; i < REF_LENGTH; i++) {
    out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return out;
}

// Collision-safe reference generator. Probability of a 6-char clash in 32^6
// space (~1B) is negligible at demo scale, but we still retry on the DB
// unique constraint to be safe.
export async function generateBookingReference(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ref = randomRef();
    const existing = await db.booking.findUnique({
      where: { referenceNumber: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  throw new Error("Could not allocate booking reference after 10 attempts");
}
