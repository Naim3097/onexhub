# STRICT DESIGN & DEVELOPMENT RULES

## Overview
These are NON-NEGOTIABLE rules that must be followed for every aspect of the Mechanic Parts & Invoice Management System. No exceptions.

---

## RULE 1: CLEAN, ARRANGED, ORGANISED

### Code Organization
- **File Structure**: Logical folder hierarchy with clear naming
- **Component Structure**: Single responsibility principle
- **CSS Organization**: Grouped by component, consistent naming
- **Asset Management**: Organized folder structure for images, fonts, etc.

### Visual Organization
- **Information Hierarchy**: Clear primary, secondary, tertiary content levels
- **Consistent Spacing**: Uniform margins and padding throughout
- **Aligned Elements**: Perfect grid alignment, no visual chaos
- **Logical Grouping**: Related items visually connected

### Data Organization
- **Table Structure**: Clean rows/columns with consistent formatting
- **Form Layout**: Logical field ordering and grouping
- **Navigation Flow**: Intuitive user journey between sections
- **Content Prioritization**: Most important information prominently displayed

### Implementation Standards
```css
/* Example: Consistent spacing system */
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
}
```

---

## RULE 2: MINIMAL, SIMPLIFIED

### Visual Minimalism
- **No unnecessary decorations**: Zero ornamental elements
- **Essential elements only**: Every element must serve a purpose
- **Clean backgrounds**: Solid colors, no textures or patterns
- **Minimal color palette**: Strictly Black, Red, White only
- **Simple typography**: Maximum 2 font weights, 1 font family

### Functional Minimalism
- **Single-purpose components**: Each component does one thing well
- **Minimal clicks**: Reduce user actions to absolute minimum
- **Essential features only**: No bloat, no nice-to-have features in MVP
- **Streamlined workflows**: Direct paths to complete tasks

### Content Minimalism
- **Concise text**: No unnecessary words
- **Essential data only**: Show what users need, hide the rest
- **Progressive disclosure**: Advanced options hidden until needed
- **Clean labels**: Short, descriptive, unambiguous

### Code Minimalism
- **DRY Principle**: Don't Repeat Yourself
- **Minimal dependencies**: Only essential libraries
- **Clean functions**: Single purpose, clear naming
- **Optimized bundles**: Remove unused code

---

## RULE 3: WORLD CLASS STANDARD UI/UX

### User Experience Standards
- **Intuitive Navigation**: Zero learning curve required
- **Instant Feedback**: Every action has immediate visual response
- **Error Prevention**: Validate inputs before submission
- **Accessibility Compliance**: WCAG 2.1 AA standards minimum
- **Performance**: Sub-3 second load times, 60fps interactions

### Interface Standards
- **Consistent Patterns**: Same interaction patterns throughout
- **Touch Targets**: Minimum 44px clickable areas
- **Loading States**: Never leave users wondering what's happening
- **Empty States**: Helpful messages when no data exists
- **Error Messages**: Clear, actionable error communication

### Interaction Standards
- **Micro-interactions**: Smooth 300ms transitions
- **Hover States**: Consistent feedback across all interactive elements
- **Focus Management**: Clear keyboard navigation paths
- **Form Validation**: Real-time, inline feedback
- **Confirmation Dialogs**: For destructive or important actions

### Quality Benchmarks
- **Google Lighthouse**: 90+ scores across all metrics
- **Cross-browser**: Perfect function in all major browsers
- **Device Testing**: Tested on actual devices, not just dev tools
- **User Testing**: Real user validation before launch

---

## RULE 4: ULTRA OPTIMISED (DESKTOP, TABLET, MOBILE)

### Responsive Design Requirements

#### Desktop (1024px+)
- **Three-column layouts** where appropriate
- **Hover interactions** fully functional
- **Keyboard shortcuts** for power users
- **Large data tables** with horizontal scroll if needed
- **Multiple sections visible** simultaneously

#### Tablet (768px - 1023px)
- **Two-column layouts** or stacked sections
- **Touch-optimized** button sizes (min 44px)
- **Swipe gestures** for navigation
- **Collapsible menus** for space efficiency
- **Portrait/landscape** optimization

#### Mobile (320px - 767px)
- **Single column layout** mandatory
- **Bottom navigation** for main sections
- **Full-width buttons** for primary actions
- **Thumb-friendly** interaction zones
- **Minimal text input** required

### Performance Optimization
- **Image Optimization**: WebP format, proper sizing
- **Code Splitting**: Load only what's needed
- **Lazy Loading**: Images and components load on demand
- **Caching Strategy**: Proper browser and service worker caching
- **Bundle Size**: Maximum 500KB initial bundle

### Technical Standards
```css
/* Mobile-first breakpoints */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }

/* Touch targets */
.button {
  min-height: 44px;
  min-width: 44px;
}
```

