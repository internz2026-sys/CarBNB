# DriveXP Manual Testing Checklist

End-to-end manual test plans for each shipped tier. Run these locally before merging a tier branch to `main`. Each section's steps are independent — pass or fail one at a time.

## How to use

- Run `npm run dev` and have local Docker Postgres up (`npm run db:up`).
- Have these accounts ready locally (sign up via `/signup` or use the seeded admin):
  - **Admin** — `admin@carbnb.com` (seeded; create the matching Supabase Auth user manually if not done)
  - **Verified Host** — sign up via `/signup` → Host tab, then approve as admin
  - **Customer** — sign up via `/signup` → Customer tab
- Open Prisma Studio (`npm run db:studio`) in another tab when sections reference DB-level inspection.
- Many sections require specific seed conditions (e.g. a COMPLETED booking, a multi-photo listing). Each section's **Setup** block notes what's needed.

When adding a new tier, append a `## Tier N — <Name>` section at the bottom. Keep each section's structure: prerequisites, then T*N*-A through T*N*-F numbered steps.

---

## Tier 9 — Browse & filter overhaul

Customer-facing browse + listing detail upgrade. New vehicle-type and features taxonomy on listings, hero search with Where/From/Until, URL-state-driven filter rail + sort, lightbox photo gallery, and date threading from listings into the booking dialog.

### Prerequisites

- Three accounts: admin, verified host, customer
- At least 3-4 ACTIVE listings in the local DB (seed gives you 3; the host-created one from T9-B can be approved to add a 4th)
- For T9-E: at least one ACTIVE listing with **multiple photos** (admin can upload extras at `/car-listings/[id]/edit`)

### T9-A — Admin listing forms (vehicleType + features)

**Setup**
1. Run `npm run dev` and log in as `admin@carbnb.com`.

**Create flow**
2. Navigate to `/car-listings/new`.
3. Fill out the form. In the **Specifications & Pricing** card you should now see a **Vehicle Type** dropdown as the first field, before Transmission.
4. Open the dropdown — it should list: Sedan, SUV, Hatchback, MPV, Van, Pickup, Coupe.
5. Pick **SUV**.
6. Below the Specifications card you should see a new **Vehicle Features** card with 13 checkboxes laid out in a 3-column grid: Air conditioning, Bluetooth, USB ports, Backup camera, GPS, Dashcam, Child seat, Sunroof, Cruise control, Apple CarPlay, Android Auto, Keyless entry, Auto wipers.
7. Tick at least 3 features (any combination).
8. Fill out the rest of the form (owner, plate, brand, model, etc.) and click **Save & Continue**.
9. You should be redirected to `/car-listings/[id]/edit` for the new listing.

**Edit flow (round-trip persistence)**
10. On the edit page, scroll to the **Vehicle Details** card.
11. The **Vehicle Type** field should display "SUV" (the value you saved).
12. The **Features** section should show the 13 checkboxes with the ones you ticked already pre-checked.
13. Change the Vehicle Type to **Sedan**, untick one feature, tick another, and click **Save Details**.
14. After save, scroll to the same fields again (or refresh the page). The new selections should persist.

**Activity log**
15. Visit `/dashboard` (or wherever the activity log surfaces) — recent entries should show "LISTING_CREATED" with your new listing and "LISTING_UPDATED" with `vehicleType, features` in the changed-fields list.

### T9-B — Host listing forms (vehicleType + features)

**Setup**
1. Log out from the admin account. Log in as a **VERIFIED** host.
2. After login you should land on `/host/dashboard`.

**Create flow**
3. Click **My cars** in the host nav (or go to `/host/cars`).
4. Click the **List a new car** button (or whatever CTA the page uses) — should go to `/host/cars/new`.
5. Fill out the form. In the **Specifications & Pricing** card you should now see a **Vehicle Type** dropdown as the first field, before Transmission.
6. Open it — same 7 options as the admin form (Sedan, SUV, Hatchback, MPV, Van, Pickup, Coupe).
7. Pick **Hatchback**.
8. Scroll further down in the same Specifications & Pricing card — below the Description field you should see a horizontal divider, then a new **Features** section with the 13-item checkbox grid (3 columns on desktop, 2 on mobile).
9. Tick at least 3 features.
10. Fill out the rest (plate, brand, model, year, color, location, transmission, fuel, seats, daily price, description) and click **Submit for Approval**.
11. You should be redirected to `/host/cars/[id]/edit` for the new listing. Status should be **PENDING_APPROVAL**.

**Edit flow (round-trip persistence)**
12. On the host edit page, scroll to the **Vehicle Details** card.
13. The **Vehicle Type** field should display "Hatchback".
14. The **Features** section should show the same 13 checkboxes with your selections pre-checked.
15. Change the Vehicle Type to **MPV**, untick one feature, tick a different one, and click **Save Details**.
16. Refresh the page. The new selections should persist.

**Ownership scope sanity check**
17. While still logged in as that host, manually navigate to `/host/cars/[some-other-host's-listing-id]/edit`.
18. You should see a **404 / not-found** page — the host can only edit their own cars.

**Approval round-trip**
19. Log out, log back in as admin.
20. Go to `/car-listings`, find the host-submitted listing (status PENDING_APPROVAL), and click into its edit page.
21. Verify Vehicle Type + Features show the host's selections.
22. Approve the listing (status → ACTIVE) so it's ready for the next test sections that use the public `/listings` page.

