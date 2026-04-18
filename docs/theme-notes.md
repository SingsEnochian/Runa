# Theme Notes

Dark-page palette directions for the Sound Lab and adjacent UI work.

The goal is to keep the interface:
- dark
- warm
- readable
- atmospheric without becoming muddy
- elegant enough for long sessions

---

## Theme A — Nocturne Garden

Mood:
- secret conservatory
- moonlit floral dark
- soft ritual machinery
- elegant hush

Palette:
- `#081315` Nyctophobia
- `#13292D` Black Box
- `#A3641A` Syrah Soil
- `#664021` Satoimo Brown
- `#B0804B` Caramel Sauce

Suggested roles:
- background: `#081315`
- surface / cards: `#13292D`
- primary accent: `#A3641A`
- hover / pressed accent: `#664021`
- warm highlight / icons / secondary accent: `#B0804B`
- text: `#F3E7D3`
- muted text: `#C9B79D`

Token sketch:

```css
:root {
  --bg: #081315;
  --surface: #13292D;
  --accent: #A3641A;
  --accent-dark: #664021;
  --accent-soft: #B0804B;
  --text: #F3E7D3;
  --text-muted: #C9B79D;
  --border: rgba(176, 128, 75, 0.22);
  --glow: rgba(163, 100, 26, 0.18);
}
```

Best for:
- default shell pages
- long reading views
- notes and journaling
- slow, contemplative sessions

---

## Theme B — Ember Rain

Mood:
- rain on leaves
- ember under glass
- wet botanical dusk
- richer contrast and more visible warmth

Palette:
- `#8B462D`
- `#2D4436`
- `#C78A1E` Golden Honey
- `#4C1A17` Mahogany Roast
- `#1C2F3A` Slate Storm

Suggested roles:
- surface-warm: `#8B462D`
- moss accent / secondary panel: `#2D4436`
- primary active accent: `#C78A1E`
- deep warm shadow / critical contrast: `#4C1A17`
- storm-blue panel / nav / modal: `#1C2F3A`
- text: `#F6E7C8`
- muted text: `#D3BF98`

Token sketch:

```css
:root {
  --bg: #102024;
  --surface: #1C2F3A;
  --surface-alt: #2D4436;
  --warm-surface: #8B462D;
  --accent: #C78A1E;
  --accent-dark: #4C1A17;
  --text: #F6E7C8;
  --text-muted: #D3BF98;
  --border: rgba(199, 138, 30, 0.28);
  --glow: rgba(199, 138, 30, 0.20);
}
```

Best for:
- landing pages
- dashboards
- visualization-heavy screens
- active session pages where controls need stronger visual separation

---

## Usage Guidance

### Nocturne Garden
Use when the page should recede and hold still.
This is the better theme for:
- writing
- reflection
- logs
- protocol reading

### Ember Rain
Use when the page should feel alive and slightly more tactile.
This is the better theme for:
- audio controls
- session launch screens
- experiment dashboards
- highlighted stats panels

---

## Sound Lab UI Mapping

Suggested component mapping:

- app background: Theme A background or Theme B storm-blue background
- cards / modules: Theme A surface or Theme B surface
- waveform / active slider fill: primary accent
- selected tab / active state: primary accent
- hover states: accent-dark
- subtle separators: border token
- key readouts / timer / important values: accent-soft or primary accent

---

## Contrast Notes

Avoid pure white on these themes.
A warm parchment text colour reads better and preserves the mood.

Recommended light text options:
- `#F3E7D3`
- `#F6E7C8`
- `#EAD9B8`

Recommended muted text options:
- `#C9B79D`
- `#D3BF98`
- `#BFA885`

---

## North Star

The UI should feel like a place you want to stay in for 45 minutes with headphones on.
Not a sterile dashboard.
Not a fantasy poster.
A lived-in instrument.
