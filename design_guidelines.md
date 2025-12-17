# Design Guidelines: Collaborative Task Management Application

## Design Approach

**Reference-Based:** Drawing inspiration from **Linear** (modern task management), **Notion** (productivity focus), and **Asana** (dashboard clarity)

**Core Principles:**
- **Clarity over decoration** - Every element serves a functional purpose
- **Information density** - Maximize useful data display without overwhelming users
- **Speed perception** - Fast-feeling interactions through optimistic updates and skeleton states
- **Purposeful hierarchy** - Clear visual distinction between task priorities and statuses

---

## Typography System

**Font Family:** Inter via Google Fonts CDN (primary), system-ui fallback

**Hierarchy:**
- **Page Titles:** text-3xl, font-bold (Dashboard, My Tasks)
- **Section Headers:** text-xl, font-semibold (Task Lists, Filters)
- **Task Titles:** text-base, font-medium
- **Body Text:** text-sm, font-normal (descriptions, metadata)
- **Labels/Captions:** text-xs, font-medium, uppercase tracking-wide
- **Buttons:** text-sm, font-semibold

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16 (e.g., p-4, gap-6, mt-8)

**Container Strategy:**
- **App Shell:** Fixed sidebar (w-64) on desktop, collapsible drawer on mobile
- **Main Content:** max-w-7xl mx-auto with px-6 py-8 padding
- **Cards/Panels:** p-6 for content areas, p-4 for compact components

**Grid Patterns:**
- **Dashboard Stats:** 3-column grid on desktop (grid-cols-3 gap-4), single column on mobile
- **Task Lists:** Full-width stacked cards with gap-3
- **Task Details Modal:** Single column, max-w-2xl centered

---

## Component Library

### Navigation
**Sidebar (Desktop):**
- Fixed left navigation w-64
- Logo/brand at top (h-16 flex items-center px-6)
- Navigation items with icon + label, py-3 px-4
- User profile section at bottom with avatar, name, logout
- Active state: subtle background treatment

**Mobile Header:**
- h-16 with hamburger menu button, app logo/title, user avatar
- Slide-out drawer navigation overlaying content

### Dashboard Cards
**Stats Cards (3-column):**
- Rounded corners (rounded-lg)
- Padding p-6
- Icon (w-10 h-10) + stat number (text-3xl font-bold) + label (text-sm)
- Subtle border treatment

**Task Overview Cards:**
- Section header with count badge
- Scrollable task list (max-h-96 overflow-y-auto)
- Empty states with icon + message

### Task Components
**Task Card:**
- Rounded-lg, p-4 spacing
- Top row: Checkbox (w-5 h-5) + Task title (flex-1, truncate) + Priority badge
- Second row: Due date icon + date, Assignee avatar (if assigned), Status badge
- Hover state: elevated shadow, cursor-pointer
- Click: Opens task detail modal

**Priority Badges:**
- Small pill badges (px-2.5 py-0.5, rounded-full, text-xs font-medium)
- Urgent/High/Medium/Low with distinct visual weights

**Status Badges:**
- Larger pills (px-3 py-1, rounded-md, text-sm font-medium)
- To Do / In Progress / Review / Completed

**Task Detail Modal:**
- Overlay with backdrop-blur
- Modal container: max-w-2xl, rounded-xl, p-8
- Header: Title (editable inline), close button, action buttons (Save, Delete)
- Form sections with clear labels, adequate spacing (space-y-6)
- Full-width textarea for description (min-h-32)
- Date picker, priority dropdown, assignee selector, status selector
- Action buttons at bottom (sticky footer)

### Forms & Inputs
**Input Fields:**
- Border treatment with rounded-md
- px-4 py-2 sizing for text inputs
- Focus states with ring treatment
- Label above input (text-sm font-medium mb-2)
- Error states with red accent and message (text-xs mt-1)

**Dropdowns/Selects:**
- Matches input styling
- Chevron icon on right
- Dropdown menu with rounded-lg, shadow-lg, max-h-60 overflow-auto

**Buttons:**
- **Primary:** px-4 py-2, rounded-md, font-semibold, transition
- **Secondary:** Similar sizing, outlined treatment
- **Icon Buttons:** p-2, rounded-md, icon only (w-5 h-5)
- **Hover:** Slight scale transform (scale-105) or opacity change

### Filters & Sorting
**Filter Bar:**
- Horizontal layout with gap-3
- Dropdown filters for Status, Priority, Assignee
- Sort dropdown (Due Date, Created Date, Priority)
- Clear filters button (text-sm, underline)

### Real-time Indicators
**Notification Toast:**
- Fixed bottom-right position
- Slide-in animation
- Icon + message + dismiss button
- Auto-dismiss after 4 seconds
- Stack multiple notifications with gap-2

**Live Update Indicator:**
- Small pulsing dot next to updated tasks
- Subtle animation (animate-pulse)

### Loading States
**Skeleton Loaders:**
- Task card skeleton: rounded rectangles mimicking card structure
- Dashboard stats: animated pulse on placeholder blocks
- Height matches actual content (h-24 for task cards)

### Empty States
**No Tasks:**
- Centered layout (flex flex-col items-center justify-center)
- Large icon (w-16 h-16 opacity-50)
- Heading (text-lg font-semibold)
- Description (text-sm opacity-70)
- Primary action button ("Create your first task")

---

## Icons

**Library:** Heroicons (via CDN) - outline style for most UI, solid for filled states

**Common Icons:**
- Navigation: home, users, calendar, bell, cog
- Task actions: plus, pencil, trash, check, x-mark
- Status: clock, arrow-path, eye, check-circle
- Priority: flag, exclamation-circle
- UI: chevron-down, magnifying-glass, funnel

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Base styles (< 768px)
- Tablet: md: (768px+) - 2-column dashboard stats
- Desktop: lg: (1024px+) - Sidebar visible, 3-column stats, wider content

**Mobile Optimizations:**
- Stack all multi-column layouts to single column
- Hide sidebar, show hamburger menu
- Reduce padding (px-4 instead of px-6)
- Full-width modals with slide-up animation
- Larger touch targets (min-h-12 for buttons)

---

## Animation & Transitions

**Use Sparingly:**
- Modal open/close: fade + scale
- Toast notifications: slide-in from bottom
- Dropdown menus: fade + translate
- Skeleton loaders: pulse animation
- Hover states: subtle scale or opacity (duration-200)

**Critical:** No distracting animations on task updates or data changes - prioritize perceived performance

---

## Authentication Pages

**Login/Register:**
- Centered card layout (max-w-md mx-auto)
- App logo/name at top
- Form with clear labels, adequate spacing (space-y-4)
- Primary button for submit
- Link to alternate page (Don't have an account? Register)
- Minimal decoration, focus on usability

---

This design creates a professional, efficient task management interface that prioritizes clarity, speed, and information density while maintaining modern aesthetic standards.