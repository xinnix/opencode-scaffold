# Design System Document: High-End Editorial Community Hub

## 1. Overview & Creative North Star

### Creative North Star: "The Curated Canvas"

This design system is built to transform the digital presence of a community mall from a standard directory into a high-end editorial experience. We move away from the "template" look by embracing **The Curated Canvas**—a philosophy where content is treated like art in a gallery.

The aesthetic is defined by intentional asymmetry, vast "breathing room" (whitespace), and a sophisticated interplay of tonal layers. We bypass traditional structural lines in favor of soft, nested surfaces that create a sense of architectural depth. By utilizing the geometric precision of the brand logo and the clarity of Plus Jakarta Sans, we create an environment that feels premium and exclusive, yet warm and approachable for the local community.

---

## 2. Colors & Surface Logic

Our palette is anchored by the vibrant Primary Blue (#00AEEF), but its "Premium" feel is earned through the sophisticated use of neutrals and tonal transitions.

### The "No-Line" Rule

To maintain an editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts. For example, a content section using `surface-container-low` should sit directly against a `background` or `surface` canvas. This creates a "seamless" transition that feels modern and high-end.

### Surface Hierarchy & Nesting

Treat the UI as a series of stacked architectural planes.

- **Base:** `surface` (#f5faff) – The primary canvas.
- **Level 1:** `surface-container-low` (#eff4fa) – For large content blocks or background groupings.
- **Level 2:** `surface-container-highest` (#dee3e8) – For secondary interactive areas.
- **Level 3:** `surface-container-lowest` (#ffffff) – Reserved for high-priority cards or "floating" elements to provide a crisp, white "pop" against the blue-tinted neutrals.

### The Glass & Gradient Rule

While the system is "flat," we inject soul through:

- **Tonal Gradients:** Use a subtle linear gradient from `primary` (#00658d) to `primary-container` (#00aeef) for hero sections and main CTAs. This adds a "glow" that solid hex codes lack.
- **Glassmorphism:** For floating navigation or overlays, use `surface` at 80% opacity with a `backdrop-blur` (16px–24px). This allows the brand colors to bleed through, softening the interface.

---

## 3. Typography

The typography scale is designed to mimic a high-fashion magazine layout. We use **Plus Jakarta Sans** for its geometric clarity and professional weight.

- **Display (lg/md/sm):** Used for "Hero" moments and editorial headers. Large scale and generous letter-spacing create an authoritative, premium tone.
- **Headline (lg/md):** Used for section titles. These should often be placed with intentional asymmetry (e.g., left-aligned with a large right-margin) to break the grid.
- **Title & Body:** `title-lg` is for card headings; `body-lg` is optimized for long-form reading with a line-height of 1.6 to ensure "breathability."
- **Labels:** `label-md` and `label-sm` are utilized for metadata and category tags, always in All Caps with +5% letter-spacing for a sophisticated touch.

---

## 4. Elevation & Depth

We reject skeuomorphism. Depth is achieved through **Tonal Layering** and **Ambient Light**.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle contrast (pure white vs. light blue-grey) creates a natural lift.
- **Ambient Shadows:** If a card must float, use a shadow that mimics natural light:
- _X: 0, Y: 8px, Blur: 32px, Spread: 0_
- _Color:_ `on-surface` (#171c20) at **4% to 6% opacity**.
- Avoid dark grey or black shadows; they feel "heavy" and "default."
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline-variant` (#bdc8d1) at **20% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons

- **Primary:** Solid `primary` background with `on-primary` text. Use `DEFAULT` (0.5rem) rounded corners. For a "Premium Selection" feel, use `label-md` (All Caps) for the label text.
- **Secondary:** `primary-container` background. Flat, no border.
- **Tertiary:** Ghost style. `primary` text, no background, but a subtle `primary` tint on hover.

### Cards & Lists

- **Forbid Divider Lines:** Separate list items with vertical white space (use `Spacing Scale 4` or `5`).
- **Structure:** Cards should use `surface-container-lowest` (#ffffff) with a `DEFAULT` (0.5rem) or `lg` (1rem) corner radius. Use `spacing-5` (1.7rem) for internal padding to emphasize the "High-End" feel.

### Input Fields

- **Styling:** Use `surface-container-high` as the background. No border.
- **States:** On focus, transition the background to `surface-container-lowest` and add a 2px `primary` "Ghost Border" at 40% opacity.

### Featured "Mall" Components

- **Store Category Chips:** Use `full` (pill) roundedness. `surface-variant` background with `on-surface-variant` text.
- **Hero Image Clusters:** Instead of a single image, use overlapping image containers with different `roundedness` (e.g., one `xl`, one `DEFAULT`) to mirror the geometric complexity of the brand logo.

---

## 6. Do's and Don'ts

### Do:

- **Use Asymmetric Layouts:** Place your Headline-lg off-center to create visual interest.
- **Embrace the Spacing Scale:** If you think there is enough whitespace, add one more level from the scale (e.g., move from `8` to `10`).
- **Color-Block:** Use `secondary-container` or `tertiary-container` as large background blocks to highlight specific community events or premium offers.

### Don't:

- **Don't use 100% Black:** Always use `on-surface` (#171c20) for text to keep the interface soft.
- **Don't use 3D effects:** No inner shadows, no bevels, no drop shadows over 10% opacity.
- **Don't crowd the edges:** Maintain a minimum of `spacing-6` (2rem) margin for all screen edges.
- **Don't use lines for separation:** If you feel the need for a divider, use a tonal shift or a 24px gap instead.
