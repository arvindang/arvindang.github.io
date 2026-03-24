# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Arvin Dang built with Middleman (Ruby static site generator), hosted on GitHub Pages at arv.in.

## Development Commands

```bash
bundle install                      # Install dependencies
bundle exec middleman server        # Start dev server (localhost:4567)
bundle exec middleman build         # Build to ./build/
```

Always use `bundle exec` prefix with Middleman commands.

## Deployment

Push to `master` branch triggers GitHub Actions (`.github/workflows/deploy.yml`) which runs `bundle exec middleman build` and deploys the `build/` directory to GitHub Pages. No manual build/deploy needed.

## Architecture

**Single-page portfolio** with one additional page (`writing.html`):

- `source/layouts/layout.erb` — Shared HTML shell (head, analytics, footer)
- `source/index.html.erb` — Main page content (hero, about, teaching, projects, experience, connect sections)
- `source/writing.html.erb` — Standalone writing/blog page with inline `<script>` for animations
- `source/stylesheets/site.css.scss` — All styles in one file, using CSS custom properties (`:root` vars) for the design system
- `source/javascripts/site.js` — Hero text rotation, smooth scrolling, IntersectionObserver fade-ins, parallax, Konami code easter egg
- `source/assets/` — PDFs and video files (served as static assets)

**Build configuration** (`config.rb`): CSS minification, asset hashing, and relative assets are enabled for production builds. JS minification is intentionally disabled (Uglifier compatibility issue).

## Design System

The site uses a terracotta color palette defined as CSS custom properties in `site.css.scss`:
- Primary: `--color-terracotta: #D4826C` with light/dark variants
- Background: cream gradient (`--gradient-soft`)
- Typography: Playfair Display (headings) + Inter (body), loaded from Google Fonts
- Glass-morphism card pattern (`.glass-card`) used throughout
- Responsive breakpoint at 768px

## Conventions

- Content is hardcoded in ERB templates (no CMS, no data files)
- Navigation anchors map to section IDs (`#about`, `#teaching`, `#projects`, `#experience`, `#connect`)
- External links use `target="_blank" rel="noopener"`
- Google Analytics tag: `G-RFJ0PQ4JTJ`
