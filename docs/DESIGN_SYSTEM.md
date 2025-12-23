# Design System Guide

Your website now uses a modern, Tailwind-inspired design system that's easy to customize!

## 🎨 Color System

All colors are defined as CSS variables in `assets/css/main.css`. To change the color scheme, simply update these variables:

```css
--color-primary: #2563eb;        /* Main brand color (blue) */
--color-primary-hover: #1d4ed8;  /* Darker blue on hover */
--color-accent: #8b5cf6;         /* Purple accent color */
--color-text: #1f2937;           /* Main text color */
--color-bg: #ffffff;             /* Background color */
```

## 📐 Spacing System

Based on a 4px unit system (like Tailwind):

- `--space-1` = 4px
- `--space-2` = 8px
- `--space-4` = 16px
- `--space-6` = 24px
- `--space-8` = 32px
- `--space-12` = 48px
- `--space-16` = 64px

## 🎭 Typography

Font sizes are defined as variables:

- `--text-xs` through `--text-7xl`
- Font weights: `--font-light` (300) to `--font-bold` (700)

## 🎯 Key Features

### Hamburger Menu
- **Location**: Fixed top-right corner
- **Animation**: Smoothly transforms from hamburger icon to X when opened
- **Menu**: Slides in from the right with smooth transitions
- **Overlay**: Blurred backdrop when menu is open

### Hero Section (Landing Page)
- **Centered design** with your name as the focal point
- **Gradient text** on your name
- **Animated underline** that expands on load
- **Smooth fade-in** animations for all elements
- **Responsive image** with hover effects

### Animations
- **Slow highlight animations** on hover (300-700ms transitions)
- **Smooth dropdowns** with max-height transitions
- **Rounded corners** throughout (using `--radius` variables)
- **Unified colorway** with consistent color usage

## 🛠️ Customization

### Changing Colors

Edit `assets/css/main.css` and update the `:root` variables:

```css
:root {
  --color-primary: #your-color;
  --color-accent: #your-accent;
  /* etc. */
}
```

### Changing Spacing

Update spacing variables:

```css
:root {
  --space-4: 1.5rem; /* Change from 1rem to 1.5rem */
}
```

### Changing Border Radius

```css
:root {
  --radius: 0.75rem; /* More rounded */
  --radius-lg: 1.5rem;
}
```

### Changing Animation Speed

```css
:root {
  --transition-base: 200ms ease; /* Faster */
  --transition-slow: 400ms ease;
}
```

## 📱 Responsive Design

The design is fully responsive with breakpoints:
- Mobile: < 480px
- Tablet: < 768px
- Desktop: > 768px

## 🎨 Utility Classes

Use these classes for quick styling:

- `.text-center`, `.text-left`, `.text-right`
- `.mt-{1-16}`, `.mb-{1-16}` (margins)
- `.p-{4,6,8}` (padding)
- `.rounded`, `.rounded-lg`, `.rounded-full`
- `.btn`, `.btn-secondary` (buttons)
- `.card` (card container)

## 🚀 Adding New Pages

1. Copy an existing HTML file
2. Update the content
3. The hamburger menu and footer will automatically render via JavaScript
4. Use `.container-narrow` for centered content pages

## 💡 Tips

- All transitions use CSS variables for easy customization
- Colors follow a unified palette
- Animations are subtle and smooth (not jarring)
- Everything is mobile-first and responsive

Enjoy your sleek new design! 🎉

