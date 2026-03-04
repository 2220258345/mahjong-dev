# AGENTS.md - 電脳麻将 (Majiang) Development Guide

## Project Overview

**電脳麻将** is an HTML5 + JavaScript Mahjong game application. This is a frontend-only project that builds static assets served from the `dist/` directory.

**Key Dependencies:**
- `@kobalab/majiang-core` - Core game logic (shanten calculation, scoring, game progression)
- `@kobalab/majiang-ai` - AI implementation for computer players
- `@kobalab/majiang-ui` - UI components (hand display, board, replay viewer)
- `jquery` - DOM manipulation

---

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Full debug build (HTML + CSS + JS) |
| `npm run build:html` | Build HTML from Pug templates |
| `npm run build:css` | Compile Stylus to CSS |
| `npm run build:js` | Bundle JavaScript with Webpack (development mode) |
| `npm run release` | Production build (minified) |
| `npm run clean` | Remove built files from `dist/` |

**No test framework** - This project does not have automated tests. Manual testing is done by opening `dist/index.html` in a browser.

**No linter** - No ESLint, Prettier, or EditorConfig configured. Follow existing code style manually.

---

## Project Structure

```
Majiang/
├── src/
│   ├── js/           # JavaScript source files
│   │   ├── conf/     # Configuration (rule.json)
│   │   ├── majiang.js    # Main entry - loads core libraries
│   │   ├── index.js      # Game start page logic
│   │   ├── autoplay.js   # Auto-play mode
│   │   ├── netplay.js    # Network play
│   │   ├── paipu.js      # Replay viewer
│   │   ├── drill.js      # Scoring drill
│   │   └── ...
│   ├── css/          # Stylus stylesheets
│   │   ├── index.styl    # Main import file
│   │   ├── board.styl    # Game board styles
│   │   ├── pai.styl      # Tile styles
│   │   └── ...
│   └── html/         # Pug templates
│       ├── page/     # Page templates (index.pug, paipu.pug, etc.)
│       └── inc/      # Shared components (board.pug, player.pug, etc.)
├── dist/             # Built output (served to browser)
│   ├── js/           # Bundled JavaScript
│   ├── css/          # Compiled CSS
│   ├── img/          # Tile images and UI assets
│   └── audio/        # Sound effects
├── package.json
├── webpack.config.js
└── README.md
```

---

## Code Style Guidelines

### JavaScript

**General:**
- Use `"use strict";` at top of files
- 4-space indentation (no tabs)
- Semicolons required
- Single quotes for strings
- Mix of ES5 and ES6 features

**Imports/Requires:**
```javascript
// CommonJS require for libraries
const Majiang = require('@kobalab/majiang-core');
const $ = require('jquery');

// Destructuring for utilities
const { hide, show, fadeIn } = Majiang.UI.Util;
```

**Naming Conventions:**
- Constructors: PascalCase (`Majiang.UI.Player`, `Majiang.Game`)
- Functions/variables: camelCase (`start`, `paipu_list`)
- Constants: ALL_CAPS (rarely used)
- jQuery selectors: `$` prefix (`$('#board')`)

**DOM Manipulation:**
```javascript
// jQuery-style everywhere
$(function(){
    $('#element').on('click', handler);
    $('body').addClass('analyzer');
});
```

**Error Handling:**
- Minimal error handling in UI code
- Errors generally bubble up uncaught
- No try/catch in most user interaction code

### CSS (Stylus)

**Structure:**
- Import-based modular architecture
- `index.styl` imports all component stylesheets
- Mobile-responsive with media queries

**Conventions:**
```stylus
@charset "UTF-8"
@import "base"
@import "pai"

@media screen and (max-height: 450px)
    @import "tablet"
```

- No CSS variables
- Nested selectors follow HTML structure
- Japanese comments acceptable

### HTML (Pug)

**Templates:**
- Pug templates in `src/html/page/` and `src/html/inc/`
- Components split into `inc/` (shared) and `page/` (full pages)
- Build outputs to `dist/*.html`

---

## Development Workflow

### 1. Setup
```bash
npm install
```

### 2. Build for Development
```bash
npm run build
# Open dist/index.html in browser
```

### 3. Build for Production
```bash
npm run release
```

### 4. View in Browser
Open `dist/index.html` directly or serve with a static server:
```bash
npx serve dist
# Then open http://localhost:3000
```

### 5. Debugging
- Development build includes `inline-source-map`
- Use browser DevTools for debugging
- Console logs are primary debug mechanism

---

## Git Configuration

**Branch:** `main`

**`.gitignore`:**
```
node_modules/
dist/js/
dist/css/
dist/*.html
```

**What to commit:**
- Source files (`src/`)
- Configuration files
- Static assets (`dist/img/`, `dist/audio/`)
- Built files are mostly ignored except images/audio

**What NOT to commit:**
- `node_modules/`
- Built JavaScript, CSS, HTML (regenerated on build)

---

## Key Architecture Patterns

### MVC Pattern
- **Model**: `Majiang` core classes (game state, hand management)
- **View**: `Majiang.UI.*` classes (board, hand display)
- **Controller**: Page-specific JS files (index.js, paipu.js)

### Module Organization
```javascript
// Core library structure
global.Majiang      // Core game logic
global.Majiang.AI   // AI implementations
global.Majiang.UI   // UI components
global.Majiang.VERSION
```

### Game Flow
1. Initialize libraries in `majiang.js`
2. Page-specific logic in respective files (e.g., `index.js`)
3. Create `Majiang.Game` with players and rules
4. UI renders via `Majiang.UI.Board`
5. Game state changes trigger view updates

---

## Common Tasks

### Adding a New Page
1. Create `src/html/page/yourpage.pug`
2. Add entry point in `webpack.config.js`
3. Create `src/js/yourpage.js`
4. Add build script for HTML in `package.json`

### Modifying Game Rules
- Edit `src/js/conf/rule.json` for default rules
- Rules stored in `localStorage` as `Majiang.rule`

### Changing UI Components
- Shared UI: Modify `src/html/inc/*.pug`
- Page-specific: Modify `src/html/page/*.pug`
- Styles: Add/edit `src/css/*.styl`

### Adding AI Logic
- AI extends `Majiang.Player` from `@kobalab/majiang-ai`
- Implement decision methods for discarding, calling, etc.

---

## External Resources

- **Official Demo**: https://kobalab.net/majiang/
- **GitHub**: https://github.com/kobalab/Majiang
- **Author Blog**: https://blog.kobalab.net/ (development articles, Japanese)
- **Book**: 「対戦型麻雀ゲーム AI のアルゴリズムと実装」(covers majiang-core and majiang-ai)

---

## Notes for Agentic Coders

1. **No TypeScript** - Pure JavaScript, no type checking
2. **No tests** - Verify changes manually in browser
3. **Japanese comments** - Code comments are in Japanese; functionality is self-documenting
4. **jQuery everywhere** - Modern Vanilla JS not used; follow jQuery patterns
5. **Build before serve** - Always run `npm run build` after source changes
6. **Check dist/** - Built files in `dist/img/` and `dist/audio/` are tracked; JS/CSS/HTML are not
