# UI/UX Redesign: PyBlocks

Act as a senior product designer and frontend design engineer. Redesign the existing PyBlocks educational platform to look like a professionally designed, production-ready EdTech product.

## Core objective

The current interface looks AI-generated because of excessive borders, nested rounded cards, repetitive components, excessive pastel colours, emoji-heavy icons and generic dashboard styling.

Remove these visual characteristics.

The goal is to create a distinctive, polished educational experience inspired by the usability of Duolingo, the visual discipline of Linear, and the lesson experience of Codecademy.

Do not simply change the colours. Rethink the visual hierarchy and component composition.

## 1. Design language

- Use a clean, modern, minimal visual language.
- Use warm white or subtle cool-grey backgrounds.
- Use charcoal for primary text.
- Choose one primary accent colour, preferably indigo or violet.
- Use green only for success and completion states.
- Use subtle 1px borders.
- Eliminate heavy dark outlines.
- Avoid excessive shadows.
- Reduce repetitive rounded containers.
- Use consistent spacing and alignment.
- Use Inter or Plus Jakarta Sans typography.
- Use Lucide icons instead of decorative emojis wherever appropriate.

## 2. Header

Create a compact navigation bar.

- PyBlocks logo and wordmark on the left.
- Learning progress or XP displayed subtly.
- Sandbox and Learn Python navigation.
- Avoid excessive decorative elements.

## 3. Chapter sidebar

Redesign the chapter navigation.

- Clean vertical navigation.
- Clear active lesson indicator.
- Completed lessons should have subtle completion indicators.
- Locked lessons should appear disabled without looking faded beyond readability.
- Remove oversized individual card containers.
- Maintain clear spacing between lessons.

## 4. Lesson content

Redesign the main lesson area.

- Lesson number and title.
- Short introductory description.
- Learning objectives where appropriate.
- Present definitions, analogies and examples using a clear content hierarchy.
- Avoid placing every concept inside a separate oversized bordered card.
- Make the content readable and compact.
- Use inline code highlighting for Python terminology.

## 5. Code learning experience

Give the code editor more visual importance.

- Professional dark code editor.
- Monospace font.
- Syntax highlighting.
- Run button.
- Expected output or actual output panel.
- Clear distinction between editor and output.
- Use a proper coding workspace layout.

## 6. Gamification

Keep the existing gamification system.

- XP and rewards should be visible but not dominant.
- Use subtle progress indicators.
- Use tasteful achievement animations.
- Avoid unnecessary stars, emojis and badges.
- Make completion states satisfying.

## 7. Responsive behaviour

- Desktop: sidebar and main lesson workspace.
- Tablet: collapsible sidebar.
- Mobile: compact navigation and vertically stacked lesson content.
- Prevent horizontal overflow.

## 8. Design consistency

Create reusable design tokens for:
- Colours
- Typography
- Spacing
- Border radius
- Shadows
- Buttons
- Cards
- Navigation
- Progress indicators
- Code editor

Avoid creating a new visual style for every component.

## 9. Important implementation instructions

- Inspect the existing codebase before modifying anything.
- Preserve all existing application functionality.
- Do not remove lessons, XP, progress tracking, sandbox functionality or navigation.
- Do not introduce unnecessary dependencies.
- Reuse existing components where appropriate.
- Refactor reusable UI components instead of adding one-off CSS overrides.
- Test all existing interactions after the redesign.
- Do not replace functional elements with static mockups.

## Final quality standard

The result should look like a real EdTech product designed by an experienced product design team, not a generic AI-generated dashboard.

Prioritise usability, typography, spacing, visual hierarchy and consistency over decoration.

Make the redesign across the entire application, not just the screenshot's visible page.