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

## Tier 12 — Polish pass on T9-T11

Five small UX cleanup items found during T9-T11 manual testing: landing-page Browse Cars CTA wired to `/listings`, date params preserved through the guest login round-trip, admin/host heart click shows an inline message instead of redirecting them to login, load-more reviews failures show an inline error with a retry button, and a "Recent activity" feed surfaces ActivityLogEntry rows on the admin dashboard.

### Prerequisites

- All Tier 11 prerequisites
- For T12-D: a listing with 6+ reviews. Easiest seed: `npx tsx scripts/seed-test-reviews.ts <listingId> 10`.
- For T12-E: enough activity to populate the feed. If the DB is fresh, perform a couple of mutations first (edit a listing, leave a review, change platform settings) so the feed has rows to render.

### T12-A — Landing page Browse Cars CTA

**Setup**
1. Run `npm run dev`. Open `http://localhost:3000/` in incognito (logged out).

**Hero CTA**
2. Scroll to the hero section (top of page).
3. Find the prominent "Browse Cars" button (large pill button with gradient background and an arrow icon).
4. Hover — should not show any anchor scroll preview, just the link.
5. Click. Should navigate to `/listings` (NOT scroll down to `#featured-listings`).
6. URL bar reads `http://localhost:3000/listings`.

**Header nav**
7. Click the back button to return to `/`.
8. In the top nav (between the logo and right-side buttons), find the "Browse Cars" link (smaller, text-style nav item).
9. Click. Should navigate to `/listings`.

**Featured Listings section**
10. Back to `/`. Scroll down to the "Featured Listings" section.
11. To the right of the section heading, there should be a link **"Browse all cars →"** (replaces the old "View featured car").
12. Click. Should navigate to `/listings`.

**Across viewer roles (regression)**
13. Log in as a customer. Open `/`. Hero "Browse Cars" → `/listings`. Header nav "Browse Cars" → `/listings`. UserMenu's Browse cars → `/listings`. All three should agree.
14. Log out, log in as admin. Same behavior.
15. Log out, log in as host. Same behavior.

### T12-B — Date threading through login redirect

**Setup**
1. Have a customer account ready.
2. Make sure at least one ACTIVE listing has open availability for the next 2 weeks.