---

## RULE 5: BLACK, RED, WHITE THEME

### Color Palette (STRICT)
```css
:root {
  /* PRIMARY COLORS - ONLY THESE ALLOWED */
  --black: #000000;
  --white: #ffffff;
  --red: #dc2626; /* Primary red */
  
  /* ALLOWED VARIATIONS */
  --black-90: rgba(0, 0, 0, 0.9);
  --black-75: rgba(0, 0, 0, 0.75);
  --black-50: rgba(0, 0, 0, 0.5);
  --black-25: rgba(0, 0, 0, 0.25);
  --black-10: rgba(0, 0, 0, 0.1);
  
  --red-dark: #b91c1c;
  --red-light: #ef4444;
  --red-10: rgba(220, 38, 38, 0.1);
  
  /* FORBIDDEN */
  /* No blues, greens, yellows, purples, etc. */
}
```

### Color Usage Rules

#### Black Usage
- **Primary text**: All body text, headings
- **Navigation**: Header backgrounds, menu items
- **Borders**: Table borders, input borders
- **Icons**: All iconography

#### Red Usage
- **Primary actions**: Save, Submit, Generate buttons
- **Alerts/Errors**: Error messages, warnings
- **Important data**: Price markup, critical information
- **Accent elements**: Active states, highlights

#### White Usage
- **Backgrounds**: Main content areas, cards
- **Text on dark**: White text on black/red backgrounds
- **Input fields**: Form input backgrounds
- **Spacing**: Clean separation between elements

### Prohibited Colors
- ❌ **No grays** (use black opacity instead)
- ❌ **No blues** (even for links - use red)
- ❌ **No greens** (even for success states)
- ❌ **No yellows** (even for warnings - use red)
- ❌ **No other colors** whatsoever

### Theme Implementation
```css
/* Header */
.header {
  background: var(--black);
  color: var(--white);
}

/* Primary buttons */
.btn-primary {
  background: var(--red);
  color: var(--white);
  border: none;
}

/* Secondary buttons */
.btn-secondary {
  background: var(--white);
  color: var(--black);
  border: 2px solid var(--black);
}

/* Form inputs */
.input {
  background: var(--white);
  border: 1px solid var(--black-25);
  color: var(--black);
}

/* Tables */
.table {
  background: var(--white);
  border: 1px solid var(--black-10);
}

.table-header {
  background: var(--black);
  color: var(--white);
}
```

---

## ENFORCEMENT CHECKLIST

### Before Every Commit
- [ ] **Clean & Organized**: Is everything properly structured?
- [ ] **Minimal**: Can anything be removed or simplified?
- [ ] **UI/UX Standard**: Does this meet world-class standards?
- [ ] **Responsive**: Tested on all three device types?
- [ ] **Color Compliance**: Only Black, Red, White used?

### Code Review Requirements
- [ ] **Performance**: Lighthouse scores above 90
- [ ] **Accessibility**: Screen reader compatible
- [ ] **Cross-browser**: Works in Chrome, Firefox, Safari, Edge
- [ ] **Mobile-first**: Designed for mobile, enhanced for desktop
- [ ] **Color audit**: Zero non-compliant colors

### Launch Criteria
- [ ] **Load time**: Under 3 seconds on 3G
- [ ] **Usability**: New user can complete task without help
- [ ] **Visual consistency**: Every element follows the rules
- [ ] **Responsive perfection**: Pixel-perfect on all devices
- [ ] **Theme adherence**: Strict Black/Red/White compliance

---

## VIOLATION CONSEQUENCES

### Minor Violations
- Immediate fix required before merge
- Code review rejection

### Major Violations
- Complete rework of component/feature
- Design review meeting required

### Rule Violations Examples
- ❌ Adding any color outside Black/Red/White
- ❌ Cluttered interfaces with unnecessary elements
- ❌ Non-responsive design
- ❌ Poor performance scores
- ❌ Inconsistent spacing or alignment

---

## SUCCESS METRICS

### Quality Indicators
- **Google Lighthouse**: 90+ Performance, Accessibility, Best Practices, SEO
- **User Task Completion**: 95%+ success rate
- **Load Time**: <3 seconds on all devices
- **Visual Consistency Score**: 100% adherence to color/spacing rules
- **Cross-device Compatibility**: Perfect function on all target devices

### User Experience Goals
- **Zero learning curve**: Intuitive from first use
- **Efficient workflows**: Minimal clicks to complete tasks
- **Professional appearance**: Builds trust and credibility
- **Error-free operation**: Robust error handling and validation
- **Accessible to all**: Works with assistive technologies

---

**REMEMBER: These rules are ABSOLUTE. No compromises, no exceptions, no "just this once" deviations.**
