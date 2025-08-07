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

# Start development server
bundle exec middleman server

# Build static site
bundle exec middleman build

# Deploy to GitHub Pages (builds to root directory)
bundle exec middleman build
git add .
git commit -m "Build site"
git push origin master
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

1. **Dual HTML Structure**: The site maintains both `source/index.html.erb` (source template) and `index.html` (built file) in the root directory. The root `index.html` is the deployed version for GitHub Pages.

2. **Build Directory**: The `build/` directory contains compiled assets (CSS, JS, images) and is committed to the repository for GitHub Pages deployment.

3. **GitHub Pages Deployment**: The site deploys directly from the master branch root directory, requiring built files to be committed.

## Important Files

- `CNAME` - Custom domain configuration for GitHub Pages
- `config.rb` - Middleman configuration (autoprefixer settings, layout rules)
- `Gemfile` - Ruby dependencies

## Development Notes

- The site uses Bootstrap Icons (bi-* classes) for social links
- Grid layout uses custom CSS classes (item-span-*, container)
- Google Analytics is configured with tag ID: G-RFJ0PQ4JTJ
- Assets in the `assets/` directory include PDFs and video files