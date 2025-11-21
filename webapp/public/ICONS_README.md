# PayFlow PWA Icons

## Required Icons

The PWA manifest requires the following icon files:

- `icon-192.png` - 192x192px (maskable)
- `icon-512.png` - 512x512px (maskable)

### Icon Design Requirements

**Visual Identity:**
- Background: Gradient from #667eea to #764ba2 (PayFlow primary gradient)
- Symbol: 💰💧 or waterfall icon in white
- Shape: Square with rounded corners (maskable safe zone)

**Maskable Safe Zone:**
- Keep important content within center 80% of the icon
- This ensures icon looks good on all devices (Android, iOS, etc.)

### Recommended Tools

1. **Figma/Adobe Illustrator** - Design the icon
2. **[Maskable.app](https://maskable.app/)** - Test maskable icon appearance
3. **[RealFaviconGenerator](https://realfavicongenerator.net/)** - Generate all sizes

### Temporary Workaround

Until custom icons are created, you can use a simple gradient square:
- Create 192x192 and 512x512 PNG files
- Fill with linear gradient (#667eea → #764ba2)
- Add white "💰" emoji or text "PF" centered

### Screenshot Requirements

- `screenshot-mobile.png` - 390x844px (iPhone view)
- `screenshot-desktop.png` - 1280x800px (Desktop view)

Take screenshots of:
1. Dashboard with guilt-free spending calculated
2. Waterfall visualization with bills/goals
