# Design Guidelines: LLM Sliding Puzzle Benchmark Dashboard

## Design Approach
**System-Based: Material Design** - Chosen for its excellent data visualization patterns, clear status indicators, and support for real-time interfaces. This technical dashboard requires clarity, hierarchy, and efficient information density.

## Core Design Principles
1. **Information Clarity**: Multi-game monitoring demands instant visual comprehension
2. **Real-time Feedback**: Animations and status changes must be immediately apparent
3. **Density with Breathing Room**: Pack information efficiently while maintaining scannability
4. **Functional Hierarchy**: Statistics and controls are primary; decoration is minimal

---

## Typography System

**Font Stack**: Inter (via Google Fonts CDN) - excellent for data-dense interfaces with superior number readability

- **Headings**: 
  - H1 (Dashboard Title): 2xl, font-semibold
  - H2 (Section Headers): xl, font-semibold  
  - H3 (Game Card Titles): lg, font-medium

- **Body Text**:
  - Primary stats/labels: base, font-medium
  - Secondary info: sm, font-normal
  - Micro-copy (timestamps): xs, font-normal

- **Monospace Numbers**: Use `font-mono` for move counts, timers, and IDs to maintain alignment

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8
- Tight spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, gap-4 (between related elements)
- Section spacing: p-6, py-8 (major sections)
- Container padding: px-8, py-6

**Grid Architecture**:
- Main container: max-w-screen-2xl mx-auto px-8
- Games grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Each game card uses internal padding of p-6

---

## Component Library

### 1. Dashboard Header
- Full-width sticky header with controls
- Contains: Title, "New Run" button, active games counter
- Height: Fixed at h-16 with shadow-sm
- Layout: Flex justify-between items-center

### 2. Configuration Panel (Collapsible)
- Form fields: Model ID dropdown, Size input, Max Moves, Scramble Depth
- Layout: Grid grid-cols-2 md:grid-cols-4 gap-4
- Submit button: Primary action (right-aligned)

### 3. Game Card
**Structure**:
- Card container with border, rounded-lg, shadow-md
- Header: Game ID (truncated), Model name, Status badge
- Puzzle board visualization (responsive square)
- Stats row: Move count, Solve progress percentage
- Footer: Timestamp, legal/illegal move indicators

**Puzzle Board**:
- Square aspect-ratio container
- Grid matching puzzle size (3x3, 4x4, etc.)
- Each tile: Aspect-ratio-square with centered number
- Blank tile: Dashed border, lower opacity
- Tile animations: transition-all duration-200 for moves

### 4. Status Indicators
**Badge System**:
- In Progress: Rounded-full px-3 py-1 text-xs font-medium
- Solved: Green indicator with checkmark icon
- Failed: Red indicator with X icon  
- Aborted: Gray indicator

### 5. Statistics Bar (Per Game)
- Horizontal layout with dividers
- Icons from Heroicons (chart-bar, clock, check-circle)
- Format: Icon + Number + Label in vertical micro-layout

### 6. Move History Timeline (Expandable)
- Chronological list within game card
- Each entry: Timestamp, Move direction, Legal/Parse status
- Color-coded: Green (legal), Red (illegal), Yellow (parse error)
- Max height with scroll: max-h-48 overflow-y-auto

---

## Real-Time Features

### WebSocket Status Indicator
- Small circular badge in dashboard header
- Pulsing animation when connected: animate-pulse
- Solid when stable, red when disconnected

### Live Tile Animations
- Slide transitions when tiles move: transform + transition-transform
- Highlight effect on moved tile: brief opacity change
- No excessive motion - keep animations under 200ms

### Auto-Scroll Behavior
- New games appear at top of grid
- No automatic scrolling when user is viewing specific game
- Subtle highlight flash on newly completed games

---

## Data Visualization

### Progress Indicators
- Linear progress bar showing (moves made / max moves)
- Percentage text overlay on bar
- Color transitions: blue → yellow (approaching limit) → red (near failure)

### Statistics Dashboard (Above Games Grid)
- Summary cards: Total runs, Success rate, Average moves, Average latency
- Card layout: grid grid-cols-2 md:grid-cols-4 gap-4
- Large numbers (text-3xl font-bold) with small labels below

---

## Interaction Patterns

### Game Card Hover
- Subtle elevation increase: hover:shadow-lg
- Border accent on hover
- No disruptive animations

### Click to Expand
- Game cards expand to show full move history
- Smooth max-height transition
- Click outside or icon to collapse

### Form Controls
- Standard input styling with focus rings
- Disabled states when benchmark running
- Inline validation messages

---

## Responsive Behavior

**Breakpoints**:
- Mobile (base): Single column games, stacked stats
- Tablet (md): 2-column game grid
- Desktop (lg): 3-column game grid  
- Large (xl): 4-column game grid

**Header**: Collapses to hamburger menu on mobile, controls move to dropdown

---

## Performance Considerations

- Limit simultaneous visible games to 20 (pagination for more)
- Use CSS transforms for animations (GPU-accelerated)
- Debounce WebSocket updates if >10 games updating simultaneously
- Lazy-render move history until expanded

---

## Accessibility

- ARIA labels on all status badges
- Keyboard navigation for expanding game cards
- Focus management for form controls
- Color not sole indicator (use icons + text)
- Screen reader announcements for game completions