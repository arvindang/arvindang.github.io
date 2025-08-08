# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Arvin Dang built with Middleman, a Ruby-based static site generator. The site is hosted on GitHub Pages.

## Tech Stack

- **Static Site Generator**: Middleman 4.5.1
- **CSS Processing**: SCSS with Autoprefixer
- **Hosting**: GitHub Pages (arvindang.github.io)
- **Ruby Version Management**: rbenv

## Development Commands

```bash
# Install dependencies
bundle install

# Start development server (local development)
bundle exec middleman server

# Build static site locally (for testing)
bundle exec middleman build

# Deploy to GitHub Pages (automatic via GitHub Actions)
# Simply push your changes to main branch:
git add .
git commit -m "Your commit message"
git push origin main
# GitHub Actions will automatically build and deploy the site
```

**IMPORTANT:** Always use `bundle exec` with Middleman commands to ensure proper gem version management.

## Project Structure

The site uses Middleman's standard directory structure:
- `source/` - Contains all source files (templates, styles, scripts)
  - `index.html.erb` - Main page template with frontmatter
  - `stylesheets/site.css.scss` - Main stylesheet
  - `javascripts/site.js` - Main JavaScript file
  - `layouts/layout.erb` - Main layout template
  - `images/` - Source images
- `build/` - Generated static files (committed to repo for GitHub Pages)
- `index.html` - Built HTML file in root (for GitHub Pages)
- `config.rb` - Middleman configuration

## Key Architecture Decisions

1. **Source Structure**: All source files are in the `source/` directory following Middleman conventions. The site uses ERB templates that are processed during build.

2. **Build Directory**: The `build/` directory contains compiled assets and is git-ignored. It's automatically generated during deployment via GitHub Actions.

3. **GitHub Pages Deployment**: The site uses GitHub Actions for automatic deployment. Push to main branch triggers a build and deploy workflow, ensuring clean separation of source and built files.

## Important Files

- `CNAME` - Custom domain configuration for GitHub Pages
- `config.rb` - Middleman configuration (autoprefixer settings, layout rules)
- `Gemfile` - Ruby dependencies

## Development Notes

- The site uses Bootstrap Icons (bi-* classes) for social links
- Grid layout uses custom CSS classes (item-span-*, container)
- Google Analytics is configured with tag ID: G-RFJ0PQ4JTJ
- Assets in the `assets/` directory include PDFs and video files