### T9-C — /listings hero search (Where + From + Until)

**Setup**
1. Make sure you have at least 3-4 ACTIVE listings in your local DB.
2. Open an incognito window (so you're a logged-out guest viewer) and go to `http://localhost:3000/listings`.

**Hero layout**
3. Above the city chips, you should see a new search panel — a single rounded card with 4 columns side-by-side on desktop:
   - **Where** (text input with magnifier icon, placeholder "City or area")
   - **From** (date picker)
   - **Until** (date picker)
   - **Search** button (filled, primary color, with magnifier icon)
4. Each input should have a tiny uppercase label above it ("WHERE", "FROM", "UNTIL").
5. Below those four inputs there should be a small `Search by brand or model name` collapsible row (a `<details>` element). Click it to expand — a text input appears.
6. Resize the window narrower (e.g. mobile/tablet width) — the 4 inputs should stack vertically.

**Free-text Where search**
7. In the **Where** input, type `makati` (lowercase). Click **Search**.
8. URL changes to `/listings?location=makati&from=&until=`.
9. Result count line above the cards updates ("X cars found").
10. Only listings whose location **contains** "Makati" (case-insensitive) should remain.
11. Try `mak` — same result (partial match).
12. Try `xyz` — should show the empty state: **"No listings match your search"**.
13. Click **All cities** chip below the hero — should clear the location and show all listings again.

**Date-range filter**
14. In the hero, set **From** to today + 1 day. Set **Until** to today + 3 days. Click **Search**.
15. URL gets `?from=YYYY-MM-DD&until=YYYY-MM-DD`.
16. The count line should now read **"X cars available for your dates"** (different copy than the no-date-filter state).
17. Listings that have weekly availability rules **excluding** any of those 3 days, OR have a blocked exception on any of those days, OR have a confirmed/ongoing/pending booking overlapping those days, should disappear.
18. Pick wide-open dates (3 months in the future) and refresh — most listings should reappear.

**Error tolerance**
19. Try an invalid range — From = today + 5, Until = today + 1 (return before pickup). Click Search.
20. The form will submit, but the date filter should silently no-op and you'll see all listings as if no date filter was applied.

**Brand/model search**
21. Click **Search by brand or model name** to expand the details row.
22. Type `vios` and click **Search**. Only listings whose brand OR model contains "vios" should remain.
23. Note that this search is independent of the **Where** field — both can be used together.

**State preservation when clicking a city chip**
24. With From/Until set, click a city chip (e.g. **Makati City**).
25. URL should preserve `from`, `until`, AND add `location=Makati City`. Both filters apply together.

### T9-D — Filter rail + sort dropdown

**Setup**
1. Stay on `/listings` (incognito, logged out).
2. Make sure no hero filters are active.

**Sort dropdown**
3. Look at the line above the cards grid: on the right side you should see **Sort:** with a select dropdown.
4. The dropdown's default value should be **Price: Low to High**.
5. Open it — three options: Price: Low to High, Price: High to Low, Newest first. *(Tier 10 adds a fourth: Top rated.)*
6. Pick **Price: High to Low**. Page reloads, URL gets `?sort=price_desc`. Cards reorder so the most expensive is first.
7. Pick **Newest first**. URL gets `?sort=newest`. Cards reorder by `createdAt` descending.
8. Pick **Price: Low to High** again. URL drops the `sort=` param (since asc is the default).

**Filter rail layout**
9. On desktop (≥1024px wide), the filter rail should be a column on the LEFT of the cards grid (two-column layout: rail | cards).
10. The rail card should be sticky as you scroll.
11. On narrower widths (mobile/tablet), the filter rail stacks above the cards grid.

**Filter rail content**
12. Inside the rail, top-to-bottom:
    - **Filters** heading (with a Clear link only if filters are active)
    - **Price (₱/day)** — two number inputs (Min / Max) with an em-dash between
    - **Vehicle Type** — 7 checkboxes in a 2-col grid
    - **Transmission** — 3 radio options (Any, Automatic, Manual)
    - **Fuel Type** — 4 checkboxes
    - **Seats** — 5 radio buttons in a single row
    - **Apply filters** button (full-width, primary)

**Single-filter sanity check**
13. Tick **SUV** in Vehicle Type. Click **Apply filters**.
14. URL gets `?types=SUV`. Only SUV-vehicleType listings should remain.
15. Notice the **Clear** link now appears next to the Filters heading.

**Multi-checkbox filter**
16. Tick **SUV** AND **Sedan**. Apply.
17. URL gets `?types=SUV&types=SEDAN`. Both vehicle types appear.

**Price range**
18. Clear filters. Enter Min: `2000`, Max: `3000`. Apply.
19. URL gets `?minPrice=2000&maxPrice=3000`. Only listings with `dailyPrice` between 2000 and 3000 inclusive.
20. Try just Min, just Max — verify partial-range filtering works.

**Transmission radio**
21. Pick **Automatic**. Apply. URL gets `?transmission=Automatic`. Only automatic cars.
22. Pick **Any**. URL drops `transmission=`.

**Seats radio**
23. Pick **5+** seats. Apply. URL gets `?seats=5`. Only `seatingCapacity >= 5`.
24. Pick **7+**. URL gets `?seats=7`.

**Fuel multi-select**
25. Tick **Diesel** AND **Gasoline**. Apply. URL gets `?fuels=Diesel&fuels=Gasoline`.

**Combined filters + hero**
26. Set hero: Where = `makati`. Apply via Search.
27. In the rail: tick **SUV**, set Min = 3000. Apply filters.
28. URL preserves location, types, minPrice. Result is the intersection.

**Hero submit RESETS rail filters (intentional)**
29. With filters active, change the hero **Where** and click **Search**.
30. URL keeps the new location but **drops** the rail-side filter params. Submitting a new hero search starts a fresh trip search.

**Sort + filters together**
31. With any filter active, change the sort dropdown. URL preserves all filter params and just adds/updates `sort=`.

**Clear all**
32. With several filters active, click **Clear** in the rail header.
33. URL keeps only hero state (location, from, until, sort). Filter params disappear.

### T9-E — Listing detail upgrades (gallery + features + host link)

**Setup**
1. Pick a listing with multiple photos. Upload extras as admin if needed.
2. In incognito, click into that listing from `/listings`.

**Photo gallery — section appears**
3. Below the price/plate card and above the 3-tile (Seats / Trans / Fuel) row, you should see a new section: **Photos (N)** heading with a thumbnail grid.
4. The grid renders 3 columns on small screens and 4 on wider screens. Square crops, rounded corners.
5. If only 1 photo, the section should NOT appear.

**Lightbox open**
6. Click the first thumbnail. A full-screen dark overlay should appear with:
   - The photo enlarged (~80vh × 90vw)
   - A close button (X) top-right
   - Left arrow on the left edge (vertically centered)
   - Right arrow on the right edge
   - Counter at bottom-center: "1 / N"
7. Page behind the overlay should be dimmed/blurred.

**Lightbox navigation**
8. Click right arrow. Photo advances to "2 / N".
9. Right arrow on the LAST photo wraps to "1 / N".
10. Left arrow on photo 1 wraps to "N / N".
11. Press **→** keyboard arrow — same as right click.
12. Press **←** — same as left click.
13. Press **Esc** — lightbox closes.
14. Re-open by clicking a different thumbnail (e.g. third). Should open at index 3.
15. Click outside the photo (dark backdrop) — closes.
16. Click X — closes.

**Vehicle Features section**
17. Scroll down past **About this [Brand]**. Should see new **Vehicle Features** section heading.
18. Features render as 2-column checklist (1-col on mobile), each with a green primary-color check (✓) and the feature label.
19. Features shown should match what was ticked when the listing was saved.
20. If a listing has no features at all, the entire section should be hidden.

**Host name link**
21. Find the **Owner** card. The host's **name** should now be a link (hover changes to primary color).
22. Below rating + trips, there's a new **View profile** link (small, primary).
23. Click either link. Should navigate to `/hosts/[ownerId]`.
24. *(Pre-Tier 11 expectation)* 404 Not Found page. *(Tier 11 wires it to a real page.)*

### T9-F — Date threading from /listings → detail booking dialog

**Setup**
1. Logged-in customer account.
2. ACTIVE listing with mostly open availability for the next two weeks.

**Click without dates — normal flow (regression check)**
3. Go to `/listings`. Don't set dates. Click any card.
4. Detail URL is `/listings/[id]` (no params). Booking dialog stays **CLOSED**.
5. Click "Reserve Now" — dialog opens, no pre-selection. Close it.

**Click WITH dates — dialog auto-opens, range pre-filled**
6. Set From = today + 5, Until = today + 7. Click Search.
7. Click into a listing card.
8. Detail URL is `/listings/[id]?from=YYYY-MM-DD&until=YYYY-MM-DD`.
9. Booking dialog **AUTO-OPENS** immediately on page load.
10. Calendar shows the 3-day range pre-highlighted.
11. Price preview at the bottom shows: 3 days × daily rate, platform fee, owner payout, total.
12. Click **Reserve Now** in the dialog → booking created → redirected to `/account/bookings/[id]`.

**Closing the auto-opened dialog**
13. Repeat with a different listing.
14. Press Esc or click X. Dialog closes; URL still has `?from=&until=`.
15. Click "Reserve Now" in bottom bar — dialog re-opens with range still pre-selected.

**Date params on conflicting dates**
16. As admin, add an availability exception blocking today + 5 days for one listing.
17. As customer, set From = today + 4, Until = today + 6 (blocked day in the middle).
18. Click that listing's card. Dialog auto-opens with red conflict warning.
19. Submit button disabled (or bounces back with error).

**Logged-out guest with date params (regression)**
20. Log out. Set dates, click a card.
21. Detail URL has `?from=&until=`, but NO dialog opens.
22. Bottom bar shows **"Log in to Reserve"** link.
23. Click → redirects to `/login?redirectTo=/listings/[id]`. *(Note: from/until are dropped in redirectTo — pre-existing.)*

**Admin / host with date params (regression)**
24. Log in as admin or host. Visit `/listings?from=...&until=...&` directly.
25. Dialog should NOT auto-open. Bottom bar shows: *"This account isn't set up as a customer..."*

---

## Tier 10 — Reviews & ratings

Customer reviews tied to completed bookings, with denormalized aggregates that feed cards and the listing detail page. Single 1-5 stars + optional comment, customer-only, post-COMPLETED, one per booking, no edit, no host reply.

### Prerequisites

- All Tier 9 prerequisites
- A **COMPLETED booking** for a customer account. Easiest path: log in as admin → `/bookings` → pick a CONFIRMED or ONGOING booking → progress through Start → Complete via the action buttons.
- For T10-D (load-more): use `npx tsx scripts/seed-test-reviews.ts <listingId> 10` to seed enough reviews on one listing.

### T10-A — Review form visibility on booking detail

**Setup**
1. Have at least one COMPLETED booking + a non-COMPLETED booking + a CANCELLED/REJECTED booking owned by the same customer.

**Form visibility — COMPLETED + no review (form should appear)**
2. Log in as the customer. Navigate to `/account` → click into the COMPLETED booking → `/account/bookings/[id]`.
3. Scroll to the bottom. Below the Payment card, a new card titled **"Leave a review"** with description **"Share how the trip went..."**.
4. Inside the card:
   - **Rating** label
   - 5 outlined star icons in a row
   - "Pick a rating" helper text next to the stars
   - **Comment (optional)** label
   - Textarea (placeholder mentions car, communication, tips)
   - Character counter at bottom-right ("0 / 1000")
   - **Submit review** button bottom-right (DISABLED — rating is 0)
5. Hover over the third star (no click). Stars 1-3 should fill amber, 4-5 stay outlined.
6. Move mouse off star row. Hover preview clears.
7. Click the third star. Stars 1-3 stay filled, helper text changes to "3 / 5", **Submit review** button enables.
8. Click the first star — back to 1 selected.

**Comment counter**
9. Type characters. Counter updates live ("12 / 1000").
10. Try to paste 2000 chars. Browser caps at 1000.

**Form visibility — non-COMPLETED bookings**
11. Click into a PENDING / CONFIRMED / ONGOING booking. NO "Leave a review" card.
12. Click into CANCELLED / REJECTED. No review card, no contact-admin footer.

### T10-B — Submit a review + verify aggregate sync

**Setup**
1. Use the same customer + COMPLETED booking from T10-A.
2. Open Prisma Studio. Note the listing's `avgRating` (should be `0`) and `reviewCount` (should be `0`).

**Happy path — rating only**
3. Pick **4 stars**. Leave comment empty. Submit.
4. Page reloads. "Leave a review" card is gone. New card titled **"Your review"**:
   - 5 stars rendered, first 4 filled amber, 5th outlined
   - "4 / 5" label
   - Today's date with `·` separator
   - *"No comment."* (italic, muted)

**Verify aggregate sync — Prisma Studio**
5. Refresh `Review` table. Exactly 1 row with `rating=4`, `comment=null`.
6. Refresh `CarListing`. `avgRating=4`, `reviewCount=1`.

**Verify aggregate sync — listing detail**
7. Navigate to `/listings/[that-listing-id]`. Scroll past Vehicle Features.
8. Reviews section: aggregate ★ **4.0** · 1 review on the right.
9. One review card below: 4 amber stars + 1 outline, customer name, today's date, no comment.

**Verify aggregate sync — listings card**
10. Navigate to `/listings`. Find the card. Below title row, the spec line shows ★ **4.0** **(1)** before seats / trans / fuel chips.
11. Other listings (no reviews) should NOT show stars chip.

**Already-reviewed (idempotency)**
12. Go back to `/account/bookings/[id]`. Form is GONE — replaced by Your-review card.
13. DB-level: `Review.bookingId` is `@unique`, prevents duplicates.

**Validation — rating + comment**
14. Use a different COMPLETED booking on a different listing. Pick **5 stars**, type real comment. Submit.
15. Read-only card now shows the comment text below the stars.
16. Verify in Prisma Studio: `rating=5`, `comment` set.

**Comment trim**
17. Submit a review with leading/trailing whitespace in comment. Verify trimmed in DB.

**Two reviews on one listing — avg recompute**
18. Progress two bookings on the SAME listing (different customers, both COMPLETED). Submit 5★ + 3★.
19. Verify in Prisma Studio: `avgRating=4`, `reviewCount=2`.
20. Listing detail: ★ **4.0** · 2 reviews. Newest first.

**Activity log**
21. As admin, check activity log. Recent entries include `REVIEW_CREATED` lines for each review.

### T10-C — Listing detail reviews display + empty state

**Setup**
1. Three test listings:
   - **A**: 0 reviews
   - **B**: 1 review
   - **C**: 2+ reviews

**Empty state — Listing A**
2. In incognito, navigate to `/listings/[A-id]`. Scroll past Vehicle Features.
3. Reviews section:
   - Heading **"Reviews"** on left
   - Right side: **"No ratings yet"** (small, muted — NOT "0.0 ★")
4. Below: single rounded card centered with **"No reviews yet — be the first to review after your trip."**
5. NO "View more" button.

**Single review — Listing B**
6. Navigate to `/listings/[B-id]`.
7. Aggregate: ★ **[rating]** · **1 review** (singular).
8. One review card with stars, customer name, date, comment (or none).
9. NO "View more".

**Multiple reviews — Listing C (chronological)**
10. Navigate to `/listings/[C-id]`.
11. Aggregate: ★ **[avg]** · **2 reviews** (plural).
12. **Most recent** review on top.

**Display formatting**
13. Stars on review cards are display-only (no hover).
14. Multi-line comments preserve line breaks (CSS `whitespace-pre-wrap`).
15. Long customer names wrap, don't overflow.

**Aggregate edge cases**
16. Half-star avg (1×4★ + 1×5★ = 4.5) renders correctly.
17. `toFixed(1)` always shows one decimal (e.g. 5.0 not 5).

**Section position**
18. Reviews appears AFTER Vehicle Features and BEFORE the Owner card.
19. If no features, Reviews appears directly after About.
20. Mobile: aggregate row stays right-aligned next to heading.

### T10-D — View more (load-more) reviews

**Setup**
1. Pick a listing. Run `npx tsx scripts/seed-test-reviews.ts <listingId> 10` to top up to ~12 reviews.
2. Verify in Prisma Studio that `Review` table grew and `CarListing.reviewCount` matches.

**Hidden when ≤ 5 reviews (regression check)**
3. Navigate to a listing with 0-5 reviews.
4. Reviews section shows existing reviews and stops. NO "View more reviews" button.

**Visible when > 5 reviews**
5. Navigate to `/listings/[seeded-listing-id]`.
6. Aggregate shows new total (e.g. ★ 3.0 · 12 reviews).
7. First **5** reviews render (newest-first).
8. **"View more reviews"** button (full-width, outline) appears below.

**Click View more — first additional batch**
9. Click button. Text changes to **"Loading..."**.
10. **5 additional reviews** append (10 total visible). Button still visible (12 > 10).
11. No duplicate reviews; order still newest-first.

**Click View more — final batch**
12. Click again. Loading state, then **2 final reviews** append.
13. **View more reviews button DISAPPEARS** (hasMore is now false).

**No duplicate appends**
14. Refresh page (full reload). Initial 5 reviews render again.
15. Click View more twice rapidly before first request completes. Button is `disabled` while pending — only one batch appears.

**Layout**
16. Loaded-in cards match server-rendered styling (border, padding, stars).
17. Button stretches full-width.
18. Mobile: cards stack normally; button still full-width.

**Cleanup (optional)**
19. To remove test reviews: Prisma Studio → Review table → filter by listingId → delete rows whose linked Booking has `referenceNumber` starting with `TEST-`. Re-run aggregate recompute by hand or wait for next real review.

### T10-E — Card stars + Top rated sort

**Setup**
1. Mix of listings with various review counts:
   - One with high avg + many reviews (the seeded one from T10-D)
   - Some with 1-2 reviews each
   - Several with 0 reviews

**Card stars chip — visible when reviewCount > 0**
2. Navigate to `/listings`.
3. Card for a listing with at least 1 review. Below title row, FIRST in chip row:
   - Small amber filled star icon
   - Avg rating with one decimal (e.g. **4.0**)
   - Review count in parens, e.g. **(12)**
   - Then existing seats / trans / fuel chips
4. Display-only — clicking still navigates to listing detail (whole card is one Link).

**Card stars chip — hidden when reviewCount = 0**
5. Cards for listings with no reviews: stars chip absent. Chip row goes straight to seats / trans / fuel.

**Top rated sort option appears**
6. Open **Sort:** dropdown.
7. Four options:
   - Price: Low to High
   - Price: High to Low
   - **Top rated** ← new in Tier 10
   - Newest first

**Top rated sort behavior**
8. Pick **Top rated**. URL gets `?sort=top_rated`.
9. Card order:
   - Highest avgRating FIRST
   - 0-review listings (avgRating=0) at the BOTTOM
10. Visible avgRating numbers in chips are descending across cards.

**Tiebreaker: reviewCount**
11. Two listings with same avgRating: more-reviewed one ranks first.
12. Intent: 4.0 from 50 reviewers > 4.0 from 1 reviewer.

**Top rated combined with filters**
13. Pick Top rated, tick SUV. Apply. URL has both `?sort=top_rated&types=SUV`. Intersection.
14. Add price max. Result narrows; sort still respected.

**Top rated combined with hero search**
15. Set Where = `makati`, click Search. Pick Top rated.
16. URL keeps `sort=top_rated`, adds `location=makati`. Cards are Makati-only, sorted by avgRating desc.

**Top rated with date range**
17. Set From + Until. Pick Top rated.
18. Listings available across the range, ordered by avgRating desc within available set.

**Switch back to Price asc**
19. URL drops `sort=` (default). Cards reorder by price ascending.

### T10-F — Permission & error edge cases

**Setup**
1. One COMPLETED+reviewed booking, one COMPLETED+unreviewed, one non-COMPLETED, one COMPLETED owned by a different customer.

**Already-reviewed booking — UI guard**
2. Open the COMPLETED+reviewed booking. "Leave a review" form NOT shown. Read-only "Your review" card shown.
3. No edit button — review editing is intentionally not in scope.

**Non-COMPLETED booking — UI guard**
4. Open CONFIRMED or ONGOING booking. NO review card. NO "Your review" card. Contact-admin footer for non-PENDING/CANCELLED/REJECTED/COMPLETED.

**0 stars — client guard**
5. On unreviewed COMPLETED booking. Type comment but don't pick rating. **Submit review** disabled.
6. Click any star — button enables.

**Comment cap — client guard**
7. Try to paste 1500 characters. Browser caps at 1000.

**Comment trim — server guard**
8. Submit with `   only whitespace tabs   `. Display trimmed. Prisma: `comment` is trimmed text.

**Empty comment after trim — stored as null**
9. Submit comment of just spaces. Display: *"No comment."* Prisma: `comment` is **null**.

**Try to bypass via URL — different customer's booking**
10. Note URL of a COMPLETED booking owned by another customer.
11. Logged in as first customer, paste URL. Page hits guard, serves **404**.

**Forge bookingId in form data (advanced)**
12. DevTools → modify hidden `<input name="bookingId">` to a foreign id. Submit.
13. Server rejects: **"You can only review your own bookings."**

**DB-level unique bookingId**
14. In Prisma Studio, manually create a Review row pointing at an existing-reviewed bookingId. Save fails with unique-constraint error.

**Invalid sort param — graceful fallback**
15. Visit `/listings?sort=garbage`. Page renders with default sort. Dropdown shows "Price: Low to High".

**Activity log entries**
16. As admin, check activity log. Each review submitted has `REVIEW_CREATED` line.

**Aggregate sanity**
17. Manually count Review rows for one listing. Compare with `CarListing.avgRating` + `reviewCount`. Should match exactly.

---

## Tier 11 — Favorites + public host profile

Login-required favorites with idempotent toggle, public host profile page, host bio editor. Closes the customer marketplace polish trilogy (Tier 9 → 10 → 11).

### Prerequisites

- All Tier 10 prerequisites
- Customer + verified host + admin accounts
- Optional for full coverage: a PENDING/SUSPENDED host (anyone unverified)

### T11-A — Heart toggle on listing cards

**Setup**
1. At least 3 ACTIVE listings.
2. Customer account with real Supabase Auth user.

**Logged-out: heart click bounces to login**
3. In incognito (logged out), navigate to `/listings`.
4. Each card has a small heart button in the top-right of the photo (white/translucent circular bg, gray outline heart).
5. Click any heart. Browser does NOT navigate to listing detail (`stopPropagation` + `preventDefault`).
6. Page redirects to `/login?redirectTo=%2Flistings...`.

**Logged-in customer: toggle on**
7. Log in. All cards show empty (outline) hearts.
8. Click a heart. Briefly disabled, then becomes **filled rose-500/pink**.
9. Hover filled heart — tooltip "Remove from favorites".
10. `aria-pressed` is `true`.

**Toggle off**
11. Click filled heart again. Returns to outline gray. Tooltip "Save to favorites".

**Persistence — refresh**
12. Favorite 2-3 listings. Hard refresh (Cmd/Ctrl+Shift+R).
13. Same listings' hearts still filled.

**Persistence — DB**
14. Prisma Studio: `Favorite` table has one row per filled heart, linking customerId to listingId.

**Card click still works (regression)**
15. Click anywhere on card EXCEPT heart. Navigates to `/listings/[id]` as before.

**Heart positioning + visual**
16. Mobile width: heart stays top-right, doesn't collide with Verified Host badge top-left.
17. Hover background brightens. Tab focus shows rose-400 ring.

**Multiple cards, rapid toggle**
18. Click hearts on 5 different listings rapidly. Each resolves independently.
19. Prisma Studio: exactly 5 Favorite rows, no duplicates.

**Stars + heart side-by-side (Tier 10 regression)**
20. Cards with reviews still show star chip. Heart top-right doesn't disrupt layout.

### T11-B — Heart toggle on listing detail page

**Setup**
1. Note one favorited listing and one unfavorited listing from T11-A.

**Heart in FixedBar — initial state matches**
2. Logged in as customer, navigate to favorited listing detail.
3. FixedBar (sticky bottom):
   - Left/center: Reserve Now (or Log in / not-customer / not-bookable variant)
   - Right: **larger heart button** (size-12, rounded-full, gray bg) with **filled rose** since favorited
4. Hover. Tooltip: "Remove from favorites".
5. Navigate to unfavorited listing. Same FixedBar shows OUTLINE heart. Tooltip: "Save to favorites".

**Toggle from detail page**
6. Click heart on unfavorited listing. Briefly disabled, then filled rose.
7. Click again. Outline.
8. Refresh — toggle state persists.

**Cross-page state consistency**
9. Favorite a listing on detail. Navigate to `/listings`. Card heart filled.
10. Toggle off on card. Navigate back to detail. FixedBar heart outline.

**Logged-out viewer**
11. Log out. Open `/listings/[id]` in incognito.
12. FixedBar: "Log in to Reserve" link + outline heart (always shown).
13. Click heart. Redirects to `/login?redirectTo=/listings/[id]`.

**Admin / host viewer**
14. Admin or host on listing detail. FixedBar shows "This account isn't set up as a customer..." + heart on right.
15. Click heart. Server returns `needsLogin: true` → redirects to login. *(Slight UX wart documented for later polish.)*

**Visual checks**
16. Detail-variant heart visibly larger than card-variant (size-5 vs size-4 icon, size-12 vs size-8 button).
17. Background `bg-surface-container-highest`. Focus ring rose-400 across both variants.

**No double-toggle race**
18. Click 3 times rapidly. `disabled` while pending; clicks during request are no-ops.

### T11-C — /account/favorites page

**Setup**
1. Customer logged in. Mix of favorites (or none).

**Empty state**
2. Toggle off all favorites if any. Verify Prisma Studio has 0 Favorite rows for this customer.
3. UserMenu (top-right) now includes **"Favorites"** link.
4. Click Favorites. URL `/account/favorites`.
5. Page shows:
   - Header (logo, Browse cars, UserMenu)
   - Heading **Favorites** + subtitle
   - Center card: rose-100 circular icon with rose-500 heart, **"No favorites yet"**, helper text, primary **Browse cars** button → `/listings`.

**Browse cars from empty state**
6. Click Browse cars. Navigates to `/listings`.

**Populated state**
7. Favorite 3 listings.
8. UserMenu → Favorites. URL `/account/favorites`.
9. 3-column grid (sm:2-col, lg:3-col) of `<ListingCard>`.
10. Each card: same layout as `/listings`. **Filled rose heart** on every card.
11. Order: most recently favorited first.

**Unfavorite from /account/favorites**
12. Click heart on first card. Becomes outline gray.
13. Card stays in grid until next page load (client component just updates its button).
14. Hard refresh — unfavorited listing gone from grid. Remaining still filled.

**Re-favorite from /listings → re-appears**
15. Go to `/listings`. Unfavorited listing's card has outline heart.
16. Click to favorite. Heart filled.
17. Navigate to Favorites. Listing appears FIRST (newest favorite).

**Card click**
18. Click card body (not heart). Navigates to `/listings/[id]`.

**Suspended listing — filtered out**
19. As admin, suspend a listing currently in your favorites. Status → SUSPENDED.
20. As customer, refresh `/account/favorites`. Listing DISAPPEARS from grid (page filters by `status === ACTIVE`).
21. Prisma Studio: Favorite row STILL exists.
22. Re-activate as admin. Listing reappears in favorites.

**Logged-out**
23. Visit `/account/favorites` directly. Proxy redirects to `/login?redirectTo=%2Faccount%2Ffavorites`.

**Non-customer**
24. Logged in as host or admin, visit `/account/favorites`. Proxy redirects to `/`.

**UserMenu parity**
25. UserMenu on `/account/favorites` has all 3 customer links.

### T11-D — Host bio editor at /host/profile

**Setup**
1. Test with VERIFIED host + PENDING/SUSPENDED host.
2. Land on `/host/dashboard` for each.

**UserMenu has Profile link**
3. Avatar in top-right opens UserMenu. Links: Dashboard · My cars · My bookings · **Profile**.
4. Click Profile. URL `/host/profile`.

**Layout — VERIFIED host**
5. Inside host shell.
6. Heading **Profile** + subtitle.
7. **Emerald banner**: *"Your profile is live at /hosts/[your-id]"* with external-link icon. Clicking opens in new tab.

**Layout — PENDING / SUSPENDED**
8. **Amber banner**: *"Your public profile goes live once an admin verifies your host account..."* No clickable URL.

**Account card**
9. Below banner: Account card showing **Name** + **Status** (read-only).

**Bio form (initial state)**
10. **Public bio** card with description.
11. Form: textarea labeled **Bio** (h-40, no resize). Placeholder helpful. Counter shows **0 / 500**. **Save bio** button right-aligned.

**Type and save**
12. Type a ~150 char bio. Counter updates live.
13. Submit. Button shows "Saving...". Page reloads with green banner **"Bio saved."**
14. Textarea retains value.
15. Prisma Studio: `Owner.bio` is the trimmed text.

**Edit + re-save**
16. Modify bio. Save. Banner re-appears.
17. Refresh — pre-fills with latest.

**Empty save (clear bio)**
18. Select all + delete. Counter **0 / 500**. Save.
19. Prisma Studio: `Owner.bio` is `null`.

**Whitespace-only**
20. Type only spaces. Save. Prisma: `null`.

**Character cap**
21. Try to type > 500 chars. `maxLength` caps at 500.
22. *(Bypass)* Remove `maxlength` via DevTools, paste 1500 chars, submit. Server rejects: **"Bio must be 500 characters or fewer."**

**Activity log**
23. As admin, check activity log. Each bio change has `HOST_BIO_UPDATED` line.
24. Saving same bio twice in a row → only ONE log entry (action skips if `newBio !== owner.bio`).

**Cross-host scope**
25. Log in as Host B. Visit `/host/profile`. Form shows B's bio (or empty), NOT Host A's.
26. Save. Prisma: only Host B's row updated.

**Logged-out / non-host**
27. Logged out → `/host/profile` redirects to `/login?redirectTo=%2Fhost%2Fprofile`.
28. Logged in as non-host → `/host/profile` redirects to `/`.

### T11-E — Public host profile at /hosts/[id]

**Setup**
1. Set up:
   - VERIFIED host with bio (from T11-D) + 2+ ACTIVE listings
   - VERIFIED host with NO bio + 1+ ACTIVE listing
   - VERIFIED host with **0 ACTIVE listings**
   - PENDING / SUSPENDED host

**VERIFIED host with bio + listings**
2. In incognito, navigate to `/hosts/[verified-with-bio-id]`.
3. Public header (DriveXP logo, Log in / Sign up since guest).
4. Profile card:
   - Circular avatar with initials, top-left of card
   - Small green ShieldCheck verified badge overlaid
   - Above name: small "VERIFIED HOST" eyebrow text in primary
   - Host's full name as large headline
   - "Member since [Month Year]" muted (matches `createdAt`)
   - Below divider: bio text with `whitespace-pre-wrap`
5. **Listings (N)** heading.
6. Listings render as 3-col grid (sm:2-col, lg:3-col) using `ListingCard`.
7. Each card has same heart, star chip, specs, click-through.

**VERIFIED without bio**
8. Navigate to that profile.
9. Profile card normal — no bio text and no divider.
10. Listings grid renders.

**VERIFIED with 0 listings (empty state)**
11. Navigate.
12. Profile card normal.
13. **Listings (0)** heading.
14. Empty state: **"No active listings right now"** + **"[FirstName] doesn't have any cars available at the moment. Check back soon."**

**PENDING / SUSPENDED — 404**
15. Navigate.
16. **404 / Not Found** page. Page does NOT leak host data.
17. Bogus id `/hosts/zzz-not-real` — same 404.

**Browser tab title**
18. Verified id: title is **"[Host Name] | DriveXP Host"**.
19. Pending id: title is **"Host Not Found | DriveXP"**.

**Header user menu — different roles**
20. **Guest**: Log in / Sign up buttons.
21. **Customer**: UserMenu with My bookings · Favorites. Listings show heart state correctly.
22. Click heart on profile card to favorite/unfavorite. Works same as `/listings`.
23. **Admin**: UserMenu with Admin dashboard. Listings render with outline hearts.
24. **Host**: UserMenu with Dashboard / My cars / My bookings / Profile.

**Click-through from listing detail (Tier 9 dead-link is now live)**
25. Navigate to `/listings/[any-active]`. Click owner name in Owner card. Navigates to `/hosts/[ownerId]`.
26. Click back. Click **View profile** small primary link. Same place.
27. Profile renders correctly. (Was a 404 before Tier 11.)

**Click-through from profile back to listings**
28. From `/hosts/[id]`, click any listing card. Navigates to `/listings/[that-id]`.
29. Round-trip: from `/listings/[id]` → host name → `/hosts/[id]` → listing card → `/listings/[id]`.

**Mobile**
30. Profile card stacks vertically. Listings grid 1-col. Header avatar still works.

**generateMetadata**
31. View source on verified profile. `<title>` and `<meta name="description">` reflect host name + generated description.

### T11-F — Permission & edge cases

**Setup**
1. Customer + host + admin accounts. At least one VERIFIED host who isn't your test host.

**Customer favoriting their own host's listing (regression)**
2. Customers can favorite ANY active listing — there's no "you can't favorite your own" rule. Sanity check.

**Multiple customers favoriting same listing**
3. Two customers favorite the SAME listing.
4. Prisma Studio: 2 Favorite rows, different customerId, same listingId.
5. Each customer's favorites page shows the listing.
6. Toggle off as customer A — only A's row deletes; B's untouched.

**DB-level unique constraint**
7. Try to manually create duplicate `(customerId, listingId)` pair in Prisma Studio. Fails with unique-constraint error.

**Cascade delete**
8. *(Optional)* Delete a customer in Prisma Studio. Their Favorite rows auto-delete.
9. Delete a listing. Its Favorite rows auto-delete.

**Toggle race**
10. Click heart 5 times rapidly. Button `disabled` while pending; deterministic final state.

**Foreign listing forge attempt**
11. DevTools manipulation: call `toggleFavoriteAction` with bogus listingId.
12. Server rejects: **"Listing not found."**
13. Real but non-active listing id: server allows favoriting (intentional — listing might temporarily reactivate).

**Bio update — ownership scope**
14. Host A saves "I am Host A". Without logging out, modify form to claim Host B's bio.
15. Server looks up Owner by **email** in auth session, not by form-data id. Forge fails.
16. Host B's bio in Prisma Studio unchanged.

**Bio update on suspended host**
17. As admin, suspend a host. Log in as that host. Visit `/host/profile`.
18. Bio editor renders normally. Save bio change. Succeeds.
19. Visit `/hosts/[that-id]` in incognito. 404 (suspended hosts don't show publicly).
20. Re-VERIFY as admin. Public profile renders.

**Activity log entries**
21. Each bio save → `HOST_BIO_UPDATED` line. Idempotent saves don't dup.

**Favorites do NOT create activity log entries (intentional)**
22. Toggle several favorites. Activity log has NO `FAVORITE_*` entries (high-frequency, would be noise).

**Logged-out → /host/profile**
23. Redirects to `/login?redirectTo=%2Fhost%2Fprofile`.
24. Non-host login → redirects to `/`.

**Logged-out → /account/favorites**
25. Redirects to `/login?redirectTo=%2Faccount%2Ffavorites`.
26. Non-customer login → redirects to `/`.

**Public profile is genuinely public**
27. Visit `/hosts/[verified-id]` in incognito. Renders. No login required.
28. Same content visible to all roles (only header UserMenu varies).

**Browser back/forward**
29. Favorite on `/listings`. Navigate to detail. Browser back. Card still filled (server re-renders fresh).
30. Toggle off. Forward to detail. FixedBar heart outline.

**Tier 9 + 10 + 11 features all coexist**
31. Find a card with reviews AND favorited.
32. Card shows: filled rose heart top-right, Verified Host badge top-left, title + year + type + location, star chip + seats + trans + fuel chips. No layout breakage.

---

## Adding a new tier

When you ship a new tier (T12+), append a section here following the same structure:

```markdown
## Tier N — <Tier Name>

<One-paragraph summary of what shipped.>

### Prerequisites

- ...

### TN-A — <Section Name>

**Setup**
1. ...

<numbered steps>

### TN-B — ...
```

Keep sections small enough that each can be confirmed independently. Six sections per tier (A through F) is the rough target — split into more if a tier is unusually broad.
