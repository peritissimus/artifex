# Artifex - Modern Portfolio Website

[![CI](https://github.com/peritissimus/artifex/actions/workflows/ci.yml/badge.svg)](https://github.com/peritissimus/artifex/actions/workflows/ci.yml)
[![Release](https://github.com/peritissimus/artifex/actions/workflows/release.yml/badge.svg)](https://github.com/peritissimus/artifex/actions/workflows/release.yml)

A stunning, modern portfolio website featuring an interactive 3D cube background animation. Built with Vite, vanilla JavaScript, and modern CSS for optimal performance.

## ✨ Features

- **Interactive 3D Animation**: Dynamic cube grid background that responds to mouse movement and scrolling
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Modern Architecture**: Component-based JavaScript with modular CSS
- **Performance Optimized**: Static build with minimal runtime dependencies
- **Smooth Animations**: CSS and JavaScript animations with 60fps performance
- **SEO Ready**: Proper meta tags and semantic HTML structure
- **Automated Releases**: Semantic versioning with GitHub Actions

## Project Structure

```
artifex/
├── dist/               # Built files (generated)
├── public/             # Static assets served as-is
├── src/
│   ├── components/     # HTML components/partials
│   │   ├── head.html
│   │   ├── header.html
│   │   ├── navigation.html
│   │   ├── home-section.html
│   │   └── ... (other modular HTML parts)
│   ├── css/
│   │   ├── base/       # Base styles and resets
│   │   ├── components/ # Component-specific styles
│   │   ├── utils/      # Utility styles (responsive, print)
│   │   └── main.css    # Main CSS file that imports all modules
│   ├── js/
│   │   ├── modules/    # JavaScript modules
│   │   │   ├── utils.js
│   │   │   ├── navigation.js
│   │   │   └── animations.js
│   │   └── main.js     # Main JavaScript entry point
│   └── assets/         # Images and other assets
├── index.html          # Main HTML file with includes
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/artifex.git
   cd artifex
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Start the development server

   ```
   npm run dev
   ```

4. Build for production
   ```
   npm run build
   ```

## Technology Stack

- HTML5, CSS3, JavaScript (ES6+)
- [Vite](https://vitejs.dev/) - Build tool and development server
- [vite-plugin-html-includes](https://github.com/UstymUkhman/vite-plugin-html-includes) - For HTML partials/includes
- [Anime.js](https://animejs.com/) - JavaScript animation library
- CSS Variables for theming
- IntersectionObserver API for scroll-based animations
- Modular architecture for all code (HTML, CSS, JS)

## HTML Component Structure

The HTML structure is broken down into reusable components:

- **head.html**: Meta tags, title, and external resources
- **critical-css.html**: Critical inline CSS for fast initial rendering
- **header.html**: Site header with logo and menu toggle
- **navigation.html**: Main navigation menu
- **home-section.html**: Hero section with main title
- **projects-section.html**: Portfolio projects showcase
- **about-section.html**: About me and services information
- **skills-section.html**: Skills and expertise details
- **contact-section.html**: Contact information and form
- **footer.html**: Site footer with copyright
- **scripts.html**: JavaScript loading and initialization

This structure allows for easier maintenance and component-based development.

## CSS Organization

Styles are organized into logical groups:

- **Base**: Reset styles, variables, and base elements
- **Components**: Individual component styles (header, hero, projects, etc.)
- **Utils**: Utility styles like responsive layouts and print styles

## JavaScript Modules

JavaScript functionality is split into focused modules:

- **utils.js**: Helper functions like debounce and event handling
- **navigation.js**: Navigation and menu functionality
- **animations.js**: All animation logic and effects

## Browser Support

The site is optimized for modern browsers, including:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Anime.js](https://animejs.com/) for the animation library
- [Vite](https://vitejs.dev/) for the build system
- [vite-plugin-html-includes](https://github.com/UstymUkhman/vite-plugin-html-includes) for HTML component support