**Guest path with dates — full round-trip**
3. In incognito (logged out), navigate to `/listings`.
4. In the hero search, set **From** = today + 5 days. Set **Until** = today + 7 days. Click **Search**.
5. URL becomes `/listings?location=&from=YYYY-MM-DD&until=YYYY-MM-DD`.
6. Click into any listing card.
7. Detail URL becomes `/listings/[id]?from=YYYY-MM-DD&until=YYYY-MM-DD`.
8. Bottom FixedBar shows the **"Log in to Reserve"** button (since you're logged out).
9. **Hover the button** — the URL preview at the bottom of the browser should be:
   `http://localhost:3000/login?redirectTo=%2Flistings%2F[id]%3Ffrom%3DYYYY-MM-DD%26until%3DYYYY-MM-DD`
   (the `from` and `until` params are URL-encoded inside the `redirectTo`).
10. Click **Log in to Reserve**. Lands on `/login?redirectTo=...`.
11. Log in as customer (use the Customer tab).
12. After login, you should be redirected to `/listings/[id]?from=YYYY-MM-DD&until=YYYY-MM-DD` — **with the dates preserved**.
13. The booking dialog should **AUTO-OPEN** with the 3-day range pre-selected (per Tier 9's auto-open behavior).
14. Submit or close as you like — the goal here is to confirm the dates survived the round-trip.

**Guest path WITHOUT dates — should still work (regression)**
15. Log out. Open a fresh listing detail directly without dates: `/listings/[id]`.
16. Hover the **Log in to Reserve** button — URL should be `…/login?redirectTo=%2Flistings%2F[id]` (no `from`/`until` params).
17. Click. Log in. Land on `/listings/[id]` (clean, no dates).
18. Booking dialog should NOT auto-open (matches no-dates behavior).

**Edge case: only `from` set, no `until`**
19. Log out. Manually visit `/listings/[id]?from=YYYY-MM-DD` (no `until`).
20. Hover Log in to Reserve — `redirectTo` should preserve only `from`.
21. Log in. Land back with `?from=YYYY-MM-DD` only. Dialog won't auto-open (needs both dates), but the date is still in the URL.

**Edge case: only `until` set, no `from`**
22. Same as step 19 but with only `until` set. Same expected preservation behavior.

**Sanity check — non-listing detail pages still redirect cleanly**
23. Log out. Visit `/account/favorites` (proxy bounces guests). URL becomes `/login?redirectTo=%2Faccount%2Ffavorites`.
24. Log in. Lands on `/account/favorites`.

### T12-C — Admin/host heart-click inline message

**Setup**
1. Customer + admin + host accounts.
2. Pick an ACTIVE listing for testing.

**Customer baseline (regression check)**
3. Log in as the **customer**. Open `/listings/[id]`.
4. Click the heart in the FixedBar at the bottom. Heart fills rose, no inline message appears (success path is silent).
5. Click again. Heart goes outline, no message.

**Admin clicking heart — new inline message**
6. Log out. Log in as **admin**. Open the same listing detail.
7. The FixedBar shows: "This account isn't set up as a customer..." text on the left + outline heart on the right.
8. Click the heart in the FixedBar.
9. The page should NOT redirect to `/login`. Instead, a small dark toast-style bubble should appear above-or-below the heart with the text **"Only customer accounts can save favorites."**.
10. The bubble auto-dismisses after about 3.5 seconds.
11. Click the heart again — same message reappears (state resets).
12. The heart icon stays outline (gray) the whole time.

**Host clicking heart — same behavior**
13. Log out. Log in as **host**. Open the listing detail.
14. Same FixedBar message and same outline heart.
15. Click. Same inline message: **"Only customer accounts can save favorites."** Auto-dismiss after 3.5s.

**Admin clicking heart on a card (regression)**
16. As admin, navigate to `/listings`. The hearts on cards should show outline.
17. Click a card heart. Bubble appears anchored near the heart icon (top-right of card photo area). Same message.
18. Auto-dismisses. Heart stays outline.

**Host clicking heart on a card**
19. As host, same behavior on `/listings` cards.

**Multiple rapid clicks — no stacking, just resets the timer**
20. As admin, click a card heart 5 times in quick succession.
21. The bubble appears once. Each subsequent click resets the dismiss timer.
22. After ~3.5s of no clicks, bubble dismisses.

**Logged-out heart click — still redirects (regression)**
23. Log out. Visit `/listings`. Click a card heart.
24. Page redirects to `/login?redirectTo=...`.
25. NO inline message.

**Logged-out heart click on detail FixedBar**
26. Visit `/listings/[id]` while logged out, click the heart in the FixedBar. Redirects to `/login?redirectTo=/listings/[id]`.

**Visual / placement**
27. The bubble should be a small rounded dark pill with white text, positioned near the heart (above-right for the detail variant; below-right for the card variant).
28. Bubble doesn't overlap critical UI.
29. Resize to mobile width — bubble still readable, doesn't overflow the viewport.

### T12-D — Load-more reviews error UI

**Setup**
1. Listing with 6+ reviews. Run `npx tsx scripts/seed-test-reviews.ts <listingId> 10` if needed.
2. Open `/listings/[that-listing-id]`. Confirm Reviews section shows the first 5 reviews + a **"View more reviews"** button.

**Happy path — regression check**
3. Click **View more reviews**. Button shows "Loading...". After ~1s, 5 more reviews append. Button stays visible if there are still more.
4. Click again. Final batch appends. Button disappears. No error UI shown.

**Trigger an error — offline mode**
5. Refresh the listing detail page so we're back to the initial 5 + button state.
6. Open browser DevTools → **Network** tab → set throttling to **Offline**.
7. Click **View more reviews**. Button shows "Loading..." briefly.
8. After the request fails, a **red error panel** should appear:
   - Background: red-50 (light pink)
   - Border: red-200
   - Text: red-700
   - Message: **"Couldn't load more reviews. Check your connection and try again."**
   - Below the message: an outline-variant **"Try again"** button.

**Recover from error**
9. Without dismissing the error panel, set network throttling back to **No throttling**.
10. Click **Try again**. Button shows "Retrying..." briefly.
11. Request succeeds. Error panel disappears. The 5 next reviews append.
12. The "View more reviews" button reappears below them (if more reviews exist).

**Error during second batch**
13. Click **View more reviews** to load batch 2 successfully (now 10 visible).
14. Set throttling to Offline.
15. Click **View more reviews** again. Loading → error panel renders.
16. The 10 already-visible reviews stay rendered. The error panel appears below them.
17. Disable throttling. Click **Try again**. Final batch loads. Error panel disappears.

**Error panel persistence across button clicks (no double-click race)**
18. With network offline, click **View more reviews** multiple times rapidly.
19. Button is `disabled` while pending.
20. After the first failure resolves, the error panel renders once.

**Try again button keyboard accessibility**
21. With error panel visible, Tab to the **Try again** button. Focus ring visible.
22. Press Enter or Space. Should trigger the retry.

**Sanity: error panel doesn't appear on hidden state**
23. Find a listing with ≤ 5 reviews. Open it. NO View more button, NO error panel.
24. The component returns null when there's nothing to load and no error.

**Visual check**
25. The error panel layout: message on top, Try again button below-left.
26. Mobile width: panel and button stay readable.
27. Stars / customer names / dates inside loaded review cards (above the error panel) render correctly.

### T12-E — Recent activity feed on /dashboard

**Setup**
1. Have done some recent activity across roles (creating listings, editing bios, leaving reviews, toggling status, etc.). If the DB is fresh, do a couple of mutations first.
2. Log in as admin. Navigate to `/dashboard`.

**Section appears at the bottom**
3. Scroll past the existing dashboard sections.
4. Below the bookings table you should see a new section: **"Recent activity"** heading on the left, with **"Last N events"** subtitle on the right (where N is the count, max 10).
5. Section is wrapped in a rounded card with a subtle border and shadow.

**List rendering — populated state**
6. The list shows up to 10 most recent `ActivityLogEntry` rows, ordered newest-first by `timestamp`.
7. Each list item is a row with three columns:
   - **Type chip** (left): small primary-colored pill showing the entry type (e.g. `system`, `owner`, `car`, `booking`)
   - **Action + description** (middle): action code in monospace uppercase on top, description text below
   - **Timestamp** (right): formatted as "MMM d, h:mm a"

**Tier 10 + 11 entries render**
8. Look for the action codes:
   - `REVIEW_CREATED` — *"Customer [email] left a [N]-star review on booking [id]"*
   - `HOST_BIO_UPDATED` — *"Host [email] updated their public bio"*
   - `LISTING_UPDATED`, `LISTING_CREATED`, etc.
   - `OWNER_VERIFIED`, `OWNER_SUSPENDED`, etc.
9. Type chips correctly map: review → `booking` type, bio → `owner` type, listing → `car` type.

**Trigger a new entry, refresh, see it appear**
10. In another tab as admin, navigate to a listing edit page and change something trivial. Save.
11. Go back to `/dashboard` and refresh.
12. The new entry should be at the **TOP** of the list (newest-first sort).
13. The entry that was previously 10th drops off (only 10 are shown).

**Empty state**
14. *(Hard to test without wiping DB.)* If the activity log table were empty, the section would show **"No activity yet."** in a muted card.

**Visual checks**
15. No hover state on rows (read-only list).
16. Action code in monospace uppercase visually distinct from description.
17. Long descriptions wrap to multiple lines without breaking the row.
18. Type chip is a fixed width pill.
19. Timestamp on the right doesn't wrap.

**Mobile width**
20. Resize the browser to ~640px (sm breakpoint).
21. Each row stays as a horizontal flex (chip · text · time), not stacking vertically.
22. Text truncation handles cleanly.

**Performance / load**
23. The query fetches only `take: 10` rows. Single server-rendered HTML response (no separate fetch).
24. Hundreds of activity entries should not slow the dashboard noticeably (index on `timestamp` + `take: 10`).

**Visibility scope**
25. Admin-only (proxy-guarded).
26. Customer / host UserMenus do not surface a link to the dashboard.
27. As regression: as customer/host, try `/dashboard` — proxy redirects to `/`.

**Sanity — admin actions write entries that appear here**
28. As admin, approve a pending owner. Refresh dashboard.
29. New `OWNER_VERIFIED` entry appears at the top.
30. Change the platform commission rate in `/settings`. Refresh dashboard.
31. New `PLATFORM_SETTINGS_UPDATED` entry appears.

---

## Tier 13 — Host trip-lifecycle actions

Hosts gain Start + Complete trip controls on `/host/bookings/[id]`. Admin keeps the same controls in parallel; first-mover wins. Mark-paid and cancel stay admin-only. The host has direct ground truth (handed over the keys, got the car back), so giving them this control reduces the lag where admin-as-bureaucrat was transcribing what the host already knew. Supersedes the Tier 6 "platform owns the lifecycle" decision (see BACKLOG.md decisions table).

### Prerequisites

- All Tier 12 prerequisites
- A verified host with at least one ACTIVE listing
- A customer who can book against that host's listing

### T13-A — Host Start Rental (CONFIRMED → ONGOING)

**Setup**
1. As customer, book a CONFIRMED-able trip (any future range with availability) against the verified host's listing. Booking starts as PENDING.
2. As host, log in and navigate to `/host/bookings/[id]` for the new booking. Status PENDING.
3. Click **Accept Booking**. Status transitions to CONFIRMED. Action card flips to a new "Trip ready to start?" card.

**Start Rental — happy path**
4. The "Trip ready to start?" card shows: header text, a description, and a blue **Start Rental** button with a key icon.
5. Click **Start Rental**. Button shows "Starting...". Status transitions to ONGOING.
6. Page reloads. Status badge in the header is now ONGOING (blue).
7. The action card flips again to "Trip finished?" (the Complete card).
8. The Rental Schedule card now shows a **Rental Started** timestamp matching now (e.g. "May 1, 2026 · 3:42 PM").

**Verify in DB**
9. Open Prisma Studio. Find the Booking row. `status = "Ongoing"`, `rentalStartedAt` is the timestamp you saw on the page.

**Activity log entry**
10. Log in as admin → `/dashboard`. Recent activity feed has a new `HOST_BOOKING_STARTED` entry: *"Host [email] started rental for booking [ref] ([carName])"*.

**Status guard — try to Start an already-ongoing booking via DevTools**
11. Stay on `/host/bookings/[id]` for the now-ONGOING booking. The action card shows the Complete UI, not Start.
12. *(Advanced bypass)* Use DevTools to manually submit `hostStartRentalAction` against the same bookingId. Server should return: **"Only confirmed bookings can be started. This one is 'Ongoing'."**

### T13-B — Host Complete Rental (ONGOING → COMPLETED)

**Setup**
1. Continue from T13-A with an ONGOING booking, OR create a fresh one and walk it to ONGOING.

**Complete Rental — happy path**
2. The "Trip finished?" card shows: header text, description, and a green **Complete Rental** button with a package icon.
3. Click **Complete Rental**. Button shows "Completing...". Status transitions to COMPLETED.
4. Page reloads. Status badge is now COMPLETED (emerald).
5. The action card disappears (no host actions remain on a COMPLETED booking — admin handles MarkPaid).
6. The Rental Schedule card now shows a **Rental Completed** timestamp matching now.

**Verify in DB**
7. Prisma Studio: `status = "Completed"`, `rentalCompletedAt` is the timestamp.

**Activity log entry**
8. Admin `/dashboard` → activity feed has a new `HOST_BOOKING_COMPLETED` entry: *"Host [email] completed rental for booking [ref] ([carName])"*.

**Customer side reflects the change**
9. Log out. Log in as the customer who owns the booking. Navigate to `/account/bookings/[id]`.
10. Status badge shows COMPLETED.
11. The "Leave a review" form is now visible (Tier 10 entry point).

### T13-C — Admin still has the same controls (no regression)

**Setup**
1. Set up a fresh booking trail: customer books → host accepts (CONFIRMED).

**Admin Start Rental**
2. As admin, navigate to `/bookings/[id]` (admin booking detail).
3. The action panel still has **Start Rental** as before.
4. Click. Status → ONGOING. Verify in DB.
5. Activity log entry is `BOOKING_START` with description *"Admin [email] started booking..."* — distinct from the host's entry format (admin's entry doesn't have the `HOST_` prefix).

**Admin Complete Rental**
6. While the booking is ONGOING, click **Complete Rental** on `/bookings/[id]`.
7. Status → COMPLETED. Activity log entry: `BOOKING_COMPLETE` (admin format).

**Admin still has MarkPaid + Cancel exclusively**
8. On the COMPLETED booking, **Mark as Paid** is still on `/bookings/[id]` and not on `/host/bookings/[id]`.
9. Cancel/Reject dialogs on the admin side stay unchanged.

### T13-D — First-mover wins (host vs admin race)

**Setup**
1. Create a booking, walk to CONFIRMED.
2. Open `/host/bookings/[id]` in one window (logged in as host).
3. Open `/bookings/[id]` in another window (logged in as admin).

**Host wins the start**
4. On the host window, click **Start Rental**. Status transitions to ONGOING.
5. On the admin window, click **Start Rental**. Server should return an error visible inline: *"Cannot start a booking whose current status is 'Ongoing'."* — admin's status guard catches the already-transitioned state.
6. Refresh the admin window. The action panel now shows the Complete option (matches the actual ONGOING status).

**Admin wins the complete**
7. On the admin window (still ONGOING), click **Complete Rental**. Status → COMPLETED.
8. On the host window, click **Complete Rental**. Server returns: *"Only ongoing bookings can be completed. This one is 'Completed'."*
9. Refresh the host window. The action card disappears (no host actions on COMPLETED).

### T13-E — Ownership scope (host can't act on other hosts' bookings)

**Setup**
1. Two verified hosts, each with at least one listing.
2. Customer books a trip against Host A's car. Host A confirms it (CONFIRMED).

**Forge attempt**
3. Log in as Host B. Navigate directly to `/host/bookings/[Host-A's-booking-id]`.
4. Page should 404 (the page-level guard checks `booking.ownerId === host.id`).
5. *(Advanced bypass)* In DevTools, manually submit `hostStartRentalAction` against Host A's bookingId while logged in as Host B.
6. Server returns: **"You cannot act on bookings you don't own."** (from `requireOwnBooking` helper).

**Status guard still applies**
7. Try the same forge against a booking that's not in CONFIRMED state. Server returns the status-mismatch error first if the bookingId is at least valid for the host; otherwise the ownership error.

### T13-F — PENDING / SUSPENDED hosts blocked from acting

**Setup**
1. As admin, suspend a host (or set Owner.status = SUSPENDED in Prisma Studio).
2. Log in as that host.

**Page-level rendering**
3. Navigate to `/host/bookings/[id]` for one of their bookings (status CONFIRMED). Per the existing host layout guard, the host might land on the locked dashboard view rather than the booking detail.
4. *(Advanced)* If the page renders, the action card might still appear since rendering is permissive — but the action itself is the real gate.

**Action-level rejection**
5. Submit `hostStartRentalAction` (or hostCompleteRentalAction). Server returns: **"Host account must be verified before acting on bookings."** from `requireHost()`.

**Re-VERIFY**
6. As admin, set Owner.status back to VERIFIED.
7. The same host can now Start / Complete normally.

---

## Tier 14 — Booking chat (V1 polling)

Per-booking lifecycle-bounded chat between host and renter, modeled after Grab/Uber trip chats. Opens at CONFIRMED, stays active through ONGOING, remains active for 48h after `rentalCompletedAt`, then goes read-only (history visible, no new sends). Each booking gets its own thread; past bookings between the same (host, customer) are surfaced via an inline link but kept as separate threads. Admin has read-only access to all booking chats from `/bookings/[id]`. Realtime is V1 polling (5s tick, paused on tab blur); the `useChatMessages` hook is the abstraction boundary for a future Supabase Realtime swap.

### Prerequisites

- All Tier 13 prerequisites
- A verified host with at least one ACTIVE listing
- A customer who can book against that host's listing
- Admin account for read-only verification

### T14-A — Chat opens at CONFIRMED, hidden at PENDING

**Setup**
1. As customer, book a trip against the verified host's listing. Status starts as PENDING.

**PENDING — chat is hidden on all three views**
2. Customer view: navigate to `/account/bookings/[id]`. Scroll the page. **No chat panel** should appear.
3. Host view: log in as host, navigate to `/host/bookings/[id]`. **No chat panel**.
4. Admin view: log in as admin, navigate to `/bookings/[id]`. **No chat panel**.
5. The page above the would-be panel is unchanged from Tier 13 (booking summary, dates, payment card, etc.).

**CONFIRMED — chat opens with welcome system message**
6. As host, click **Accept Booking**. Status transitions to CONFIRMED.
7. Stay on `/host/bookings/[id]`. A new chat panel card appears below the action card / above the cancellation card.
8. The panel header shows: *"Chat with renter"* + a small message-circle icon.
9. The header subtitle: *"For trip coordination only — pickup, drop-off, timing updates. Admin can view for support."*
10. The thread inside contains a single muted gray pill row: *"Booking confirmed by host. Use this chat to coordinate pickup, drop-off, and trip needs."* (system message, kind=system).
11. Below the thread: the textarea + Send button is rendered (chat is active).
12. Switch to the customer view at `/account/bookings/[id]`. The panel header shows *"Chat with host"* + same system row + active input.
13. Switch to the admin view at `/bookings/[id]`. The panel header shows *"Trip chat (read-only)"* + a small Admin view chip + privacy banner: *"Read-only access for support and dispute review. You can't send messages."*. NO input field rendered.

### T14-B — Send messages, polling propagation, optimistic updates

**Setup**
1. Continue from T14-A with the booking in CONFIRMED. Open two browser windows side-by-side:
   - Window A: customer view at `/account/bookings/[id]`
   - Window B: host view at `/host/bookings/[id]`

**Customer sends**
2. In Window A, type *"Hi! What's the pickup address?"* in the textarea. Counter shows live char count (e.g. "29 / 1000").
3. Click **Send** (or press Enter).
4. The message appears IMMEDIATELY on the customer's right side (their own bubble, primary-color background, with timestamp).
5. The textarea clears.

**Host receives within 5s — no refresh**
6. In Window B (host view), do nothing. Wait up to 5 seconds.
7. The customer's message appears on the host's left side (other-party bubble, neutral background).
8. Host did NOT refresh. The polling hook fetched it.

**Host replies**
9. In Window B, type *"It's 12 Pine St, Makati. I'll be there by 9 AM."* and send.
10. Host sees their own message instantly on the right.
11. In Window A (customer), wait up to 5s. The host's reply appears on the left.

**System messages render distinctly from user messages**
12. The earlier "Booking confirmed by host..." row should still be visible at the top of both threads, rendered as a centered muted pill (not a bubble).
13. User messages have rounded bubbles (left or right aligned); system messages don't.

**Multi-line messages preserve line breaks**
14. In Window A, type a message with line breaks (Shift+Enter inserts newline; Enter sends):
    ```
    Address:
    12 Pine St
    Makati
    Building 3, Unit 401
    ```
15. Send. The message appears with line breaks preserved (whitespace-pre-wrap).

**URL auto-linking**
16. In Window B, send: *"Here's the location pin: https://maps.google.com/?q=14.5,121.0"*.
17. The URL renders as a clickable link. Click it — opens in a new tab.

**Character cap**
18. Try to paste 1500 chars into the textarea. Browser's `maxLength` caps at 1000. Counter shows "1000 / 1000".
19. Submit attempts at exactly 1000 chars succeed.

**Empty message guard**
20. Try to click Send with an empty textarea. Button is disabled.
21. Try with only spaces ("   "). Submit attempts are blocked client-side; if you bypass, server returns *"Message can't be empty."* (Zod trim+min check).

### T14-C — Tab visibility pause/resume + missed-message catch-up

**Setup**
1. Continue from T14-B with both windows open.

**Pause polling on blur**
2. In Window A (customer), open DevTools → Network tab.
3. Click on Window B (or any other window) so Window A loses focus.
4. After ~5-10 seconds, check Window A's Network tab. There should be NO `fetchMessagesAfter` requests firing while it's hidden.
5. The polling tick still runs (setTimeout fires) but the request is skipped via the Page Visibility API check.

**Resume + immediate catch-up**
6. While Window A is in the background, switch to Window B and send 2-3 messages.
7. Click back to Window A (give it focus). Within ~1 second:
   - The Visibility API fires `visibilitychange`
   - The hook immediately fetches without waiting for the next 5s tick
   - All 2-3 missed messages appear at once in the thread
8. Verify in Network: a single fetch request resolves with multiple messages in the response.

**Polling resumes on focus**
9. After the catch-up fetch, normal 5s polling resumes. Verify in Network that requests fire every ~5s.

### T14-D — Lifecycle transitions write system messages

**Setup**
1. Use the booking from T14-B/C. Status: CONFIRMED. Both windows still open.

**Trip start (host)**
2. In the host view, click **Start Rental**. Status → ONGOING.
3. Within 5s, both windows show a new system pill in the chat: *"Trip started by host · [date], [time]"*.
4. Format: e.g. *"Trip started by host · May 4, 3:42 PM"*.

**Trip start (admin variant)**
5. Set up another fresh booking, walk to CONFIRMED. As admin, click **Start Rental** on `/bookings/[id]`.
6. The system message reads *"Trip started by admin · …"* (different prefix from host-triggered).
7. Both customer + host views see the message within 5s.

**Trip complete (host)**
8. Booking from step 2-3 is now ONGOING. Host clicks **Complete Rental**. Status → COMPLETED.
9. New system pill appears: *"Trip completed by host · [date], [time]. Chat closes in 48h."*.
10. Below the input area, a small amber **"Closes in 47h 59m"** countdown badge appears next to the character counter.

**Trip complete (admin variant)**
11. Same as step 5-6 but on a fresh booking via admin. System message: *"Trip completed by admin · …. Chat closes in 48h."*.

**Cancellation mid-trip (admin)**
12. Set up another fresh booking, walk to CONFIRMED. As admin, click **Cancel** with reason "Vehicle unavailable".
13. The chat thread gets a final system pill: *"Booking cancelled by admin · reason: Vehicle unavailable. Chat is now closed."*.
14. The input area is removed; replaced by a muted banner: *"This chat is closed because the booking was cancelled."*
15. Verify NO new messages can be sent. Send button absent.

**Mark paid (admin)**
16. On a COMPLETED booking that's still within grace, as admin click **Mark as Paid**.
17. Chat gets a system pill: *"Payment received (cash) · marked paid by admin"* (with optional notes appended if you typed any).

**Activity log entries are still being written too**
18. As admin, refresh `/dashboard`. The recent activity feed shows the corresponding `BOOKING_*` / `HOST_BOOKING_*` entries.
19. Activity log and chat system messages are independent — both should fire on every transition.

### T14-E — 48h grace period and read-only state

**Setup**
1. You'll need a COMPLETED booking. Use one from T14-D or fresh.
2. To test the grace expiration without waiting 48h, modify `Booking.rentalCompletedAt` in Prisma Studio to a timestamp 49+ hours in the past on a COMPLETED booking.

**Within grace (active)**
3. Open the booking detail. Chat panel renders normally with input.
4. The amber **"Closes in Xh Ym"** countdown badge is visible near the character counter.
5. Send a message. Works as expected (e.g. *"Hey, I left my phone charger in the cup holder!"*).
6. The other party receives within 5s.

**Past grace (read-only)**
7. After the grace expires (or after the Prisma Studio backdating from step 2):
8. Reload the page. Input area is gone. Replaced by muted banner: *"This chat is now closed. History stays visible. For trip issues, contact support."*
9. The full thread (including all user messages + system pills) is still readable, scrollable.
10. Verify in DevTools: the polling tick still runs while the panel is mounted, but the chat is read-only (server `sendMessageAction` would reject if forced).
11. *(Advanced bypass)* Try to call `sendMessageAction` via DevTools console with the bookingId and a message body. Server returns: **"This chat is no longer accepting new messages."**

**Restore grace by setting rentalCompletedAt to recent**
12. In Prisma Studio, set `rentalCompletedAt` to "now" on the same booking.
13. Reload. Chat is active again with countdown showing ~48h. Confirms `getChatState` is purely a function of status + grace + now.

### T14-F — Past-trips link

**Setup**
1. Same customer + host pair must have at least one COMPLETED booking from prior tests, plus a current ACTIVE/CONFIRMED booking.
2. If you don't have a COMPLETED prior booking with the same pair, walk one through the lifecycle quickly.

**Customer view shows the link**
3. Open `/account/bookings/[id]` for a current booking with the same host. The chat panel header should now have an extra row:
   *"You've rented from this host **N×** before — view past trips"* (where N is the count of prior COMPLETED bookings with the same host, excluding the current one).
4. The text "view past trips" is a link in primary color. Hover underlines it.
5. Click. Browser navigates to `/account?priorHost=[ownerId]`.
6. *(Note: the filter param isn't read by /account in V1 — clicking just lands on the customer's full bookings list. The link is informational + lightweight navigation. Filter implementation is a polish item for later.)*

**Host view shows the mirrored link**
7. Open `/host/bookings/[id]` for the same current booking. Header subtitle includes:
   *"You've rented to this customer **N×** before — view past trips"*.
8. Click. Lands on `/host/bookings?priorCustomer=[customerId]`.

**No prior trips → no link**
9. Set up a fresh customer + host pair with no shared history. Open the new booking's detail page.
10. The chat panel header subtitle should NOT show the past-trips link (priorTripCount is 0).

**Excludes the current booking from the count**
11. The link only appears for prior COMPLETED bookings between the same pair, NOT the current booking itself.
12. If a customer has 1 current booking + 0 past with this host, no link.
13. If 1 current + 1 past COMPLETED, link reads "1× before".

### T14-G — Permission & ownership scope

**Setup**
1. Two customers (Customer A + Customer B) and at least one booking belonging to Customer A.

**Customer B forge attempt**
2. Note the booking id of Customer A's booking from the URL.
3. Log in as Customer B. Open DevTools → Console.
4. Manually call `sendMessageAction` against Customer A's bookingId with any body.
5. Server returns: **"You can only message bookings you're part of."**
6. Verify in Prisma Studio: no Message row created for that booking with Customer B's id.

**Customer B reading attempt**
7. As Customer B, navigate directly to `/account/bookings/[Customer-A's-booking-id]`.
8. Page should serve a **404 / Not Found** (existing customer-side ownership check).
9. *(Action-level)* Manually call `fetchMessagesAfterAction` with Customer A's bookingId. Server returns: *"You can only view chats you're part of."* (admin/customer/host-on-booking gate).

**Host clicks send on a non-owned booking**
10. Same forge attempt as a different host. Server returns: *"You can only message bookings you're part of."*
11. Page level: `/host/bookings/[other-host's-booking-id]` returns 404 (existing Tier 6 check).

**Admin can read but not send**
12. As admin, open `/bookings/[any-booking]`. Chat renders read-only.
13. The textarea is NOT rendered.
14. *(Forge)* Manually call `sendMessageAction` while authed as admin. Server returns: *"Only customers or hosts on the booking can send messages."* (admin emails resolve to neither customer nor host in `resolveChatSender`).

**Logged-out poll attempt**
15. Log out completely. Manually call `fetchMessagesAfterAction` via DevTools.
16. Server returns: *"Not authenticated."*

### T14-H — Edge cases + visual polish

**Empty thread state**
1. The "Booking confirmed by..." system message is auto-injected, so a fresh CONFIRMED booking always has at least one row in the thread. The "No messages yet. Say hello." empty state should rarely appear in practice — it would only show on a CONFIRMED booking that somehow had its system messages deleted. Still, verify the copy renders correctly if you delete the system rows in Prisma Studio.

**Long messages don't break layout**
2. Send a message with a very long single word (no spaces): e.g. `"supercalifragilisticexpialidociousxxxxxxxxxxxxxxx"`. Bubble should wrap with `break-words` instead of overflowing.
3. Send a normal message with multiple paragraphs (Shift+Enter between them). All paragraphs render in the same bubble with line-break preservation.

**Mobile width**
4. Resize browser to mobile width (~375px).
5. Bubbles take up appropriate width (max-w-[85%]).
6. Header / system messages / input area all readable.
7. Send button doesn't overlap textarea.

**Auto-scroll on new message**
8. Scroll up in a long thread. Send a new message.
9. The list should auto-scroll to the bottom to show your just-sent message.

**Send-failure handling**
10. With the chat active, set DevTools network throttling to **Offline**.
11. Type a message and send.
12. Optimistic message appears on your side instantly.
13. After the request fails, an inline red error appears below the input: e.g. *"You can only message bookings you're part of."* or a generic network error message.
14. The optimistic row remains visible (a known polish gap — refining is a future polish item).
15. Disable throttling, click Send again with a different message. Works normally.

**Concurrent sends from both sides**
16. With both windows open as customer + host, send messages from both within ~1s of each other.
17. Both sides see both messages within ~5s. No duplication. No overwrites. Server orders by `createdAt`.

**Refresh recovers state**
18. After active conversation, hard refresh either window. The server-rendered initial batch loads the full thread. Polling resumes from the latest id.

---

## Tier 15 — Fleet operators + linking

Splits the Owner role into two kinds: independent owners (existing behavior) and fleet operators (registered car rental companies). Adds a fleet directory at `/fleets`, a dual-host onboarding flow at `/signup`, owner-initiated link requests on `/host/cars/[id]/edit`, fleet-side approve/reject on the host dashboard, and "managed by X" labels on listing cards + listing detail. Booking authority and chat counterparty are unchanged in Tier 15 — those route to the fleet in Tier 16.

### Prerequisites

- All Tier 14 prerequisites
- Admin account that can verify owner accounts
- For full coverage you'll create at least one INDIVIDUAL owner and at least one FLEET operator during testing

### T15-A — Two-button host signup screen

**Setup**
1. Run `npm run dev`. Open `/signup` in incognito (logged out).

**Initial render**
2. Page shows two cards side-by-side: "Host Sign-up" on the left and "Customer Sign-up" on the right.
3. Inside the Host card you should NOT see the regular name/email/password form initially. Instead: a "Tell us a bit about yourself." prompt with two large stacked buttons:
   - **Independent Car Owner** with caption *"I have my own car and want to rent it out myself..."*
   - **Registered Car Rental Operator** with caption *"I run a rental company and want to manage cars on behalf of multiple owners..."*
4. Customer card on the right is unchanged from prior tiers.

**Pick Independent — minimal form**
5. Click the **Independent Car Owner** button.
6. The card flips to a small "Independent Car Owner" pill + a "Change account type" link at the top, then the regular signup form appears (Full Name, Email, Password).
7. Fill in test data, e.g. `Joe Independent`, `joe-individual@test.com`, `Test1234!`. Click **Create Host Account**.
8. Server creates the Owner row with `kind=INDIVIDUAL`, `companyName=null`, `businessRegNumber=null`, `status=PENDING`. Verify in Prisma Studio.
9. You're redirected to `/login?signedUp=host`.

**Pick Fleet — extended form**
10. Open `/signup` again. Click **Registered Car Rental Operator**.
11. The card now shows a tertiary-color "Registered Car Rental Operator" pill + the form, with THREE additional required fields at the top: **Company Name**, **Business Registration Number**, and **Service Area**.
12. The Service Area input has placeholder *"e.g. Makati · BGC · Metro Manila"* and a helper line beneath: *"Public — independent owners use this to pick a fleet near their car..."*
13. The "Full Name" label changes to **"Contact Person — Full Name"** to disambiguate the company from the human contact.
14. Fill in: `Acme Rentals Inc.`, `DTI-ABC-12345`, `Makati · BGC`, `Maria Santos`, `acme-fleet@test.com`, `Test1234!`. Click **Create Fleet Account**.
15. Server creates the Owner row with `kind=FLEET`, `companyName="Acme Rentals Inc."`, `businessRegNumber="DTI-ABC-12345"`, `serviceArea="Makati · BGC"`, `status=PENDING`. Verify in Prisma Studio.
16. Redirected to `/login?signedUp=fleet`.

**Switch back from kind selection**
16. Open `/signup`. Click Independent. Click "Change account type" link at the top. Form clears, two-button screen returns.
17. Pick the other option. New form renders.

**Customer signup unchanged (regression)**
18. Click into the Customer card. Form is the basic name/email/password — no kind buttons. Submit. Customer row created. No `kind` field. Standard flow.

**Validation: fleet missing required fields**
19. Pick Fleet. Submit with empty Company Name. Server should reject with: *"Fleet operators must provide a company name and business registration number."*
20. Same for empty Business Registration Number.
21. Fill Company Name + Business Reg Number, but leave Service Area empty. Server rejects with: *"Fleet operators must provide a service area so independent owners can find you."*

**Email collision check (regression)**
22. Try to sign up an Individual with the same email as the fleet account from step 14. Server rejects: *"An account with this email already exists."* (existing collision guard, unchanged).

### T15-B — Admin verifies the new fleet account

**Setup**
1. Log in as admin. Navigate to `/owners`.

**Pending fleet shows in queue**
2. The owners directory should show your newly-signed-up fleet (e.g. `Acme Rentals Inc.`) with status PENDING.
3. The owner's name displays — for FLEET kind, the page may render `companyName` or `fullName` depending on the column (existing UI doesn't yet render the kind label; that's a polish item for a future tier).

**Approve the fleet**
4. Click the fleet's row → `/owners/[id]`. Use **Verify** action to flip status PENDING → VERIFIED.
5. Activity log entry: `OWNER_VERIFIED` with the company name in the description.
6. Verify in Prisma Studio: `Owner.status = VERIFIED, kind = FLEET`.

**Repeat for the individual**
7. Same flow for the INDIVIDUAL owner from T15-A. Status → VERIFIED.

### T15-C — Fleet directory at /fleets + extended /hosts/[id] profile

**Setup**
1. Have at least one VERIFIED FLEET owner from T15-B. Log out (test as guest).

**Directory page renders**
2. Navigate to `/fleets`. Header + page render.
3. Heading: **"Fleet operators"**. Subtitle explains the program.
4. Below: a grid of fleet operator cards. Each card shows: avatar with initials, "VERIFIED OPERATOR" eyebrow, company name, **service area line** with a MapPin icon in primary color (e.g. *"📍 Makati · BGC"* — only renders when `serviceArea` is set), "Member since [Month Year]", car count, optional bio (only after they fill it on `/host/profile`).
5. Cards are linked — clicking navigates to `/hosts/[fleet-id]`.

**Empty state**
6. If no verified fleets exist (e.g. fresh DB), the page shows a centered card with a Building icon and copy *"No fleet operators yet"*.

**Public host profile — INDIVIDUAL kind (regression)**
7. Navigate to `/hosts/[an-individual-host-id]` from any prior test data.
8. Header reads "Verified Host" (not "Verified Fleet Operator"). Display name = `fullName`.
9. Listings grid heading: **"Listings (N)"** — only owned cars (existing T11 behavior preserved).
10. Bio (if set) renders without an "About this company" header.

**Public host profile — FLEET kind**
11. Navigate to `/hosts/[fleet-id]`.
12. Header eyebrow: **"Verified Fleet Operator"**.
13. Header name = `companyName` (e.g. `Acme Rentals Inc.`), NOT the contact person's full name.
14. Below the company name (above member-since): a **service area line** in primary color with a small MapPin icon (e.g. *"📍 Makati · BGC"*). Renders only when `serviceArea` is set.
15. Member-since line ends with **"· Operator account"**.
16. If the fleet has a bio set (`/host/profile`), it renders under an **"About this company"** heading instead of the plain bio block individuals get.
17. Listings grid heading: **"Cars under management (N)"** (different from individual's "Listings").
18. Initially, before any cars are linked, this fleet's grid shows their own owned cars (likely 0 if you haven't created any). Empty state copy uses `companyName` instead of first name.

**Browser tab title**
18. Verified individual: tab title `[Full Name] | DriveXP Host`.
19. Verified fleet: tab title `[Company Name] | DriveXP Fleet Operator`.

### T15-D — Owner-initiated link request flow

**Setup**
1. Log in as an INDIVIDUAL host (verified). They should have at least one car listing (any status — PENDING_APPROVAL is fine for testing the link UI).
2. Navigate to `/host/cars/[id]/edit`.

**Section renders for INDIVIDUAL host**
3. Scroll to the bottom. After the existing photo / OR-CR / availability sections you should see a new card titled **"Manage with a fleet operator (optional)"** (or similar).
4. Description explains the program. CTA button: **"Browse fleet operators"** (with a chevron).
5. Click the CTA. The card flips to a "Request fleet management" form with:
   - A fleet picker (dropdown) listing all VERIFIED FLEETs
   - A "Proposed management fee (%)" optional number input
   - A **Send request** button (disabled until a fleet is selected)
   - A **Cancel** button to flip back to the initial state

**Pick a fleet + submit**
6. Open the dropdown. Each option shows the company name on the first line and (if `serviceArea` is set) a **service area line** with a primary-color MapPin icon underneath the name (e.g. *"📍 Makati · BGC"*). Bio (if any) renders below that.
7. Pick a fleet from the dropdown. Below the dropdown, two helper rows appear: a **service area row** (primary color with MapPin: *"Service area: Makati · BGC"*) and a **"View [Fleet] profile →"** link to the public profile.
8. Optionally fill in the fee (e.g. `15`). Click **Send request**.
9. The card refreshes to show the new state: **"Awaiting response from [Fleet Name]"** with the proposed fee shown and a **Cancel request** button.
10. Verify in Prisma Studio: a new `FleetCarLink` row exists with `status = PENDING`, the right `listingId`, `fleetId`, `managementFeePercent`, and `requestedAt = now`.

**Activity log entry**
9. Log in as admin → `/dashboard`. Recent activity feed has a new `FLEET_LINK_REQUESTED` row: *"Owner [email] requested [Fleet Name] to manage [Brand Model] (plate)"*.

**Cancel pending request**
10. Back on the host edit page (still on the pending state). Click **Cancel request**.
11. Card flips back to the initial "Manage with a fleet operator" state.
12. Verify in Prisma Studio: the FleetCarLink row's `status = INACTIVE`, `severedAt` is set.
13. Activity log: `FLEET_LINK_CANCELLED` entry.

**Block stacked requests**
14. Send another request to the same fleet. Edit page reflects pending state.
15. Try to forge a second pending request via DevTools (call `requestLinkAction` again). Server should reject with: *"You already have a pending request for this car."*

**FLEET host doesn't see this section**
16. Log out. Log in as a verified FLEET owner. Create a car listing as a fleet (the fleet can own cars too — they don't need to link to themselves).
17. Navigate to `/host/cars/[the-fleet-owned-car-id]/edit`. The fleet-link section should NOT appear (only INDIVIDUAL hosts see it).

### T15-E — Fleet approves / rejects requests on dashboard

**Setup**
1. Have a PENDING `FleetCarLink` row from T15-D. Log out from the individual.
2. Log in as the fleet operator (the one the request was sent to).

**Dashboard shows the pending request**
3. Land on `/host/dashboard`.
4. Welcome line shows the fleet's company name first name (e.g. "Welcome, Acme").
5. Tile labels are FLEET-flavored:
   - First tile: **"Cars Under Management"** (instead of "Active Listings"), value = owned + linked count, sub = "Owned + N linked"
   - Other tiles: Upcoming Bookings + Total Earnings (unchanged).
6. Below the tiles, a new section: **"Incoming link requests"** with subtitle "N pending".
7. Each pending row shows:
   - Year + plate number eyebrow
   - Brand + Model
   - "Requested by [Owner Name]" with link to `/hosts/[owner-id]`
   - Date + optional fee
   - **Approve** + **Reject** buttons on the right

**Approve flow**
8. Click **Approve**. Button shows "Approving..." briefly. Page refreshes.
9. The pending row disappears.
10. Verify in Prisma Studio: FleetCarLink `status=ACTIVE`, `respondedAt=now`.
11. Activity log: `FLEET_LINK_APPROVED` entry.

**Reject flow (separate request)**
12. Send another link request from the individual side (different car). Refresh the fleet's dashboard.
13. Click **Reject** on the new pending row. Page refreshes.
14. Verify in Prisma Studio: FleetCarLink `status=INACTIVE`, `respondedAt + severedAt = now`.
15. Activity log: `FLEET_LINK_REJECTED` entry.

**Empty state**
16. With no pending requests, the section shows **"No incoming requests right now"** with helper copy + a link to `/fleets`.

**INDIVIDUAL dashboard regression**
17. Log out. Log in as the individual host. Their dashboard should NOT show the "Incoming link requests" section. (Only FLEET kind sees it.)
18. If the individual has 1+ pending outgoing requests, they may see a small amber banner pointing to `/host/cars`. Verify this state.

### T15-F — Owner / fleet sever an active link

**Setup**
1. Have an ACTIVE `FleetCarLink` between an individual and a fleet (from T15-E approve flow).

**Owner severs from car edit page**
2. Log in as the individual host. Navigate to `/host/cars/[that-car-id]/edit`.
3. The fleet-link section now shows the **"Managed by [Fleet]"** state with:
   - Fleet name as a link to `/hosts/[fleet-id]`
   - Agreed management fee (if any)
   - "Active since" date
   - **Sever link** button (destructive red)
4. Click **Sever link**. Card flips back to the initial "Manage with a fleet operator (optional)" state.
5. Verify in Prisma Studio: FleetCarLink `status=INACTIVE`, `severedAt=now`.
6. Activity log: `FLEET_LINK_SEVERED` entry — describes who severed (Owner or Fleet).

**Fleet severs from their dashboard / cars page**
7. Set up a fresh ACTIVE link.
8. Log in as the fleet. Navigate to `/host/cars`. *(Note: in V1 the cars list might not show a sever button directly — the fleet can sever via `/host/cars/[id]/edit` once we add it for fleets, or via the API. Verify the action works server-side.)*
9. Forge a `severLinkAction` call as the fleet against the active link's id (DevTools).
10. Server allows it (fleet has authority). Status flips to INACTIVE.
11. Activity log entry shows "Fleet [email] severed the link..."

### T15-G — Public-facing "managed by X" labels

**Setup**
1. Have at least one ACTIVE FleetCarLink on a listing whose status is ACTIVE. (Walk a fresh listing through admin approval if needed.)
2. Log out (or any viewer role).

**Listing card label on /listings**
3. Navigate to `/listings`. Find the card for the fleet-managed car.
4. Below the title row (year · type · location), there should be a new line in primary color with a Building icon: **"Managed by [Fleet Name]"**.
5. Cards for non-managed listings should NOT show this line.

**Listing detail Owner card**
6. Click into the fleet-managed listing. `/listings/[id]` page renders.
7. Scroll to the Owner card.
8. The owner's name is the link as before. Below the name, in muted text: **"Managed by [Fleet Name]"** with the fleet name as a primary-color link to `/hosts/[fleet-id]`.
9. Click the fleet name. Lands on the fleet's public profile.

**Cards on /account/favorites + /hosts/[id]**
10. As a customer, favorite the fleet-managed listing.
11. Navigate to `/account/favorites`. The card shows the same "Managed by" label.
12. Navigate to `/hosts/[individual-owner-id]`. Their listings include this car (since they own it) — the card on their profile shows "Managed by [Fleet]".
13. Navigate to `/hosts/[fleet-id]`. Their "Cars under management" grid includes this car too. The card here also shows "Managed by [Fleet]" — slightly redundant on the fleet's own profile, but consistent.

**Sever the link → label disappears**
14. Sever the link (T15-F flow). Refresh the listings page.
15. The "Managed by" line is gone from the card and from the listing detail Owner card.

### T15-H — Landing page CTAs for fleet operators

**Setup**
1. Open `/` in incognito.

**Header nav**
2. The top nav (between logo and right-side actions) should now include a "For Operators" link between "Browse Cars" and "How It Works".
3. Click it. Page scrolls smoothly to the new `#fleet-operator-journey` section.

**Hero pill below the two big CTAs**
4. Scroll back to the hero. Below the two large buttons (Browse Cars + Become a Host) you should see a smaller text link: *"Run a fleet? See operator program →"*.
5. Click it. Same scroll-to-section behavior.

**Dedicated section content**
6. The `#fleet-operator-journey` section renders with:
   - "For Fleet Operators" tertiary-color pill at the top
   - Headline: **"Run a rental company? Aggregate owners under your management."**
   - 4-step walkthrough (Sign up → Get listed in directory → Approve link requests → Manage bookings)
   - Two CTAs: **"Sign up as an operator"** linking to `/signup#host` + **"Browse existing operators"** linking to `/fleets`
   - On the right: a "Why operators link with DriveXP" card with 4 value props

**Footer**
7. Scroll to the footer. Under the "Platform" column you should see new links: **"For Operators"** and **"Fleet Directory"**.
8. Click "For Operators" → scrolls to the new section.
9. Click "Fleet Directory" → navigates to `/fleets`.

**All viewer roles see the CTAs**
10. Log in as a customer. Visit `/`. The hero pill + header link + section + footer links should all still render. (No role-conditional hiding in V1.)
11. Same for admin and host viewers.

### T15-I — Permission & edge cases

**Setup**
1. Have one INDIVIDUAL host, one VERIFIED FLEET, one PENDING FLEET (not yet verified by admin), one SUSPENDED FLEET (admin flipped status).

**Pending fleet doesn't appear in directory**
2. Visit `/fleets`. Only VERIFIED fleets show. Pending and suspended ones absent.

**Pending fleet's profile is 404**
3. Direct URL `/hosts/[pending-fleet-id]`. Returns 404 (Tier 11 guard preserved).

**Owner can't request a link to a non-VERIFIED fleet**
4. *(Forge.)* As an INDIVIDUAL host, manually call `requestLinkAction` with the PENDING fleet's id. Server rejects: *"Selected fleet operator is not verified yet."*

**Fleet can't approve while their own status is not VERIFIED**
5. As the PENDING fleet, forge an `approveLinkAction` against any pending request directed at them.
6. Server rejects: *"Your fleet account must be verified before approving requests."*

**Fleet can only act on requests directed to them**
7. Set up two fleets (Fleet A + Fleet B) and a pending request for Fleet A.
8. As Fleet B, forge `approveLinkAction` against Fleet A's pending link.
9. Server rejects: *"This request isn't for your fleet."*

**Owner can only sever / cancel links on their own cars**
10. *(Forge.)* As Individual A, call `severLinkAction` against an active link belonging to Individual B's car.
11. Server rejects: *"Only the car's owner or the managing fleet can sever this link."*

**FLEET can't request a link to another fleet (Tier 15 prevents chains)**
12. As a verified FLEET, forge a `requestLinkAction` to manage one of their cars under another fleet.
13. Server rejects: *"Only independent car owners can request fleet management."*

**Two-fleets-on-one-car prevention**
14. Have an ACTIVE link on a car. As the same individual, forge a new `requestLinkAction` to a different fleet.
15. Server rejects: *"This car is already managed by a fleet. Sever the active link first."*

**Application-level unique-active-link constraint**
16. *(DB-level forge.)* In Prisma Studio, manually create two ACTIVE FleetCarLink rows for the same listingId. Save succeeds at the DB level (no partial unique index in Prisma schema — application enforces).
17. Refresh the host edit page. The fleet-link section may render unexpectedly. The application-layer guard inside `approveLinkAction` is what normally prevents this; manual DB tampering is out of scope.
18. Cleanup: delete the duplicate Prisma Studio row.

**Activity log entries are auditable**
19. Confirm all five FLEET_LINK_* action codes have written entries during your testing:
    - `FLEET_LINK_REQUESTED`
    - `FLEET_LINK_CANCELLED`
    - `FLEET_LINK_APPROVED`
    - `FLEET_LINK_REJECTED`
    - `FLEET_LINK_SEVERED`

---

## Tier 16 — Fleet routing + parallel availability

Bookings on cars under an ACTIVE FleetCarLink now route to the fleet — they own confirm / start / complete / reject and the chat counterparty switches to the fleet. The individual owner sees the booking informational and the chat read-only. Availability rules + exceptions are editable by both parties (owner and fleet); each exception records who created it and the row renders "blocked by [name]".

### Prerequisites

- Four accounts:
  - **Individual host** — VERIFIED, owns at least two cars (Car A, Car B)
  - **Fleet operator** — VERIFIED, kind=FLEET (set via signup → Registered Car Rental Operator)
  - **Customer** — for booking flows
  - **Admin** — for cancel / mark-paid actions
- Tier 15 link in place: Car A is linked to the Fleet operator with status=ACTIVE. Car B is unlinked (still owner-managed).
- One PENDING booking on Car A from the customer. One PENDING booking on Car B from the customer.

### T16-A — Booking authority routing (fleet acts on linked car)

**Setup**
1. Log in as the Fleet operator.

**Fleet sees linked-car bookings on /host/bookings**
2. Visit `/host/bookings`. The PENDING booking on Car A appears in the list (alongside any of the fleet's directly-owned car bookings, if any). Search and status filters all work as before.
3. The Car B booking is NOT in the list (no link, fleet has no authority).

**Fleet can confirm / start / complete on linked car**
4. Click the Car A booking → `/host/bookings/[id]`.
5. Confirm/Reject buttons render at the top. Click **Accept Booking**. Status flips to CONFIRMED. Activity log entry written with action `FLEET_BOOKING_CONFIRMED`.
6. The system message at the top of the chat reads "Booking confirmed by [Fleet's company name]." (not "by host").
7. Click **Start Rental** → status → ONGOING. Activity log: `FLEET_BOOKING_STARTED`. System message: "Trip started by [Fleet] · [date]".
8. Click **Complete Rental** → status → COMPLETED. Activity log: `FLEET_BOOKING_COMPLETED`. System message: "Trip completed by [Fleet] · [date]. Chat closes in 48h."

**Fleet can reject a pending booking on a linked car**
9. With a fresh PENDING booking on Car A, click **Reject**. Pick a reason (e.g. "vehicle_unavailable"). Click **Reject Booking**.
10. Status → REJECTED. Activity log: `FLEET_BOOKING_REJECTED`.

### T16-B — Individual owner sees fleet-managed booking informationally

**Setup**
1. With a fresh PENDING booking on Car A (re-create one as the customer if needed), log in as the Individual host.

**No action buttons on managed bookings**
2. Visit `/host/bookings`. Car A's booking appears in the list with a "Managed by [Fleet name]" amber pill under the car name.
3. Click into `/host/bookings/[id]`.
4. The action region shows a dashed-border "Managed by [Fleet name]" panel — no Confirm/Reject/Start/Complete buttons render.

**Forge attempt is rejected at the action layer**
5. *(Forge.)* As the individual, manually call `hostConfirmBookingAction` against Car A's booking. Server rejects: *"This booking is managed by [Fleet]. They control confirm / start / complete actions."*

**Individual still sees own (unmanaged) bookings actionably**
6. Visit Car B's booking detail. Confirm/Reject buttons render (no fleet link → owner-direct authority).

### T16-C — Chat counterparty switch

**Setup**
1. With Car A in CONFIRMED state (from T16-A step 5), open three browser windows: Customer, Individual host, Fleet operator. Each visits the booking detail.

**Fleet writes; individual is read-only**
2. As the Fleet, send a message: "Hi, I'll meet you at pickup." It posts. Posts as `senderRole=host`.
3. As the Individual, the chat panel renders with a "Read-only" amber pill in the header and copy: "[Fleet] corresponds with the renter on your behalf. You can read the thread but not send messages." No textarea.
4. As the Customer, the message appears from "host" side. Customer types a reply → it posts.
5. As the Individual, refresh the page; both messages now visible (read-only).

**Forge: individual cannot send to a fleet-managed booking**
6. *(Forge.)* As the Individual, manually call `sendMessageAction(bookingId, "test")` for Car A's booking. Server rejects: *"You can only message bookings you're part of."* (the resolver intentionally rejects the individual when an active fleet link delegates host authority).

**Unmanaged bookings still let the individual write**
7. With Car B's booking now CONFIRMED, the Individual host opens its detail page. The chat panel renders normally (no read-only pill, textarea visible). Send a message → it posts as senderRole=host.

### T16-D — Availability authority extends to fleet

**Setup**
1. As the Fleet operator, visit `/host/cars`. Car A appears in the list with an amber "Managed" badge in the corner and "Owned by [Individual's name]" subtitle.

**Fleet edits weekly rules on a linked car**
2. Click Car A → `/host/cars/[id]/edit`. The page header reads "Manage [Brand] [Model]" (not "Edit"). A dashed banner explains "viewing as a fleet operator on an active management link". Photos, OR/CR, Edit Listing form, and Fleet-Link sections are HIDDEN. Only "Weekly Availability" + "Date-Specific Exceptions" sections render.
3. Toggle Tuesday off. Click **Save Schedule**. Activity log entry: `LISTING_AVAILABILITY_UPDATED · Fleet [email] ([Company]) updated weekly availability for listing [Car]`.

**Fleet adds a blocked exception**
4. Add an exception: pick a future date, choose "Block this date", reason "Maintenance". Click **Add**.
5. The new row appears in the list with text: "Blocked · Maintenance · blocked by [Company name]".
6. Activity log: `LISTING_EXCEPTION_ADDED · Fleet [email] ([Company]) added blocked exception on [date] for listing [Car]`.

**Individual + fleet authorship coexists; each row shows its author**
7. As the Individual host, visit `/host/cars/[CarA]/edit`. Add another blocked exception for a different date with reason "Personal trip". The row shows "blocked by [Individual's full name]".
8. Re-load — both exceptions visible to both parties, each labeled with its author.

**Either party can delete any exception**
9. As the Fleet, delete the Individual's "Personal trip" exception (click trash icon). Confirm it's removed. Activity log: `LISTING_EXCEPTION_REMOVED · Fleet [email] ...`.
10. As the Individual, delete the Fleet's "Maintenance" exception. Activity log: `LISTING_EXCEPTION_REMOVED · Host [email] ...`.

**Forge: non-owner non-fleet cannot edit availability**
11. *(Forge.)* Sign in as a third VERIFIED host (no relation to Car A). Manually call `addHostAvailabilityExceptionAction` against Car A's listing id. Server rejects: *"You cannot modify availability for a listing you don't manage."*

### T16-E — Page guards on edit + booking pages

**Fleet 404s on a non-linked car's edit page**
1. As the Fleet, visit `/host/cars/[CarB-id]/edit` (no link to fleet). The page returns 404.

**Fleet 404s on a non-linked booking detail**
2. As the Fleet, visit `/host/bookings/[CarB-booking-id]` directly. Returns 404.

**Individual still owns their direct car's edit page fully**
3. As the Individual, visit `/host/cars/[CarB-id]/edit`. All sections render (Edit Listing form, photos, OR/CR, availability, fleet-link section).

### T16-F — Activity log + audit trail completeness

After running T16-A through T16-D, in Prisma Studio's `ActivityLogEntry` table, confirm at least one row exists for each of these new Tier 16 action codes:
1. `FLEET_BOOKING_CONFIRMED`
2. `FLEET_BOOKING_STARTED`
3. `FLEET_BOOKING_COMPLETED`
4. `FLEET_BOOKING_REJECTED`

And at least one row each where `description` starts with `Fleet [email] ([Company])` (rather than `Host [email]`):
5. `LISTING_AVAILABILITY_UPDATED`
6. `LISTING_EXCEPTION_ADDED`
7. `LISTING_EXCEPTION_REMOVED`

In `CarAvailabilityException`:
8. New rows have `addedByOwnerId` populated (matching the actor that created them). Old rows from prior tiers still have null — UI tolerates that with no "added by" suffix.

---

## Tier 17 — Required-docs submission flow

Listing creation now goes through a 3-step wizard: basics → photos → OR/CR. New listings start as `DRAFT` and only flip to `PENDING_APPROVAL` via an explicit "Submit for Approval" CTA gated on photos.length ≥ 1 AND OR/CR present. Existing PENDING_APPROVAL listings without OR/CR are grandfathered (admin can still approve them under prior rules).

### Prerequisites

- Three accounts:
  - **Verified host** — VERIFIED owner who can create listings (clean state — no in-flight DRAFT)
  - **Admin** — to verify queue + approval flow
  - One legacy `PENDING_APPROVAL` listing already in the DB without an OR/CR uploaded (created in a prior tier). If you don't have one, create it via Prisma Studio: insert a CarListing row with `status="Pending Approval"` and `orCrDocumentUrl=null`. (Quoted as the enum value, not the schema literal.)

### T17-A — Wizard happy path

**Setup**
1. Log in as the verified host. Visit `/host/cars`.

**Basics step**
2. Click **Add Listing** → land on `/host/cars/new`.
3. Page header explains "Three quick steps". A 3-step indicator renders above the form: Basics (current/blue), Photos (gray), OR/CR (gray).
4. Bottom button reads **Continue to Photos** (NOT "Submit for Approval").
5. Fill basics (plate, year, brand, model, color, location, transmission, fuel type, vehicle type, seating, daily price, optional description + features). Click **Continue to Photos**.
6. Redirected to `/host/cars/[id]/edit`. Status badge reads "Draft". Header subtext says "Draft in progress — finish photos and OR/CR, then submit for admin approval."
7. Step indicator now shows: Basics ✓ (green check), Photos (current/blue), OR/CR (gray).
8. Sticky CTA at bottom of page reads "Add at least one photo and the OR/CR document to submit". Submit button is disabled.

**Photos step**
9. Upload one photo via the photo gallery section. Step indicator updates: Photos ✓ (green check); current step advances to OR/CR.
10. Sticky CTA copy updates to "Add the OR/CR document to submit". Photos pill in CTA shows ✓.

**OR/CR step**
11. Upload an OR/CR file (image or PDF). Step indicator updates: OR/CR ✓.
12. Sticky CTA copy updates to "Ready to submit for approval" with a green check icon. Submit button enabled.
13. Click **Submit for Approval**. Status flips DRAFT → PENDING_APPROVAL. Sticky footer disappears. Header subtext reads "Waiting on admin approval."
14. Activity log entry written: `LISTING_SUBMITTED_FOR_APPROVAL · Host [email] submitted listing [Brand Model] ([plate]) for admin approval`.

**Admin sees the full package**
15. Log in as admin. Visit `/dashboard`. Verification tile shows count incremented; the new listing appears in pending listings rollup.
16. Visit `/car-listings`. Filter to "Pending" — the new listing appears with photo, plate, owner. Click View → `/car-listings/[id]` shows photos, OR/CR document link, all basics. Approve.

### T17-B — Abandonment + resume

**Setup**
1. As the verified host, ensure you have NO existing DRAFT (clear via Prisma Studio if needed).

**Mid-wizard close**
2. Visit `/host/cars/new`. Fill basics. Click **Continue to Photos**.
3. Land on `/host/cars/[id]/edit` (DRAFT). Upload one photo. Don't upload OR/CR.
4. Close the tab without submitting.

**Resume via /host/cars/new**
5. Visit `/host/cars/new` again. You're immediately redirected to `/host/cars/[draft-id]/edit` — the existing DRAFT. (The page detects an in-flight DRAFT and avoids creating a duplicate.)
6. Step indicator: Basics ✓, Photos ✓, OR/CR (current). Sticky CTA disabled with "Add the OR/CR document to submit".

**Resume via /host/cars list**
7. Visit `/host/cars`. The DRAFT row appears in the grid with an amber "Continue setup" badge in place of the usual status badge.
8. Click the DRAFT card → land on `/host/cars/[id]/edit` with the same wizard scaffolding visible.
9. Upload OR/CR. Submit for Approval. Status flips to PENDING_APPROVAL.

### T17-C — Prerequisite gating (UI + action layer)

**UI gating**
1. As the host, create a fresh DRAFT (basics submitted, no photos, no OR/CR yet).
2. The Submit for Approval button in the sticky footer is disabled. Hover/inspect — copy reads "Add at least one photo and the OR/CR document to submit".
3. Upload only the OR/CR (no photo). Button stays disabled — copy reads "Add at least one photo to submit".
4. Remove the OR/CR; upload a photo. Button stays disabled — copy reads "Add the OR/CR document to submit".

**Action-layer gating (forge attempt)**
5. *(Forge.)* With the DRAFT in any incomplete state (e.g. no photos), manually call `submitListingForApprovalAction` against the DRAFT id. Server rejects: *"Add at least one photo before submitting for approval."* (or the OR/CR variant if photos exist but OR/CR doesn't).
6. *(Forge.)* Try to call the same action against a listing whose status is already `PENDING_APPROVAL` or `ACTIVE`. Server rejects: *"This listing is already \"…\" — only DRAFT listings can be submitted."*

### T17-D — Legacy listings grandfathered

**Setup**
1. As admin, visit `/car-listings` with the "Pending" filter active. The legacy PENDING_APPROVAL listing without OR/CR appears.

**Approval still works**
2. Open the legacy listing detail. The OR/CR section shows "no document on file" but other fields are filled.
3. Click Approve. Status flips PENDING_APPROVAL → ACTIVE under the existing rules — no new gating. (The new prereq check only fires on DRAFT → PENDING_APPROVAL. Once a listing reaches PENDING_APPROVAL by any path, admin approval is unchanged.)

### T17-E — DRAFT invisibility

DRAFT listings should NOT leak into any audience-facing or admin-queue surface. With one DRAFT in the DB owned by the verified host, confirm each:

1. **Public `/listings`** — DRAFT does NOT appear in the browse grid. Search + filters can't surface it.
2. **Public `/listings/[id]` direct URL** — pasting the DRAFT id into the URL returns 404 (`notFound`).
3. **Admin `/dashboard`** — Active Listings tile excludes DRAFT (already filtered to ACTIVE). Pending Approvals tile excludes DRAFT (already filtered to PENDING_APPROVAL). Verification queue excludes DRAFT.
4. **Admin `/car-listings`** — DRAFT does NOT appear in the table or summary counts. Clicking a status filter chip never lands on DRAFT.
5. **Admin `/car-listings/[id]` direct URL** — admin pasting the DRAFT id returns 404.
6. **Admin `/availability`** + **`/calendar`** — DRAFT does not appear in the listing list or filters (already filtered to ACTIVE/PENDING/BOOKED).
7. **Admin `/bookings/new`** — listing dropdown does not include DRAFT (already filtered to ACTIVE).
8. **Public `/hosts/[id]`** + **`/fleets`** — DRAFTs do not contribute to listing counts or grids (already filtered to ACTIVE).

The host themselves (on `/host/cars` and `/host/cars/[id]/edit`) is the only surface where a DRAFT is visible.

---

## Tier 18 — Sign in with Google

OAuth signup + login alongside the existing email/password flow. Google authenticates the user; the role-specific Owner/Customer row is captured on a `/signup/complete` page after the OAuth round trip. Implicit linking on shared email is allowed (Supabase default — same email across providers = same auth user). Wrong tab (login) and wrong card (signup) mirror the email/password tab-mismatch behavior already in `loginAction`/`signupAction`. Admins keep using email/password only.

### Prerequisites

- Three real Gmail accounts you can sign in to. The Google OAuth client is in **Testing** mode, so each Gmail must already be on the **Test users** list in Google Cloud Console → APIs & Services → OAuth consent screen → Audience.
- An existing **email/password customer** (e.g. `customer-1@email.com`) and existing **email/password host** (e.g. `host-2@email.com`) for the regression check in T18-F.
- Fresh `auth.users` rows for the test Gmails — if any of them already have an Owner/Customer row in Supabase from earlier testing, delete those rows first (Supabase → Authentication → Users → ⋮ → Delete user) so each T18-A/B/C run starts from "no record exists".
- For local testing: `npm run dev` running on `http://localhost:3000` with Docker Postgres up.

### T18-A — Customer signup via Google (new user)

**Setup**
1. Pick a Gmail that has no existing record in your local DB (`gmail-A@gmail.com` for the rest of this section).
2. Open `/signup` in a fresh browser / incognito window.

**Trigger**
3. On the **Customer Sign-up** card, click **Sign up with Google**. The button shows a Google logo and label.
4. You bounce to `accounts.google.com`, pick the Gmail, click through the consent screen.
5. You land on `/signup/complete?role=customer`. The page header reads **Finish your customer profile**, the badge says "Customer Account", and the email shown matches the Gmail you used.
6. **Full Name** is pre-filled from your Google profile. No company / business / service-area fields are visible (those only appear for FLEET).
7. Confirm or edit the name, click **Create Customer Account**.
8. You're redirected to `/account`. Logged in as that customer.

**Verify**
9. Supabase → Authentication → Users → the Gmail row exists with **Provider: Google** / Provider type: Social.
10. Prisma Studio → `Customer` table → a row exists with the Gmail and the full name you submitted. `contactNumber` is the empty string (matches email/password signup behavior).
11. No Owner row exists for that Gmail.

### T18-B — Independent Host signup via Google (new user)

**Setup**
1. Pick a different Gmail with no existing record (`gmail-B@gmail.com`).
2. Open `/signup` in a fresh browser / incognito window.

**Trigger**
3. On the **Host Sign-up** card, click the **Independent Car Owner** button.
4. The form panel appears. Click **Sign up with Google**.
5. Sign in via Google with `gmail-B@gmail.com`.
6. Land on `/signup/complete?role=host&kind=INDIVIDUAL`. Header reads **Finish your host profile**, badge says "Independent Car Owner".
7. **Full Name** is pre-filled. No company/business/service-area fields visible.
8. Click **Create Host Account**.
9. Redirected to `/host/dashboard`. The dashboard shows the "awaiting approval" / pending state because the new Owner row defaults to `OwnerStatus.PENDING`.

**Verify**
10. Prisma Studio → `Owner` table → row exists with Gmail, full name, `kind = INDIVIDUAL`, `status = "Pending Verification"`, `companyName = null`, `businessRegNumber = null`, `serviceArea = null`.
11. Supabase auth.users has the Gmail row with Provider = Google.
12. No Customer row for the same Gmail.

### T18-C — Fleet Host signup via Google (new user)

**Setup**
1. Pick a third unused Gmail (`gmail-C@gmail.com`).
2. Open `/signup` in a fresh browser / incognito window.

**Trigger**
3. On the **Host Sign-up** card, click the **Registered Car Rental Operator** button.
4. The form panel appears. Click **Sign up with Google**.
5. Sign in via Google with `gmail-C@gmail.com`.
6. Land on `/signup/complete?role=host&kind=FLEET`. Header reads **Finish your fleet operator profile**, badge says "Fleet Operator".
7. **Company Name**, **Business Registration Number**, and **Service Area** fields are visible and required. Full Name is pre-filled.

**Validation gating**
8. Leave Company Name empty, fill the other fields, click submit. Inline form error: *"Fleet operators must provide a company name and business registration number."*
9. Fill all fleet fields and submit again.
10. Redirected to `/host/dashboard` (pending state).

**Verify**
11. Prisma Studio → `Owner` table → row exists with `kind = FLEET`, `companyName`, `businessRegNumber`, and `serviceArea` populated; `status = "Pending Verification"`.

### T18-D — Login via Google (existing user, implicit linking)

This section verifies that an account previously signed up via email/password can later sign in via Google with the same email and land in the right place. Per the cross-cutting decision, Supabase merges identities on the same email by default — the existing role-row is preserved.

**Setup**
1. Sign up a fresh user via the existing email/password Customer card with email `gmail-D@gmail.com` and any password (`gmail-D` should be a real Gmail you own + an addable test user). After signup you're at `/login?signedUp=customer`. Don't log in yet.
2. Open `/login` and switch to the Customer tab.

**Login via Google**
3. Click **Continue with Google** and pick `gmail-D@gmail.com` (you've never signed in to this app via Google before, so Google may show the consent screen).
4. You land on `/account` — directly into the customer dashboard. **Not** on `/signup/complete`.

**Verify**
5. Supabase → Authentication → Users → click the `gmail-D@gmail.com` row → **Identities** section shows **two providers attached: `email` and `google`**. (One auth user; two identities.)
6. Prisma `Customer` table still has exactly one row for `gmail-D@gmail.com` (no duplicate created).

**Repeat for host**
7. Repeat steps 1–6 with a Gmail signed up as an Independent host. Step 4 lands on `/host/dashboard`. Step 5 same identity-merging behavior. Confirm a single Owner row, no duplicate.

### T18-E — Wrong tab / wrong card blocks

This section verifies that role-mismatch errors fire on Google flows the same way they do on email/password flows. Reuse the customer-account Gmail from T18-D as `gmail-D@gmail.com` (already a Customer in your DB).

**Wrong tab on login**
1. Open `/login` and switch to the **Host** tab (not Customer).
2. Click **Continue with Google** and sign in with `gmail-D@gmail.com`.
3. You're bounced back to `/login` with a red banner reading: *"This email is registered as a customer account. Please use the Customer tab."*
4. The Supabase session is **signed out** (no leftover cookie). Refreshing `/account` redirects to `/login`.

**Wrong card on signup**
5. Open `/signup` in a fresh window.
6. Click **Sign up with Google** on the **Host card → Independent Car Owner**.
7. Sign in with `gmail-D@gmail.com` (already a Customer).
8. Bounced to `/signup` with a red banner: *"This email is already registered as a customer. Please log in instead."*
9. No new Owner row was created.

**Same-role collision on signup**
10. From `/signup`, click **Sign up with Google** on the **Customer card** with `gmail-D@gmail.com`.
11. Bounced to `/signup` with: *"An account with this email already exists. Please log in instead."*

**Login with no account**
12. From `/login` Customer tab, click **Continue with Google** with a Gmail that has never signed up (`gmail-NEW@gmail.com`).
13. Bounced to `/login` with: *"No account found for that email. Please sign up first."*
14. Supabase auth.users may briefly show a `gmail-NEW@gmail.com` row — that's the OAuth artifact. Delete it before re-running the test.

### T18-F — Email/password regression (unchanged)

Quick sweep to confirm nothing in the existing email/password flow broke.

1. **Admin login** — log in as `admin@carbnb.com` via either tab with the existing password. Redirects to `/dashboard`. Top user menu shows admin.
2. **Existing host login** — log in as `host-2@email.com` (or whichever existing dummy host) via the Host tab. Redirects to `/host/dashboard`.
3. **Existing customer login** — log in as `customer-1@email.com` via the Customer tab. Redirects to `/account`.
4. **Tab mismatch on email/password** — try `customer-1@email.com` + correct password on the **Host tab**. Inline form error: *"This email is registered as a customer account. Please use the Customer tab."* (Wording matches today's behavior.)
5. **Email/password Independent host signup** — sign up `host-99@email.com` via Independent Host card with email/password. Lands at `/login?signedUp=host`.
6. **Email/password Fleet signup** — sign up `fleet-99@email.com` via Fleet card with email/password + company name + business reg + service area. Lands at `/login?signedUp=fleet`.
7. **Email/password Customer signup** — sign up `customer-99@email.com` via Customer card. Lands at `/login?signedUp=customer`.

If all 7 steps work, the email/password path is unaffected by the Tier 18 work.

---

## Tier 19 — Identity verification

Identity-document verification for both hosts and customers. Hosts upload ID + driver's license (Independent) or ID + business registration certificate (Fleet) from `/host/profile` and only surface in the admin verification queue once all required docs are present. Customers must upload government ID + driver's license at `/account/verification` and be admin-approved before they can create any booking. New schema columns are migrated with existing customers grandfathered to VERIFIED so prior bookings aren't disrupted.

### Prerequisites

- **`customer-documents` Supabase Storage bucket** must exist (private, no public access). Create via Supabase → Storage → New bucket if not done.
- One INDIVIDUAL host account (existing dummy works — `host-2@email.com`).
- One FLEET host account (existing dummy works — `acme-fleet@test.com` or similar).
- A fresh customer email you can use for full signup-to-verified flow.
- A couple of test images / PDFs under 5 MB each (any JPG / PNG / WebP / PDF).

### T19-A — Host (INDIVIDUAL) self-service upload + admin queue filter

**Host side**
1. Log in as an INDIVIDUAL host (e.g. `host-2@email.com`). Land on `/host/dashboard`.
2. Click **Profile** in the host nav → `/host/profile`.
3. New **Verification Documents** card renders above the bio form with two upload panels: **Valid Government ID** and **Driver's License**. Banner at top reads "Upload all documents to start verification."
4. Upload a test image / PDF (< 5 MB) under the ID panel. The "Not uploaded" pill flips to a green "Uploaded" pill; the banner stays amber ("Upload all documents...").
5. Upload another under the License panel. Banner flips to **"Documents submitted — awaiting review."**
6. Click **View current document** under each panel — opens the signed URL in a new tab (1-hour expiry). PDF should preview; images should display.

**Admin side — queue filter**
7. Log out, log in as `admin@carbnb.com`. Land on `/dashboard`.
8. The **Pending Approvals** tile counts only PENDING owners with all required docs uploaded. Verify this number matches the count of hosts that have completed step 5 (you may have to clear any other PENDING-but-no-docs hosts to confirm).
9. **Verification Queue** card on `/dashboard` lists up to 3 of these hosts as clickable cards.
10. Go to `/owners`. **X pending review** stat at top and the **Verification Queue** sidebar both reflect the same filter — hosts mid-upload don't appear.
11. Click into the host you uploaded as → `/owners/[id]` → Documents tab → both **Government ID** and **Driver's License** cards show as Uploaded with view links. The signed URLs work.

**File constraint sanity**
12. Back on `/host/profile`, try uploading a 6+ MB file or a `.txt` file. Inline error: "File is too large (5 MB max)." or "Only JPG, PNG, WebP, or PDF are allowed." No row update happens.

### T19-B — Host (FLEET) self-service upload (ID + Business Registration)

**Setup**
1. Log in as a FLEET host (e.g. `acme-fleet@test.com`). Go to `/host/profile`.

**Upload flow — Fleet variant**
2. The **Verification Documents** card now shows **Government ID** + **Business Registration** panels (NOT Driver's License). Copy adapts to fleet wording ("Upload a government ID for the contact person and your business registration certificate (DTI / SEC)...").
3. Upload an image / PDF for ID. Then upload one for Business Registration. Status banner flips to "Documents submitted — awaiting review."
4. The Driver's License panel is not rendered for this host — confirms the per-kind matrix from cross-cutting decision #7 (fleets skip license).

**Admin side**
5. Log in as admin → `/owners/[id]` for the FLEET host → Documents tab.
6. Card swap: **Government ID** + **Business Registration** cards (no Driver's License). Both with view links.
7. Go to `/owners/[id]/edit`. The admin upload form has the same ID + Business Registration panels (no license). Admin can replace either doc from here.

**Per-kind validation (server-side)**
8. From the browser dev console while logged in as the FLEET host, fire a form-POST to `uploadHostDocumentAction` with `docKind=license`. Inline error: "Driver's license is not required for fleet operators." (Or: trust the UI test in step 4 — there's no path to send a license upload from the Fleet UI.)

### T19-C — Customer signup → PENDING + verification banner

**Fresh signup**
1. Sign up a new customer via `/signup` → Customer card → email/password OR Google.
2. After signup land on `/account`.
3. Top of page: an amber **"Identity verification required to book"** banner with a **Verify your identity →** button. Banner is rendered BEFORE the "My Bookings" headline.
4. Header user menu now includes a **Verification** link to `/account/verification`.

**Listing detail — Reserve gate**
5. Open `/listings/[any active listing]` in a new tab while logged in as that customer.
6. The fixed bottom CTA reads **"Verify your identity to book"** (link, not button) instead of "Reserve Now". Click it → routes to `/account/verification`.
7. The Reserve dialog never opens for unverified customers.

**Server gate (defense in depth)**
8. Via dev tools, fire a manual POST to `createBookingAction` with valid listing + date params while customer status is PENDING. Action returns error: "You must verify your identity before booking. Please upload your ID and driver's license at /account/verification."

**Customers backfilled as VERIFIED (sanity)**
9. Log in as an existing seeded customer (e.g. `customer-1@email.com`). `/account` shows no banner. They keep the same Reserve UX as before — the Tier 19 migration grandfathered them.

### T19-D — Verification upload + admin verify + booking unlock

**Customer uploads**
1. Continuing as the new PENDING customer from T19-C, go to `/account/verification`.
2. Status banner reads "Upload both documents to start verification." Two empty upload panels.
3. Upload one doc. Banner unchanged. Upload the second. Banner flips to "Documents submitted — awaiting review."
4. Header user menu still works; navigation back to `/account` shows the SAME amber banner (the banner copy doesn't change between "no docs" and "docs uploaded, awaiting review" — both are PENDING status).

**Admin reviews + verifies**
5. Switch to admin. Go to `/customers`. New **Pending verification** summary tile shows count = customers with PENDING status who have both docs uploaded.
6. Click the **Pending** filter chip → directory filters to PENDING customers only. The new customer appears with status badge "Pending Verification".
7. Click into the customer → `/customers/[id]`. Top of page: status badge + four action buttons (**Verify**, **Reject**, **Suspend**, no **Re-verify** yet — it only shows when status = VERIFIED).
8. Below the header is the new **Identity Verification** card with both documents shown. Click each — signed URLs open the uploaded files.
9. Click **Verify**. Status badge flips to "Verified". Re-verify button now appears in place of Reject. Verify button is hidden.
10. Activity log entry recorded: "Admin admin@carbnb.com verified customer ..."

**Customer can now book**
11. Switch back to the customer. Refresh `/account`. **Banner is gone.**
12. Open a listing → fixed bottom CTA is now **Reserve Now**. Click → date dialog opens → pick dates → submit. Booking created successfully.
13. The booking lands at `/account/bookings/[id]` with status **Pending** (host-approval flow) OR **Confirmed** if `autoApproveVerifiedCustomers` is enabled (see T19-F).

### T19-E — Reject / Suspend / Flag-for-reverification transitions

**Reject + re-upload**
1. Admin → `/customers/[id]` for a PENDING customer with docs uploaded → click **Reject**. Status flips to "Rejected".
2. Customer side: `/account` shows a red "Verification rejected" banner with a **Re-upload documents** button.
3. Click the button → `/account/verification` shows a red rejection banner above the upload panels. Re-upload one doc.
4. Admin refreshes `/customers/[id]` — the **Re-verify** button is NOT available for REJECTED (only for VERIFIED), but the **Verify** button is. Click Verify. Customer now Verified.

**Suspend + reinstate**
5. Admin → for a VERIFIED customer → click **Suspend**. Status flips to "Suspended". Verify and Re-verify buttons disappear; Verify button reappears with label **Reinstate**.
6. Customer side: `/account` shows a red "Account suspended" banner. `/account/verification` shows a red suspended notice and HIDES the upload panels (can't upload while suspended).
7. Reserve button on listings is gone — replaced with the verify CTA.
8. Admin clicks **Reinstate** → customer flips to Verified. Customer side restores.

**Flag for re-verification (VERIFIED → PENDING)**
9. Admin → VERIFIED customer → click **Re-verify**. Status flips back to "Pending Verification".
10. Existing docs stay attached (DB columns not cleared). Customer can re-upload to replace from `/account/verification`.
11. Activity log records "Admin admin@carbnb.com flagged for re-verification customer ..."

**Reject button only on PENDING**
12. Confirm: the Reject button is hidden when status is anything other than PENDING. The transition matrix is enforced in `CustomerStatusActions`.

### T19-F — autoApproveVerifiedCustomers wiring + email/password regression

**autoApproveVerifiedCustomers OFF (default)**
1. Admin → `/settings`. Locate the **Auto-approve verified customers** toggle. Confirm it's OFF.
2. Log in as a VERIFIED customer. Create a booking. After redirect, the booking detail shows status **Pending** (host has to confirm). Matches behavior before Tier 19.

**autoApproveVerifiedCustomers ON**
3. Admin → `/settings` → toggle the setting ON → save. Setting persists across page refreshes.
4. Customer creates another booking on a different listing. After redirect, the booking detail shows status **Confirmed** — skipped the host approval step entirely.
5. Host side: the booking appears on the host dashboard but doesn't require their approval — it's already Confirmed.
6. Toggle the setting back OFF for the next test if desired.

**Email/password regression**
7. Log in as `admin@carbnb.com` via either tab with the existing password. Lands on `/dashboard`. No change.
8. Log in as an existing dummy host (e.g. `host-2@email.com`) via the Host tab. Lands on `/host/dashboard`. The new Verification Documents card is visible on /host/profile (may already have ID/license from T19-A).
9. Log in as `customer-1@email.com` via the Customer tab. Lands on `/account`. NO verification banner (grandfathered as VERIFIED in the migration). Can book a listing.
10. Sign up `customer-99@email.com` via email/password → Customer card. Lands on `/login?signedUp=customer`. Log in → `/account` shows the verification banner (new customer = PENDING).

**Grandfathered sanity**
11. Open Prisma Studio → Customer table. All existing seeded customers (`customer-1@email.com`, etc.) have `status = "Verified"`. New customers created via signup show `status = "Pending Verification"`.

If all 6 sections pass, Tier 19 ships cleanly. Booking creation on the marketplace is gated on identity verification end-to-end (UI + server action); both host and customer roles can self-serve their documents; admin has approve / reject / suspend / re-verify levers; existing data didn't break.

---

## Tier 20 — Notifications (email + in-app bell)

Adds a bell icon in the TopNav for admin / host / customer (each scoped to that user's recipientEmail). Bell shows unread count badge, opens a dropdown with the 5 most recent notifications, and links to `/notifications` (full archive). Every state-changing server action that affects a user (booking created/confirmed/rejected/cancelled, owner verified/suspended, listing approved/rejected, customer verified/rejected, review posted) also fires an outbound email via Resend.

### Prerequisites

- **Resend account + API key.** Sign up at resend.com, create an API key, drop it in `.env.local` as `RESEND_API_KEY=re_...`. Without the key, in-app notifications still work; emails are skipped with a clear log line.
- Existing accounts ready: admin (`admin@carbnb.com`), verified host, verified customer.
- An active listing belonging to the verified host (sign in as host → /host/cars and confirm at least one ACTIVE listing).
- A real email inbox you can read for at least the **customer** and **host** accounts you'll test with (so you can verify emails arrive). The dev sandbox From address (`onboarding@resend.dev`) ships to any Gmail.

### T20-A — Booking created → host + admin notifications

**Trigger**
1. Sign in as a VERIFIED customer. Open a listing → Reserve → pick dates → Confirm Reservation.
2. Booking is created (lands at `/account/bookings/[id]` with status Pending or Confirmed depending on `autoApproveVerifiedCustomers`).

**Host side**
3. In another browser / incognito, sign in as the listing's host. TopNav bell now shows a red badge with "1".
4. Click the bell → dropdown shows "New booking on [car name]" with the customer's name + dates.
5. Click the notification → bell closes, you navigate to `/host/bookings/[id]`, the dropdown notification is now marked read on next bell open.
6. Open the host's email inbox. There's a DriveXP email titled "New booking on [car name]" with the same content and a CTA button linking to `/host/bookings/[id]`.

**Admin side**
7. Switch to admin (`admin@carbnb.com`). Bell shows a "1" badge.
8. Open the bell → "New booking · [car name]" with reference number.
9. Click → navigates to `/bookings/[id]`. Admin email inbox also has the same email.

**Verify in DB**
10. Prisma Studio → Notification table → at least 2 rows for this booking: one with `recipientRole = "host"` and one with `recipientRole = "admin"`. Both `isRead` flips to `true` after step 5/9.

### T20-B — Host confirm / reject → customer notification

**Confirm**
1. While logged in as the host, open the pending booking from T20-A → click **Confirm**.
2. Switch to the customer's browser → `/account` → bell badge shows "1" (or N + 1 if there's more).
3. Bell dropdown shows "Booking confirmed · [car name]". Customer email inbox has the same.

**Reject**
4. Repeat the booking flow as the customer with a fresh listing.
5. Host opens the new pending booking → clicks **Reject** → picks a reason → submits.
6. Customer bell shows "Booking declined · [car name]". Email arrives with a "Browse other cars" CTA.

### T20-C — Customer verification → customer notification

1. Sign up a fresh customer (status = PENDING).
2. Upload both ID + license at `/account/verification`. Switch to admin.
3. Admin → `/customers/[id]` for that customer → click **Verify**.
4. Customer's bell badge increments. Bell shows "Your identity has been verified" with a "Browse cars" CTA.
5. Email arrives with the same content.
6. Repeat with a fresh customer and click **Reject** instead → customer bell shows "Verification needs re-submission" with re-upload CTA.

### T20-D — Host + listing approvals → host notifications

**Owner verification**
1. Sign up a fresh host (status = PENDING). Upload required docs.
2. Switch to admin → /owners/[id] → click **Approve Owner**.
3. Host's bell shows "Your host account is verified". Email arrives.

**Listing approval**
4. Sign in as the now-verified host → /host/cars → create a new listing → submit for approval.
5. Switch to admin → /car-listings/[id] → click **Approve**.
6. Host's bell shows "Your [car] is approved". Email arrives.

**Listing suspension**
7. Admin → click **Suspend** on an ACTIVE listing.
8. Host's bell shows "Your [car] listing was suspended". Email arrives.

### T20-E — Bell UI + /notifications archive page

**Dropdown behavior**
1. Sign in to any account with at least 5 notifications. Bell dropdown shows exactly 5 most recent.
2. Unread notifications have a primary-color dot indicator + bold title; read ones are flat-styled.
3. Click "Mark all read" in the dropdown header → badge drops to 0, all 5 indicators clear.
4. Click any individual notification → marks just that one as read + navigates.

**Archive page**
5. Bottom of dropdown → click **View all notifications** → `/notifications`.
6. Page shows all notifications (up to 100 most recent), header reads "X unread · Y total".
7. Each entry shows title, body, time-ago, and (for unread) a primary highlight + "Mark as read" button + an "Open →" link to the entity.
8. Click a row's "Open →" link → navigates to the linked entity.
9. "Mark all as read" header button works the same as the dropdown's.

**Empty state**
10. Sign in as a brand-new account with no notifications → bell badge hidden. Open the dropdown → "You're all caught up." Open /notifications → empty-state card with a "No notifications yet" message.

### T20-F — Email delivery (Resend sandbox)

**Smoke test the email pipeline**
1. With `RESEND_API_KEY` set, trigger any notification (easiest: have admin verify a pending customer).
2. Check the inbox of the recipient Gmail — email should arrive within seconds.
3. From address shows as `DriveXP <onboarding@resend.dev>`.
4. Open Resend dashboard → Emails tab → the just-sent email appears with status "delivered".

**Missing-key fallback**
5. Temporarily remove `RESEND_API_KEY` from `.env.local`. Restart `npm run dev`.
6. Trigger a notification. In-app bell still shows it (DB row was still created).
7. Email is skipped. ActivityLogEntry has a row with description ending in `Email: skipped (RESEND_API_KEY not configured)`.
8. Restore the key for further tests.

If all 6 sections pass, Tier 20 ships. Every meaningful state change on the platform now produces both an in-app bell notification and an email; recipients route correctly per role; the bell dropdown + archive page handle read/unread states; and the email pipeline degrades gracefully when the key is missing.

---

## Tier 21 — Proximity-aware fleet picker (interactive map)

Replaces the fleet-picker dropdown on `/host/cars/[id]/edit` with an interactive **Leaflet + OpenStreetMap** showing verified fleet operators as pins. Fleets manually pin their primary location at signup or from `/host/profile`. The same map appears on the public `/fleets` directory above the existing card grid. No third-party geocoding service, no API keys, no monthly cost.

### Prerequisites

- One VERIFIED FLEET host already in your DB (e.g. `acme-fleet@test.com`)
- One VERIFIED INDIVIDUAL host with at least one ACTIVE listing (so there's a car to link)
- Browser able to load Leaflet (any modern browser)
- Initial fleets will have `latitude` + `longitude` = NULL after the migration — they appear in the "Other fleets (location not set)" fallback list until they pin a location

### T21-A — FLEET host sets their location on `/host/profile`

**Setup**
1. Log in as a VERIFIED FLEET host.
2. Go to `/host/profile`. Below the Verification Documents card, a new **Map Location** card appears.

**Initial state**
3. The status banner reads "Your fleet doesn't have a map location yet."
4. The map renders centered on Metro Manila (14.5995, 120.9842) at zoom 11, showing OSM tiles.
5. A floating instruction at the top of the map reads "Click anywhere on the map to set your location."

**Drop a pin**
6. Click anywhere on the map → a blue/white teardrop pin appears at the click point.
7. The instruction overlay flips to show the lat/lng coordinates ("14.55478, 121.02430 · drag the pin to adjust").
8. Drag the pin → coordinates update in the overlay.
9. The Save button becomes enabled.

**Save**
10. Click **Save location** → button label flips to "Saving…" then green "Saved." confirmation appears below.
11. Refresh the page. The map should re-center on the saved pin. Banner now reads "Your location is set."
12. Click somewhere else → the existing pin moves. Click **Update location** → saves the new coords.

**Verify in DB**
13. Prisma Studio → Owner table → that fleet's row → `latitude` and `longitude` columns populated with the saved values (rounded to ~5 decimal places).
14. ActivityLogEntry → newest row with `type = "owner"` should have action `FLEET_LOCATION_SET` (first save) or `FLEET_LOCATION_UPDATED` (subsequent saves).

**Kind-gating**
15. Log in as an INDIVIDUAL host. Go to `/host/profile`. The Map Location card is **not rendered** (only FLEET hosts see it).

### T21-B — INDIVIDUAL host picks a fleet via the map on `/host/cars/[id]/edit`

**Setup**
1. Have at least 2 VERIFIED fleets, both with locations set (from T21-A).
2. Log in as a VERIFIED INDIVIDUAL host that owns at least one ACTIVE listing.

**Trigger**
3. Go to `/host/cars/[your-listing-id]/edit`.
4. Scroll to the fleet-link section. Header should read **"Select a fleet operator near you to link your car"**.
5. Click **Browse fleet operators** to expand the picker.

**Map picker**
6. The map renders with pins for every mapped fleet. Pins are dark gray by default.
7. Click one pin → it turns blue and grows larger.
8. Below the map, an info card appears with the fleet's name, service area, bio (first 200 chars), `N cars managed`, and a **View full profile →** link.
9. Click another pin → previous pin returns to dark gray, new pin becomes blue, info card updates.
10. Click **View full profile** → opens `/hosts/[fleetId]` in a new tab.

**Unmapped fleets fallback**
11. If any verified fleet has NULL lat/lng, an amber **"Other fleets (location not set)"** card appears below the map listing those fleets. Each entry is a clickable button — clicking selects that fleet (sets `fleetId` state) without a map pin highlight.

**Submit the link request**
12. With a fleet selected (from map or fallback list), optionally enter a management fee.
13. Click **Submit request** → standard fleet-link request flow proceeds (same as before Tier 21).

**Edge case: zero mapped fleets**
14. If no verified fleets have set a location, the map renders with no pins and an amber overlay: "No verified fleets have set a location yet." All fleets appear in the fallback list.

### T21-C — Map view on the public `/fleets` directory

**Setup**
1. Have at least 1 fleet with location set (from T21-A).

**Public view**
2. Open `/fleets` in incognito (no auth needed) or as any logged-in role.
3. The page shows the existing header + a new map view between the header and the existing card grid.
4. Pins appear for each mapped fleet.
5. Click a pin → highlight + info card appears below with name, service area, bio, # cars, and **View profile →** button linking to `/hosts/[id]`.

**Empty state**
6. If no verified fleet has a pinned location, the map renders without pins; the overlay reads "No verified fleets have set a location yet." The card grid below still shows all fleets (mapped + unmapped) — the map just isn't useful without pins.

### T21-D — SSR safety + dynamic loading

1. View `/fleets` source HTML (right-click → View Page Source). The Leaflet map content should NOT be in the initial HTML — it loads client-side. Verifies the dynamic import with `ssr: false` works.
2. On slow connections, you should briefly see "Loading map…" placeholder before the map appears. (Throttle network to "Slow 3G" in DevTools to test.)
3. The page should NOT show any "ReferenceError: window is not defined" errors in the browser console or server logs.

### T21-E — Validation + edge cases

**Empty pin submission**
1. As a FLEET host on `/host/profile`, do NOT drop a pin → the **Save location** button is disabled. Cannot submit without coords.

**Invalid coords (action layer)**
2. From the dev console, manually fire a form with `latitude=999, longitude=200`. Server action returns the error "Latitude must be between -90 and 90."

**Kind-gating (action layer)**
3. From the dev console, fire `updateFleetLocationAction` as a logged-in INDIVIDUAL host. Returns: "Only fleet operators can set a map location."

**Existing fleets without location**
4. Spot-check the seeded fleets in your DB. Until they explicitly set a location, they show in the `/host/cars/[id]/edit` picker's fallback list AND in the `/fleets` card grid (but not on the map).

### T21-F — Fleet-link notification integration

Tier 21 adds 4 new notification types to the Tier 20 system, all wired into `app/actions/fleet-links.ts`:
- FLEET_LINK_REQUESTED — fleet operator gets a bell + email
- FLEET_LINK_APPROVED — individual owner gets a bell + email
- FLEET_LINK_REJECTED — individual owner gets a bell + email
- FLEET_LINK_SEVERED — the OTHER party (whoever didn't sever) gets a bell + email

**Request → Approve flow**
1. As an INDIVIDUAL host with a verified, ACTIVE listing that has no fleet link, request a link to a fleet via the map picker on `/host/cars/[id]/edit`. Submit.
2. Switch to the fleet operator's session. Their bell badge increments. Open it — top notification reads "New fleet-link request for [car name]" with "Open host dashboard" CTA.
3. Click the notification → routes to `/host/dashboard` where the pending request is visible.
4. The fleet operator approves the request.
5. Switch to the individual host's session. Their bell badge increments. Open it — top notification reads "[Fleet name] approved managing your [car name]" with "View listing" CTA.

**Request → Reject flow**
6. As another INDIVIDUAL host, request a link to a fleet (different listing).
7. Switch to fleet operator → reject the request.
8. Individual host's bell shows "[Fleet name] couldn't take on your [car name]" with "Pick another fleet" CTA.

**Sever flow (owner severs)**
9. With an ACTIVE link in place, the individual host severs it from `/host/cars/[id]/edit`.
10. Fleet operator's bell shows "[Owner name] severed their fleet link with you".

**Sever flow (fleet severs)**
11. As the fleet operator (with an ACTIVE link), navigate to the host dashboard and sever a managed link.
12. Individual owner's bell shows "[Fleet name] ended fleet management of your [car name]".

**Email side-channel**
13. For each of the above, if `RESEND_API_KEY` is configured AND the recipient's email matches the Resend account owner (sandbox limitation), the email also arrives in their inbox.
14. ActivityLogEntry shows a `NOTIFICATION_SENT` row for each fired notification with the correct recipient + type.

**Tier 20 regression check**
15. Trigger any unrelated event (e.g. admin verifies a pending customer). Bell + email still fire as before. Confirms Tier 21 didn't break the existing system.

If all 6 sections pass, Tier 21 ships. The fleet picker is now visually impactful (a map of Metro Manila with named pins + hover info), fleets can self-serve their location, existing fleets without coords degrade gracefully into a fallback list, and fleet-link lifecycle events fire notifications end-to-end.

---

## Adding a new tier

When you ship a new tier (T16+), append a section here following the same structure:

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
