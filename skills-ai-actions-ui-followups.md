# Skills and AI Actions UI Follow-ups

Alpha testing notes for `/skills` and `/ai-actions`.

Use this checklist to track design discussion, implementation, and final verification. Items that require Josh confirmation are split into a discussion step and an implementation step.

## Route Source Files

- `/skills`: `src/pages/skills/index.jsx`
- `/skills/[slug]`: `src/pages/skills/[slug].jsx`
- `/ai-actions`: `src/pages/ai-actions.jsx`

## `/skills`

### Hero

- [x] Align the `DocsBot Skills` tagline/header treatment with the pattern used on other pages.
- [x] Center and align the hero CTA buttons with the updated header treatment.
- [x] Discuss with Josh whether the current title line break, with `agent` and `skills` split across separate lines, is intentional or should be adjusted for marketing clarity.
- [ ] Implement the title/line-break change after Josh confirms the desired direction.
- [x] Adjust spacing in the `skills builder` animation.
- [ ] Improve the hero animation on small screens. Lowest priority.

### Section Backgrounds

- [x] Change the background of either the `AI agent skills` section or the `Skill builder` section so the two adjacent sections are easier to distinguish visually.

### Skills Library

- [ ] Discuss with Josh the intended meaning behind the colors and the `buildable` tag, since they may feel confusing to users.
- [ ] Implement any confirmed changes to the colors and/or `buildable` tag treatment.
- [x] Remove the `Buildable` tag from non-install skill cards while preserving the `Install ready` tag for installable skills.
- [x] Add a limited initial display for the library items.
- [x] Add either a `Load more` button or a load-on-scroll interaction so the section does not feel too long.

### Skill Builder

- [x] Break the `Skill Builder` section title into two lines after `Describe the outcome.`.

### Secure, Tested Agent Skills

- [ ] Propose a new graphic for the `Secure, tested agent skills` section, because the current graphic creates confusion between the three actionable buttons and the three boxes.
- [ ] Implement the selected replacement graphic.

### Page-Level Interaction

- [ ] Add a bottom-right `scroll to top` button.

## `/ai-actions`

### Hero

- [ ] Adjust the graphics connecting `AI actions` to the `Resolved` column so they do not look squeezed on small screens.

### Answers Still Leave Work Behind

- [ ] Enhance the section blocks so the meaning of the content is clearer and does not get lost in an overly simple design.

### Connect To Tools Through MCP Servers

- [ ] Improve the section animation on small screens so the servers do not sit behind the connector in a confusing way.

### Section Backgrounds

- [ ] Review all section backgrounds.
- [ ] Adjust duplicated adjacent backgrounds, such as white next to white, so each section has clearer visual separation.

## Verification

- [ ] Review `/skills` on desktop.
- [ ] Review `/skills` on tablet/mobile.
- [ ] Review `/ai-actions` on desktop.
- [ ] Review `/ai-actions` on tablet/mobile.
- [ ] Confirm Josh-dependent decisions have been reflected in the implemented UI.
