# Design System Documentation: The Curated Engine

## 1. Overview & Creative North Star
This design system is built to transform the utility of a peer-to-peer marketplace into a high-end, editorial experience. We are moving away from the "template" aesthetic of traditional dashboards to embrace a philosophy we call **"The Curated Engine."**

**The Curated Engine** represents the intersection of mechanical precision (operational data) and premium hospitality (the marketplace experience). While the underlying logic is high-density and robust, the visual layer is airy, sophisticated, and intentional. We achieve this through:
*   **Intentional Asymmetry:** Breaking the rigid grid in hero sections and vehicle showcases to create movement.
*   **Tonal Architecture:** Using color shifts instead of lines to define space.
*   **Editorial Typography:** Treating vehicle names and headers with the gravitas of a luxury magazine.

---

## 2. Colors: The Tonal Palette
The color system utilizes a sophisticated Material-based logic but applies it with an editorial eye. We lean heavily into the "Blue" and "Slate" ranges for trust, using "Emerald" as a signifier of elite status and verification.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts.
*   Use `surface_container_low` (#f2f3ff) for the main body background.
*   Use `surface_container_lowest` (#ffffff) for primary content cards to create a "lifted" feel without a border.
*   Use `surface_dim` (#d2d9f4) for subtle sidebars or auxiliary utility panels.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers. 
*   **Base:** `surface` (#faf8ff).
*   **Sectioning:** `surface_container` (#eaedff).
*   **Actionable Elements:** `surface_container_highest` (#dae2fd) for elements that require immediate user focus.

### The "Glass & Gradient" Rule
To elevate the "out-of-the-box" feel, use **Glassmorphism** for floating elements (e.g., sticky headers or hovering navigation). Apply `surface` with a 70% opacity and a 12px backdrop blur. 
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#003d9b) to `primary_container` (#0052cc) at a 135-degree angle. This adds "soul" and depth that flat color cannot replicate.

---

## 3. Typography: Editorial Authority
We utilize two distinct families to balance personality with utility.

*   **Display & Headlines (Manrope):** This is our "Editorial" voice. Manrope’s geometric yet warm proportions give vehicle titles and page headers a premium, custom feel. Use `display-lg` (3.5rem) for hero moments and `headline-md` (1.75rem) for section titles.
*   **Operational UI (Inter):** For everything functional—data tables, multi-step forms, and labels—we use Inter. It is the gold standard for legibility in high-density environments. 

**Hierarchy Strategy:** 
Large, bold Manrope headers create a focal point, while Inter `label-md` (0.75rem) in `on_surface_variant` (#434654) provides the metadata support. The contrast between the two creates an "expensive" feel.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and ambient light simulation, never through heavy drop shadows.

*   **The Layering Principle:** Place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f2f3ff) background. The delta in lightness is enough to signify "upward" movement.
*   **Ambient Shadows:** For floating modals or vehicle cards in the customer view, use extra-diffused shadows.
    *   *Shadow Color:* `on_surface` at 6% opacity.
    *   *Blur:* 24px - 40px.
    *   *Y-Offset:* 8px.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-density admin tables), use a "Ghost Border": `outline_variant` (#c3c6d6) at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### Buttons
*   **Primary:** Uses the signature `primary` to `primary_container` gradient. Roundedness: `xl` (0.75rem). Text: `title-sm` (Inter, Semibold).
*   **Secondary:** No background. Use `surface_tint` (#0c56d0) for text and a "Ghost Border."
*   **Tertiary:** Plain text using `primary` (#003d9b) for navigation-heavy areas.

### Status Badges (The "Soft Fill" Approach)
Avoid harsh, high-contrast badges. Use the "Soft Fill" method:
*   **Verified/Active:** Text `on_tertiary_fixed_variant` (#005236) on `tertiary_fixed` (#6ffbbe) background.
*   **Pending/Ongoing:** Amber tokens (e.g., `on_secondary_fixed_variant` context).
*   **Rejected/Suspended:** Text `on_error_container` (#93000a) on `error_container` (#ffdad6).

### Vehicle Cards & Admin Tables
*   **Cards:** Forbid divider lines. Use `spacing-6` (1.3rem) of vertical white space to separate the image, title, and price. Use `xl` (0.75rem) corners for a modern, friendly feel.
*   **Data Tables:** In Admin dashboards, density is key. Use `body-sm` for row data. Instead of lines, use alternating row tints: `surface` for odd rows, `surface_container_low` for even rows.
*   **Multi-Step Forms:** Use a vertical "Progress Rail" instead of a standard horizontal bar. The rail should use a gradient transition from `surface_variant` to `primary` to show momentum.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `spacing-10` and `spacing-12` for section margins to allow the editorial type to "breathe."
*   **Do** use `surface_bright` (#faf8ff) for the most interactive regions of a dashboard.
*   **Do** leverage the `full` (9999px) roundedness scale for search bars and filter chips to contrast against the `xl` (0.75rem) cards.

### Don't:
*   **Don't** use 1px solid #000 or #CCC borders. If you feel you need a line, use a background color change instead.
*   **Don't** use `display-lg` for anything other than primary hero titles. It is a "jewelry" font; too much of it ruins the premium effect.
*   **Don't** use pure black for text. Always use `on_surface` (#131b2e) to maintain a soft, professional tone.
*   **Don't** use "Default" shadows. If the shadow isn't soft enough to be almost invisible, it's too heavy.