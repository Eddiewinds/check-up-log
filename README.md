# Check up Log 📋

A simple, accessible daily health tracking app built with plain HTML, CSS and JavaScript — no server, no login, no installation required.

Designed with older adults in mind: large text, large buttons, high contrast, and a clean layout that works great on a phone screen.

---

## Features

- **Daily health entries** — log fasting blood sugar, blood pressure (both arms), medication, and meals (morning, afternoon, evening)
- **Automatic date** — today's date is filled in for you, but you can change it
- **Instant interpretation** — each entry is automatically rated (Normal / Elevated / High) using standard general guidelines, colour-coded green / yellow / red
- **Left vs right arm flag** — warns you if the two arm readings differ by more than 10 points
- **Search** — filter entries by date or by food eaten
- **Edit & delete** — update any entry or remove it (with a confirmation prompt)
- **Copy summary** — one tap copies a plain-text daily summary, ready to paste into WhatsApp or any messaging app
- **Light & dark mode** — toggle with a sun/moon button in the header; your preference is saved
- **No data ever leaves your device** — everything is stored locally in your browser using `localStorage`

---

## How to Use

### Option 1 — Open locally
1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
3. That's it — no setup needed

### Option 2 — Host on GitHub Pages
1. Go to your repository **Settings → Pages**
2. Set the source to **main branch / root**
3. Your app will be live at `https://<your-username>.github.io/check-up-log/`

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | App structure and markup |
| `style.css` | All styling, CSS variables, light/dark themes |
| `script.js` | App logic, localStorage, search, copy summary |

---

## Health Rating Ranges Used

These are general published guidelines used for on-screen labels only.

**Fasting Blood Sugar (mmol/L)**
| Label | Range |
|-------|-------|
| Low | Below 3.9 |
| Normal | 3.9 – 5.5 |
| Elevated | 5.6 – 6.9 |
| High | 7.0 and above |

**Blood Pressure (mmHg systolic)**
| Label | Range |
|-------|-------|
| Normal | Below 120 |
| Elevated | 120 – 129 |
| High Stage 1 | 130 – 139 |
| High Stage 2 | 140 and above |

> **Important:** These ratings are for general reference only and are not a medical diagnosis. Always consult your doctor for any health concerns.

---

## Disclaimer

This app is designed for personal daily record-keeping only. The automatic ratings and arm-difference flags use general published guidelines and are **not** a medical diagnosis, clinical judgment, or replacement for a licensed doctor. Always consult your physician or healthcare team for any health questions, persistent high or low numbers, or before making any changes to prescribed medication.

---

## Tech Stack

- HTML5
- CSS3 (custom properties, flexbox, media queries)
- Vanilla JavaScript (ES6+)
- Browser `localStorage` for data persistence
- No frameworks, no dependencies, no build step

---

## Browser Support

Works in all modern browsers. No internet connection required after the page is loaded.

---

*Built with care for everyday health awareness.*
