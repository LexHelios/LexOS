# Accessibility Improvements – Remaining Tasks

## 🔲 Input Association
- Ensure all `<input>` fields (especially search and filters) are properly associated with `<label>` elements using `htmlFor`

## 🔲 Form Field Clarity
- Add visible labels or ARIA attributes to floating/placeholder-only fields
- Review `select` components for missing `aria-label` or titles

## 🔲 Keyboard Navigation
- Confirm focus states on tab through all sections
- Add `tabIndex` to custom interactive elements

## 🔲 Screen Reader Optimization
- Add `role="alert"` to system alerts for live announcements
- Verify `<nav>` and `<main>` landmarks are present

## Suggested Next Steps:
- Run `axe-core` or Lighthouse accessibility audit
- Schedule a pass dedicated to screen reader and keyboard UX 