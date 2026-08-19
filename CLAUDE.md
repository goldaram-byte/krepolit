# CLAUDE.md

## Project

This repository is transitioning from a static hardware-store demo site
(КРЕПОЛИТ, plain HTML/CSS/JS — see `README.md`) to a new project: a
Next.js catalog site for a flooring dealer (кварцвинил/ламинат/etc.).

**Read `SPEC.md` in full before doing any work here.** It is the source of
truth for the new project: data model, stack, pages, SEO requirements,
sprint plan, and what to deliberately skip in the MVP.

## Rules

- TypeScript strict mode, no `any`.
- UI text in Russian; code and comments in English.
- All secrets in `.env`, never committed.
- Run the build before every commit.
- Prices, imports, and RRC (РРЦ) floor logic follow `SPEC.md` §3–4 exactly —
  a product's price must never be published below brand RRC.
- No online payment, no client accounts, no 1C integration, no multi-language,
  no on-site chat in the MVP (see `SPEC.md` §11).

## Workflow

Work sprint by sprint per `SPEC.md` §10, starting with Sprint 1. Before
writing page code, propose the project structure and the Prisma schema for
review and wait for approval.
