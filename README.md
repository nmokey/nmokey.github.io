# nmokey.com - Personal Portfolio Website

![Website](https://img.shields.io/website?down_message=offline&label=nmokey.com&up_message=online&url=https%3A%2F%2Fnmokey.com)
![GitHub last commit](https://img.shields.io/github/last-commit/nmokey/nmokey.github.io)

A sleek, modern personal portfolio website featuring an interactive physics-inspired vector field background, dark mode by default, and a minimalist design aesthetic.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Site Structure](#site-structure)
- [Design Philosophy](#design-philosophy)
- [Design System](#design-system)
- [Components](#components)
- [Theme System](#theme-system)
- [File Structure](#file-structure)
- [Deployment](#deployment)
- [SEO Optimization](#seo-optimization)
- [Customization Guide](#customization-guide)

---

## Overview

This is a pure HTML/CSS/JavaScript website (no build process) that showcases a personal portfolio with a physics-inspired interactive background. The site emphasizes:

- **Minimalist Design**: Clean, centered layouts with plenty of whitespace
- **Physics Background**: Interactive vector field that responds to cursor movement
- **Dark Mode First**: Dark theme by default with optional light mode toggle
- **Smooth Animations**: Subtle, responsive animations throughout
- **Frosted Glass Effects**: Translucent navigation and footer with backdrop blur
- **Fully Responsive**: Mobile-first design that works on all screen sizes
- **Markdown Content System**: Easy content editing via markdown files with agent-assisted HTML updates

---

## Content Management System

### Markdown-Based Content Editing

The site uses a **markdown-first content workflow** that makes it easy to edit page content without dealing with HTML structure:

**How It Works:**
1. **Content Source**: Each HTML page has a corresponding markdown file in `/docs/content/`
   - `index.html` ↔ `content/index.md`
   - `about.html` ↔ `content/about.md`
   - `art.html` ↔ `content/art.md`
   - etc.

2. **Editing Workflow**:
   - Edit content in markdown files (`.md`) - easy to read and write
   - Markdown files serve as a "whiteboard" for content updates
   - When ready, an AI agent (like Cursor's AI) reflects changes from markdown to HTML
   - HTML files remain the source of truth for the live site

3. **Benefits**:
   - **Easy Editing**: Write content in markdown instead of HTML
   - **Clean Separation**: Content (markdown) separate from structure (HTML)
   - **Version Control**: Markdown changes are easy to review in git
   - **No Build Process**: Direct HTML deployment, markdown is just for editing convenience

**File Structure:**
```
docs/
├── content/              # Markdown content files (editing source)
│   ├── index.md
│   ├── about.md
│   ├── art.md
│   ├── music.md
│   ├── projects.md
│   └── thoughts.md
├── index.html            # Live HTML files (deployed)
├── about.html
├── art.html
└── ...
```

**Usage:**
- Edit markdown files in `/docs/content/` to update page content
- Request an AI agent to sync changes from markdown to corresponding HTML files
- HTML files are what GitHub Pages serves - markdown is not deployed

**Note**: The markdown files are for content editing only. The HTML files contain the full page structure (head, navigation, footer, scripts) and are what actually gets deployed. When updating content, edit the markdown, then have an agent update the corresponding HTML file's content section.

---

## Tech Stack

### Core Technologies
- **HTML5**: Semantic markup, no frameworks
- **CSS3**: Modern CSS with custom properties (variables), Grid, Flexbox, backdrop-filter
- **Vanilla JavaScript (ES6+)**: No dependencies, pure JavaScript
- **Canvas API**: For the interactive vector field visualization

### Key CSS Features
- CSS Custom Properties (variables) for theming
- `backdrop-filter: blur()` for frosted glass effects
- CSS Grid and Flexbox for layouts
- CSS animations and transitions
- Media queries for responsive design

### JavaScript Features
- ES6+ classes and arrow functions
- Canvas 2D API for vector field rendering
- `requestAnimationFrame` for smooth animations
- LocalStorage for theme persistence
- Event delegation for dynamic content

### Deployment
- **GitHub Pages**: Hosted from `/docs` folder
- **Custom Domain**: `nmokey.com` via CNAME file
- **No Build Process**: Direct HTML/CSS/JS deployment

---

## Site Structure

### Pages
- **`index.html`**: Homepage with hero section and cycling subtitle
- **`about.html`**: Personal information, interests, awards, links
- **`art.html`**: Art portfolio showcase
- **`music.html`**: Music portfolio
- **`projects.html`**: Technical projects and work
- **`thoughts.html`**: Blog/thoughts section
- **`404.html`**: Custom 404 error page with playful design

### Navigation Structure
```
about (top, left-justified)
├── portfolios
│   ├── art
│   ├── music
│   └── projects
└── random
    └── thoughts
```

---

## Design Philosophy

### Visual Aesthetic
- **Centered Layouts**: Content is centered with generous margins
- **Minimalist**: Clean typography, subtle colors, lots of whitespace
- **Physics-Inspired**: Vector field background reflects physics background
- **Sleek & Modern**: Rounded corners, smooth transitions, frosted glass effects

### User Experience
- **Hover-Based Navigation**: Menu expands on hover, not click
- **Instant Feedback**: Vector field responds immediately to cursor
- **Smooth Transitions**: All animations use easing functions
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

### Color Philosophy
- **Dark Mode Default**: Deep blue backgrounds (#0f172a) with light text
- **Accent Colors**: Blue (#60a5fa) and purple (#a78bfa) gradients
- **Unified Palette**: Consistent color usage throughout
- **High Contrast**: Text remains readable in both themes

---

## Design System

### CSS Variables (Tailwind-Inspired)

Located in `docs/assets/css/main.css`, the design system uses CSS custom properties for easy customization:

#### Colors
```css
--color-primary: #60a5fa;        /* Main brand color */
--color-primary-hover: #3b82f6;  /* Hover state */
--color-text: #f9fafb;            /* Primary text */
--color-bg: #0f172a;             /* Background */
--color-bg-alt: #1e293b;          /* Alternate background */
--color-accent: #a78bfa;          /* Accent color */
```

#### Spacing (4px base unit)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

#### Typography
```css
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-4xl: 2.25rem;  /* 36px */
```

#### Border Radius
```css
--radius-sm: 0.25rem;   /* 4px */
--radius: 0.5rem;       /* 8px */
--radius-md: 0.75rem;   /* 12px */
--radius-lg: 1rem;      /* 16px */
--radius-full: 9999px;  /* Full circle */
```

#### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--transition-slow: 500ms ease;
```

### Typography Scale
- **Headings**: Bold, tight line-height (1.25)
- **Body**: Normal weight, relaxed line-height (1.5)
- **Font Stack**: System fonts for performance (-apple-system, Segoe UI, Roboto, etc.)

---

## Components

### 1. Homepage Hero Section

**Location**: `docs/index.html`

**Design**:
- Centered layout with profile image
- Large gradient name heading with animated underline
- Cycling subtitle that rotates through roles (physics student, programmer, skier, etc.)
- Call-to-action buttons (Resume download, Learn More)

**Implementation**:
- HTML: Semantic `<section class="hero">` structure
- CSS: `components.css` - `.hero`, `.hero-name`, `.hero-subtitle`, `.hero-image`
- JavaScript: `main.js` - `initCyclingText()` function cycles through roles every 3 seconds
- Animations: Fade-in-up animations with staggered delays

**Key Features**:
- Gradient text effect on name using `background-clip: text`
- Animated underline that expands on load
- Profile image with hover scale effect
- Responsive font sizing with `clamp()`
- **Hero buttons**: No underline animations (clean button styling)
- **Full viewport height**: Hero section uses `min-height: 100vh` to hide content below on initial load

### 2. Navigation Menu (Hamburger)

**Location**: `docs/assets/css/components.css`, `docs/assets/js/components.js`

**Design**:
- Fixed position in top-right corner (top-left on non-homepage with home button)
- Circular button that expands into menu on hover
- Frosted glass effect (semi-transparent with backdrop blur)
- Smooth scale animation from circle to rounded rectangle
- Menu items with hover effects and current page highlighting

**Implementation**:
- HTML: `<button class="menu-toggle">` with nested `<nav class="nav-menu">`
- CSS: 
  - Starts as 56px circle (`border-radius: var(--radius-full)`)
  - Expands to 200px wide menu (`border-radius: var(--radius-md)`)
  - Uses `transform: scale()` and `border-radius` transitions
  - Frosted glass: `background: rgba(30, 41, 59, 0.15)` + `backdrop-filter: blur(4px)`
- JavaScript: `components.js` - `renderNavigation()` dynamically builds menu from data structure

**Key Features**:
- Hover-based (not click-based) interaction
- Menu replaces icon when expanded (icon fades out)
- Submenus expand on hover with smooth max-height transitions
- Fixed width (200px) prevents collapse when moving between items
- "About" link is first item, left-justified

**Animation Details**:
- Transition: `0.3s cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy easing)
- Border-radius transitions smoothly from circle to rounded rectangle
- Icon opacity fades to 0 when menu expands

### 3. Vector Field Background

**Location**: `docs/assets/js/vector-field.js`

**Design**:
- Physics-inspired interactive visualization
- Vector arrows point toward cursor position
- Color gradient based on distance from cursor (blue → purple → gray)
- Instant response (no persistence, like magnetic field)
- Subtle opacity (40% canvas opacity)

**Implementation**:
- **Class**: `VectorField` (ES6 class)
- **Canvas**: Fixed position, full viewport, z-index 0
- **Grid System**: 40px spacing between field lines
- **Physics**: Inverse square law for field strength calculation
- **Rendering**: `requestAnimationFrame` loop, clears completely each frame

**Key Features**:
- **Field Calculation**: `calculateField(x, y)` computes direction and strength
- **Color Mapping**: `getColor(distance)` returns rgba color based on proximity
- **Theme Awareness**: Colors adapt to dark/light mode
- **Performance**: Efficient grid-based calculation, only draws visible vectors

**Technical Details**:
```javascript
// Field strength uses inverse square law
const strength = 1 / (distance * 0.01 + 0.1);
const normalizedStrength = Math.min(strength, 2);

// Color gradient: close = bright blue, far = gray
// Dark mode: cyan → blue → purple
// Light mode: blue → purple → gray
```

**Parameters** (customizable in `vector-field.js`):
- `gridSize: 40` - Spacing between vectors
- `lineLength: 25` - Length of each arrow
- Canvas opacity: `0.6` (set in inline styles)

### 4. Theme Toggle

**Location**: `docs/assets/css/main.css`, `docs/assets/js/components.js`

**Design**:
- Fixed position in top-right corner
- Circular button with vector lineart icons (sun/moon SVG)
- Transparent background (only shows on hover)
- Smooth scale animation on hover
- **Radial transition effect**: Theme change expands radially from button position

**Implementation**:
- JavaScript: `initThemeToggle()` creates button dynamically
- CSS: `.theme-toggle` class with transparent background
- Storage: Uses `localStorage` to persist theme preference
- Toggle: Switches between `data-theme="dark"` and `data-theme="light"` attributes
- **Icons**: Inline SVG icons (sun with rays, crescent moon) - no emoji dependencies
- **Radial Transition**: Uses `clip-path: circle()` to create expanding circle effect from button

**Theme Transition**:
- Creates overlay div at button position
- Expands from 0% to 150% using `clip-path: circle()`
- Only affects background color, content remains visible and interactive
- Smooth 600ms transition with cubic-bezier easing

**Theme Variables**:
- Dark mode: Default `:root` variables
- Light mode: `[data-theme="light"]` selector overrides colors
- Smooth transitions on all color properties

### 5. Home Button

**Location**: `docs/assets/css/main.css`, `docs/assets/js/components.js`

**Design**:
- Fixed position in top-left corner (only on non-homepage pages)
- Vector lineart house icon (SVG)
- Same styling as theme toggle (transparent, circular)
- Appears automatically on all pages except `index.html`

**Implementation**:
- JavaScript: `initHomeButton()` checks current page and creates button if not homepage
- CSS: `.home-button` class matches theme toggle styling
- Link: Points to `index.html`
- **Icon**: Inline SVG house icon (roof, walls, door) - no emoji dependencies
- Icons use `stroke="currentColor"` to inherit text color and change on hover

### 6. Footer

**Location**: `docs/assets/css/components.css`, `docs/assets/js/components.js`

**Design**:
- Frosted glass effect (semi-transparent with backdrop blur)
- Grid layout for responsive columns
- Contact information and site description
- Subtle top border

**Implementation**:
- HTML: Dynamically generated by `renderFooter()` function
- CSS: `.site-footer` with frosted glass styling
- Layout: CSS Grid with `repeat(auto-fit, minmax(200px, 1fr))`

**Frosted Glass**:
```css
background: rgba(30, 41, 59, 0.15); /* 15% opacity */
backdrop-filter: blur(4px) saturate(180%);
```

### 7. Cycling Subtitle

**Location**: `docs/assets/js/main.js`

**Design**:
- Rotates through different roles/identities
- **Typewriter effect**: Deletes characters one by one, then types new text
- Blinking cursor effect
- 3-second intervals between changes

**Implementation**:
- Function: `initCyclingText()` in `main.js`
- Roles array: `['physicist', 'programmer', 'jazz pianist', 'archer', 'visual artist', 'tennis player', 'skier', 'problem solver']`
- **Animation**: Typewriter effect (not fade)
  - Deletes current text character by character (30ms per char)
  - Pauses 200ms
  - Types new text character by character (50ms per char)
  - Waits 3 seconds before next cycle
- Cursor: CSS `::after` pseudo-element with blinking animation

**Key Features**:
- Smooth character-by-character deletion
- Character-by-character typing
- Faster deletion than typing for better UX
- Maintains cursor position during transitions

**Customization**:
Edit the `roles` array in `main.js` to change the cycling text. Adjust `typeSpeed` (50ms) and `deleteSpeed` (30ms) for different speeds.

### 8. Page Navigation (Right-Side Navigation)

**Location**: `docs/assets/js/page-nav.js`, `docs/assets/css/components.css`

**Design**:
- Fixed position in top-right corner, below hamburger menu and theme toggle
- Right-justified navigation with vertical line indicator
- Only displays Level 1 (H1) headers from page content
- Fades in when user scrolls down, fades out when at top of page
- Active section text expands with smooth animation
- Minimal spacing, compact design

**Implementation**:
- JavaScript: `PageNavigation` class in `page-nav.js`
- CSS: `.page-nav`, `.page-nav-list`, `.page-nav-link` classes
- **Robust Design**: Works on any page with H1 headings, regardless of HTML structure
- **Auto-ID Generation**: Automatically creates IDs for headings that don't have them
- **Scroll Tracking**: Uses Intersection Observer and scroll listeners for accurate section detection

**Key Features**:
- **Fade In/Out**: Navigation fades in when scroll > 100px, fades out at top
- **Level 1 Only**: Only shows H1 headings (subsections ignored)
- **Active Highlighting**: Current section text expands and changes color
- **Smooth Scrolling**: Click navigation items to smoothly scroll to sections
- **"Top" Link**: Includes a "top" link that scrolls to the top of the page
- **Theme Aware**: Colors adapt to dark/light mode
- **Responsive**: Hidden on mobile devices (< 768px)

**Technical Details**:
- Finds H1 elements in common content containers (`main`, `.page-content`, `.content`, `article`) or falls back to `body`
- Skips headings in hero sections, navigation menus, and headers
- Generates URL-friendly IDs using slug conversion (lowercase, hyphens)
- Uses both section elements and heading elements for intersection observation
- Smooth transitions with `cubic-bezier` easing

**Usage**:
Add `<nav class="page-nav" id="pageNav" aria-label="Page navigation"></nav>` to any page and include `page-nav.js` script. The component automatically finds and creates navigation for all H1 headings.

### 9. Google Analytics

**Location**: All HTML pages (`<head>` section)

**Implementation**:
- Google Analytics (gtag.js) tracking code included in all HTML pages
- Tracking ID: `G-NK15EEMEB2`
- Async script loading for performance
- Automatically tracks page views and user interactions

**Code Location**:
- Inline script in `<head>` of all HTML files
- Also available in `docs/analytics.html` for reference

### 10. Content Pages

**Location**: `docs/about.html`, `docs/art.html`, etc.

**Design**:
- Centered content with `.container-narrow` (max-width: 800px)
- Consistent typography hierarchy
- Hover effects on links (underline animation)
- Responsive images and iframes

**Implementation**:
- Layout: `.container-narrow` class for centered content
- Typography: Consistent heading sizes and spacing
- Links: Animated underline on hover using `::after` pseudo-element
- Images: Rounded corners, responsive sizing

---

## Theme System

### Dark Mode (Default)

**Color Palette**:
- Background: `#0f172a` (deep blue)
- Text: `#f9fafb` (light gray)
- Primary: `#60a5fa` (light blue)
- Accent: `#a78bfa` (light purple)

**Vector Field Colors**:
- Close to cursor: Cyan/blue (bright)
- Medium distance: Blue
- Far from cursor: Purple/gray (faded)

### Light Mode

**Color Palette**:
- Background: `#ffffff` (white)
- Text: `#1f2937` (dark gray)
- Primary: `#2563eb` (blue)
- Accent: `#8b5cf6` (purple)

**Vector Field Colors**:
- Close to cursor: Blue
- Medium distance: Purple
- Far from cursor: Gray

### Theme Switching

**Implementation**:
1. User clicks theme toggle button
2. **Radial transition overlay** created at button position
3. JavaScript sets `data-theme` attribute on `<html>` element immediately
4. CSS `[data-theme="light"]` selector overrides variables
5. Overlay expands radially using `clip-path: circle()` from button position
6. Preference saved to `localStorage`
7. All colors transition smoothly (300ms for elements, 600ms for radial wipe)

**Radial Transition**:
- Creates full-viewport overlay with new background color
- Uses `clip-path: circle(0% → 150%)` for radial expansion
- Positioned at `z-index: 0` (behind content, above body background)
- `pointer-events: none` ensures content remains interactive
- Smooth 600ms transition with cubic-bezier easing

**Variables Overridden**:
- All color variables (primary, text, background, etc.)
- Shadow variables (lighter shadows in light mode)

---

## File Structure

```
docs/
├── index.html              # Homepage
├── about.html              # About page
├── art.html                # Art portfolio
├── music.html              # Music portfolio
├── projects.html           # Projects portfolio
├── thoughts.html           # Thoughts/blog
├── 404.html                # Custom 404 page
├── CNAME                   # Custom domain configuration
├── robots.txt              # SEO: Search engine crawler guidance
├── sitemap.xml             # SEO: Site structure for search engines
├── content/                 # Markdown content files (editing source)
│   ├── index.md            # Homepage content
│   ├── about.md             # About page content
│   ├── art.md               # Art page content
│   ├── music.md             # Music page content
│   ├── projects.md          # Projects page content
│   └── thoughts.md          # Thoughts page content
├── assets/
│   ├── css/
│   │   ├── main.css        # Design system, base styles, theme toggle
│   │   └── components.css  # Component styles (menu, hero, footer, etc.)
│   ├── js/
│   │   ├── config.js       # Site configuration (navigation, roles, footer)
│   │   ├── components.js   # Navigation, footer, theme toggle, home button
│   │   ├── main.js         # Cycling subtitle, smooth scrolling
│   │   ├── page-nav.js     # Page navigation component (right-side nav)
│   │   └── vector-field.js # Vector field visualization
│   ├── images/
│   │   ├── art/            # Art portfolio images
│   │   ├── profile.png      # Profile picture
│   │   └── caution.png      # 404 page image
│   ├── favicons/
│   │   └── favicon.ico
│   └── resume.pdf
└── DESIGN_SYSTEM.md        # Additional design documentation
```

### Key Files

**`docs/assets/css/main.css`**:
- CSS variables (design system)
- Base styles and reset
- Typography
- Layout utilities
- Theme toggle styles
- Home button styles
- File header with documentation

**`docs/assets/css/components.css`**:
- Navigation menu (hamburger)
- Hero section
- Footer
- Content page styles
- Animations
- File header with documentation

**`docs/assets/js/config.js`**:
- `navigationData` - Site navigation structure
- `cyclingRoles` - Roles for homepage subtitle
- `footerConfig` - Footer content configuration
- Centralized constants for easy customization

**`docs/assets/js/components.js`**:
- `renderNavigation()` - Builds menu dynamically from config
- `renderFooter()` - Builds footer dynamically from config
- `initThemeToggle()` - Theme switching with radial transition
- `initHomeButton()` - Home button on non-homepage pages
- Full JSDoc documentation for all functions

**`docs/assets/js/main.js`**:
- `initCyclingText()` - Typewriter effect for rotating subtitle
- `initSmoothScrolling()` - Smooth scroll for anchor links
- `initScrollAnimations()` - Scroll-triggered fade-in animations
- Full JSDoc documentation

**`docs/assets/js/vector-field.js`**:
- `VectorField` class - Main visualization with full JSDoc
- Canvas setup and rendering
- Mouse tracking
- Field calculations (inverse square law)
- Color mapping (theme-aware)
- All methods documented with JSDoc

**`docs/assets/js/page-nav.js`**:
- `PageNavigation` class - Right-side page navigation component
- Automatically finds H1 headings on any page
- Scroll tracking with Intersection Observer
- Fade in/out based on scroll position
- Active section highlighting with expanding text
- Auto-ID generation for headings without IDs
- Full JSDoc documentation

---

## Deployment

### GitHub Pages Setup

1. **Source**: Site deploys from `/docs` folder
2. **Settings**: GitHub Pages → Source: `/docs` folder
3. **Custom Domain**: `CNAME` file contains `www.nmokey.com`
4. **No Build**: Direct HTML/CSS/JS, no build process needed

### Deployment Process

1. Push changes to `main` branch
2. GitHub Pages automatically builds from `/docs`
3. Site available at `https://nmokey.github.io` and `https://nmokey.com`

### Files Required for Deployment

- All HTML files in `/docs`
- All assets in `/docs/assets/`
- `CNAME` file for custom domain
- `robots.txt` and `sitemap.xml` for SEO
- No build artifacts needed

---

## SEO Optimization

The site is optimized for search engines to help recruiters and friends find Ryan Zheng easily, especially when searching with keywords like "UCLA", "physics", "Scale AI", etc.

### Implemented SEO Features

#### 1. Enhanced Meta Tags
- **Title Tag**: "Ryan Zheng - Physics Student at UCLA | AI Researcher | Scale AI Intern"
  - Includes key identifiers: name, school (UCLA), field (Physics), role (AI Researcher), company (Scale AI)
- **Meta Description**: Comprehensive description with keywords (UCLA, Physics, Data Science, Scale AI, ACM AI, AI researcher, machine learning)
- **Keywords Meta Tag**: Comprehensive list of relevant keywords
- **Author Tag**: Identifies content creator
- **Robots Meta**: Explicitly allows indexing

#### 2. Open Graph Tags (Social Media)
- Enables rich previews when sharing on Facebook, LinkedIn, etc.
- Includes: title, description, image, URL
- Helps with professional networking and sharing

#### 3. Twitter Card Tags
- Optimized previews for Twitter/X
- Large image card format for better visibility

#### 4. Structured Data (JSON-LD)
- **Person Schema**: Tells search engines who Ryan is
  - Name, job title, employer (Scale AI)
  - Education (UCLA)
  - Skills and expertise areas
  - Social media profiles (GitHub, LinkedIn, Kaggle)
  - Organization memberships (ACM AI @ UCLA)
- Helps Google create rich snippets and knowledge panels
- Located in `<head>` section of `index.html`

#### 5. Canonical URLs
- Prevents duplicate content issues
- Ensures search engines know the primary URL

#### 6. Enhanced Alt Text
- Profile image includes descriptive alt text with keywords
- Helps with image search and accessibility

#### 7. robots.txt
- Guides search engine crawlers
- Points to sitemap for efficient crawling
- Located at `docs/robots.txt`

#### 8. XML Sitemap
- Lists all important pages with priorities
- Helps search engines discover and index all pages
- Includes lastmod dates for freshness
- Located at `docs/sitemap.xml`

### Key Search Terms Optimized

The site is optimized for searches like:
- "Ryan Zheng UCLA"
- "Ryan Zheng physics"
- "Ryan Zheng Scale AI"
- "Ryan Zheng ACM AI"
- "UCLA physics student AI"
- "Scale AI intern UCLA"
- "Ryan Zheng machine learning"
- "Ryan Zheng PyTorch"

### Natural Keyword Placement

Keywords appear naturally in:
- Page titles
- Meta descriptions
- Structured data (JSON-LD)
- Content headings (H1, H2)
- Alt text
- URL structure

### Updating SEO Elements

**When updating personal information (job, school, etc.), update these locations:**

1. **Meta Tags** (in `<head>` of `index.html`):
   - `<title>` tag
   - `<meta name="description">`
   - `<meta name="keywords">`
   - Open Graph tags (`og:title`, `og:description`)
   - Twitter Card tags

2. **Structured Data** (JSON-LD in `<head>` of `index.html`):
   - `jobTitle`
   - `worksFor.name` (employer)
   - `alumniOf.name` (school)
   - `knowsAbout` array (skills)
   - `memberOf.name` (organizations)
   - `sameAs` array (social media links)

3. **Alt Text** (on profile image):
   - Update `alt` attribute with current keywords

4. **Sitemap** (`docs/sitemap.xml`):
   - Update `lastmod` dates when pages change
   - Add new pages as they're created

### Testing SEO

Use these tools to verify SEO implementation:
- [Google Rich Results Test](https://search.google.com/test/rich-results) - Test structured data
- [Schema.org Validator](https://validator.schema.org/) - Validate JSON-LD
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) - Test Open Graph tags
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) - Test Twitter Cards

### Next Steps (Optional)

1. **Google Search Console**: Submit sitemap and monitor search performance
2. **LinkedIn Profile**: Ensure it links back to nmokey.com
3. **GitHub Profile**: Add link to website in bio
4. **Regular Content Updates**: Fresh content helps SEO
5. **Backlinks**: Get other sites to link to your site (LinkedIn, GitHub, etc.)

### Notes for Future Agents

- The structured data uses Schema.org Person type, which is recognized by Google
- All keywords should be naturally integrated - avoid keyword stuffing
- When updating personal info, ensure consistency across meta tags, structured data, and content
- Other pages (about, projects, etc.) can be updated similarly for consistency
- The site maintains its minimalist design while being SEO-friendly

---

## Customization Guide

### Changing Colors

Edit CSS variables in `docs/assets/css/main.css`:

```css
:root {
  --color-primary: #your-color;
  --color-accent: #your-accent;
  /* etc. */
}
```

### Adjusting Frosted Glass Opacity

Edit in `docs/assets/css/components.css`:

**Navigation Menu** (line ~98):
```css
background: rgba(30, 41, 59, 0.15); /* Change 0.15 (0.0-1.0) */
backdrop-filter: blur(4px); /* Change 4px for blur amount */
```

**Footer** (line ~408):
```css
background: rgba(30, 41, 59, 0.15); /* Change 0.15 */
backdrop-filter: blur(4px); /* Change 4px */
```

### Modifying Vector Field

Edit parameters in `docs/assets/js/vector-field.js`:

```javascript
this.gridSize = 40;      // Spacing between vectors
this.lineLength = 25;    // Length of arrows
canvas.style.opacity = '0.6'; // Overall opacity
```

### Changing Cycling Subtitle

Edit `cyclingRoles` array in `docs/assets/js/config.js`:

```javascript
const cyclingRoles = [
  'your role 1',
  'your role 2',
  // etc.
];
```

### Adding New Pages

1. Create new HTML file in `/docs/` (copy structure from existing page)
2. Create corresponding markdown file in `/docs/content/` (e.g., `newpage.md`)
3. Add navigation link in `docs/assets/js/config.js` → `navigationData`
4. Edit content in markdown file, then sync to HTML using an AI agent

### Modifying Navigation

Edit `navigationData` object in `docs/assets/js/config.js`:

```javascript
const navigationData = {
  pages: [
    {
      name: "your-page",
      link: "your-page.html"
    },
    // etc.
  ]
};
```

### Updating Page Content

**Recommended Workflow:**
1. Edit the markdown file in `/docs/content/` (e.g., `about.md`)
2. Request an AI agent to sync changes from markdown to the corresponding HTML file
3. The agent will update only the content section, preserving HTML structure (head, navigation, scripts, etc.)

**Example:**
- Edit `docs/content/about.md` to update the about page content
- Ask: "Update about.html to reflect the changes in content/about.md"
- The agent will update the `<main>` content section while keeping all HTML structure intact

**Note**: HTML files are the source of truth for deployment. Markdown files are editing conveniences and are not deployed.

---

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Features Used**:
  - CSS Custom Properties (variables)
  - `backdrop-filter` (frosted glass)
  - Canvas API
  - ES6+ JavaScript
  - CSS Grid and Flexbox

**Fallbacks**:
- Frosted glass degrades gracefully (becomes more opaque)
- Vector field works in all modern browsers
- Theme toggle works in all browsers with localStorage

---

## Performance Considerations

### Optimizations

1. **No Dependencies**: Pure vanilla JavaScript, no frameworks
2. **System Fonts**: Uses system font stack for fast loading
3. **Canvas Optimization**: Only draws visible vectors, efficient calculations
4. **CSS Variables**: Fast theme switching without repaints
5. **Minimal Assets**: Optimized images, no heavy libraries

### Loading

- **HTML**: Minimal, semantic markup
- **CSS**: Two files (~15KB total)
- **JavaScript**: Three files (~8KB total)
- **Images**: Optimized, lazy-loaded where possible

---

## Future Enhancements

Potential improvements for future development:

- [ ] Add more art portfolio images with lightbox
- [ ] Implement blog post system for thoughts page
- [ ] Add project detail pages
- [ ] Enhance mobile menu experience
- [ ] Add more vector field customization options
- [ ] Implement smooth page transitions
- [ ] Add loading animations

---

## Code Organization

### File Structure Philosophy

The codebase is organized for maximum maintainability and clarity:

1. **Configuration First**: `config.js` contains all site-wide constants (navigation, roles, footer content)
2. **Modular JavaScript**: Each JS file has a single responsibility:
   - `config.js` - Configuration constants
   - `components.js` - UI component initialization
   - `main.js` - Core site functionality
   - `vector-field.js` - Background visualization
3. **CSS Separation**: 
   - `main.css` - Design system and base styles
   - `components.css` - Component-specific styles
4. **Documentation**: All files include:
   - File headers with purpose and overview
   - JSDoc comments for all functions
   - Inline comments for complex logic

### Code Quality

- **JSDoc Documentation**: All JavaScript functions are documented with JSDoc comments
- **File Headers**: Every file includes a header explaining its purpose
- **Consistent Style**: Uniform code formatting and naming conventions
- **Easy Customization**: Configuration values are centralized in `config.js`

## Credits

- **Design**: Custom design system inspired by modern minimalist aesthetics
- **Vector Field**: Physics-inspired visualization reflecting physics background
- **Icons**: Vector lineart SVG icons (home, sun, moon) - clean, scalable, no emoji dependencies
- **Fonts**: System font stack for performance
- **Code Organization**: Modular structure with comprehensive documentation

---

## License

Personal portfolio website - all rights reserved.

---

## Contact

- **Website**: [nmokey.com](https://nmokey.com)
- **GitHub**: [@nmokey](https://github.com/nmokey)
- **Email**: ryanzheng@nmokey.com

---

*Last updated: 2024*
