# Mobile Layout Visual Guide

## Landscape Mode (Horizontal)
```
┌─────────────────────────────────────────────────────┐
│  MULTIPLAYER HUD (Session | Turn | Players)         │
├─────────────────────────────────────────────────────┤
│☰│                                                    │
│ │                                                    │
│T│              MAP CONTAINER                        │
│o│           (Full Width View)                       │
│g│                                                    │
│g│                                                    │
│l│                                                    │
│e│                                                    │
│ │                                                    │
└─────────────────────────────────────────────────────┘

When Toggle (☰) is Clicked:
┌─────────────────────────────────────────────────────┐
│  MULTIPLAYER HUD (Session | Turn | Players)         │
├──────────┬──────────────────────────────────────────┤
│          │✕│                                         │
│ SIDEBAR  │ │                                         │
│ ┌──────┐ │ │         MAP CONTAINER                  │
│ │Turn  │ │ │                                         │
│ │Info  │ │ │                                         │
│ ├──────┤ │ │                                         │
│ │Player│ │ │                                         │
│ │Stats │ │ │                                         │
│ └──────┘ │ │                                         │
└──────────┴──────────────────────────────────────────┘
  (300px)
```

## Portrait Mode (Vertical)
```
┌───────────────────┐
│  MULTIPLAYER HUD  │
│ Session | Players │
│    Current Turn   │
├───────────────────┤
│                   │
│                   │
│   MAP CONTAINER   │
│     (Centered)    │
│                   │
│    (55% Height)   │
│                   │
│                   │
├───────────────────┤
│        ☰          │  ← Tap to expand
│    ┌────────┐     │
└────┴────────┴─────┘

When Sidebar Expanded (Tap ☰):
┌───────────────────┐
│  MULTIPLAYER HUD  │
│ Session | Players │
├───────────────────┤
│                   │
│   MAP CONTAINER   │
│                   │
│    (50% Height)   │
├───────────────────┤
│     SIDEBAR       │
│   ┌──────────┐    │
│   │ Turn Info│    │
│   │ Players  │    │
│   │ Stats    │    │
│   │ Controls │    │
│   └──────────┘    │
│   (45% Height)    │
└───────────────────┘
```

## Key Measurements

### Landscape Mode
- **HUD Height**: 60px (50px on small screens)
- **Sidebar Width**: 300px (280px on small screens)
- **Toggle Button**: 50x50px, positioned left center
- **Sidebar Position**: Fixed left, slides in/out
- **Animation**: 0.3s ease-in-out

### Portrait Mode
- **HUD Height**: Auto (~80px)
- **Map Height**: 50-55% of viewport
- **Sidebar Height**: 45-50% of viewport (max)
- **Collapsed State**: Shows 60px peek (50px on small phones)
- **Sidebar Position**: Fixed bottom, slides up/down
- **Animation**: 0.3s ease-in-out

### Touch Targets
- **Minimum Size**: 44x44px for all interactive elements
- **Toggle Button**: 50x50px (exceeds minimum)
- **Sidebar Tap Area**: Top 80px for expand/collapse

### Font Sizes
- **Desktop**: 1em (base)
- **Landscape Mobile**: 0.85-0.9em
- **Portrait Tablet**: 0.9-0.95em
- **Portrait Phone**: 0.8-0.85em

## Responsive Breakpoints

| Breakpoint | Orientation | Description |
|------------|-------------|-------------|
| max-width: 1024px | landscape | Tablet/phone landscape |
| max-width: 768px | portrait | Tablet portrait |
| max-width: 480px | portrait | Phone portrait |
| max-height: 500px | landscape | Small phone landscape |

## Interaction Patterns

### Landscape Mode:
1. **Open Sidebar**: Click/tap toggle button (☰)
2. **Close Sidebar**: 
   - Click toggle button (now showing ✕)
   - Click anywhere outside sidebar
   - Click on map

### Portrait Mode:
1. **Expand Sidebar**: Tap top area of sidebar (where ☰ is shown)
2. **Collapse Sidebar**: Tap top area again
3. **Scroll Content**: When expanded, scroll within sidebar
4. **Swipe Gesture**: Swipe up/down on sidebar top area

## States

### Sidebar States:
- **Collapsed** (default in landscape): `transform: translateX(-100%)`
- **Expanded** (landscape): `transform: translateX(0)` + class `mobile-expanded`
- **Peek** (default in portrait): `transform: translateY(calc(100% - 60px))`
- **Expanded** (portrait): `transform: translateY(0)` + class `mobile-expanded`

### Toggle Button States:
- **Hidden Sidebar**: Shows ☰ (hamburger icon)
- **Visible Sidebar**: Shows ✕ (close icon)
- **Portrait Mode**: Hidden (not displayed)
- **Landscape Mode**: Visible

## CSS Classes

### Main Classes:
- `.mobile-sidebar-toggle` - The toggle button
- `.sidebar.mobile-expanded` - Sidebar in expanded state
- `.sidebar` - Main sidebar container

### Media Query Classes:
- Applied automatically based on screen size and orientation
- No manual class toggling needed for responsive behavior

## Compatibility Notes

### Tested On:
- ✅ iOS Safari (iPhone/iPad)
- ✅ Android Chrome
- ✅ Desktop Chrome (responsive mode)
- ✅ Desktop Firefox (responsive mode)

### Touch Events:
- `touchstart` - Track initial touch position
- `touchend` - Calculate swipe distance
- `click` - Button interactions

### Viewport Detection:
- `window.matchMedia('(orientation: landscape)')` - Detect orientation
- Automatic re-layout on orientation change
- No page reload required
