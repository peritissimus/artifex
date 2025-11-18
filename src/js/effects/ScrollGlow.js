export class ScrollGlow {
  constructor() {
    this.gridElement = document.querySelector('.blueprint-grid');
    this.verticalLines = {
      left: null,
      right: null,
    };
    this.sections = [];
    this.isInitialized = false;

    this.init();
  }

  init() {
    if (!this.gridElement) return;

    // Create vertical line glow elements
    this.createVerticalLineGlows();

    // Get all section separators
    this.cacheSectionElements();

    // Add scroll listener
    this.addScrollListener();

    this.isInitialized = true;
  }

  createVerticalLineGlows() {
    // Create left vertical line glow
    const leftGlow = document.createElement('div');
    leftGlow.className = 'vertical-line-glow left';
    document.body.appendChild(leftGlow);
    this.verticalLines.left = leftGlow;

    // Create right vertical line glow
    const rightGlow = document.createElement('div');
    rightGlow.className = 'vertical-line-glow right';
    document.body.appendChild(rightGlow);
    this.verticalLines.right = rightGlow;
  }

  cacheSectionElements() {
    // Find all sections with horizontal separators
    const sectionSelectors = [
      '.hero-section',
      '.projects-section',
      '.capabilities-section',
      '.specs-section',
    ];

    this.sections = sectionSelectors
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;

        // Create horizontal glow element for this section
        const horizontalGlow = document.createElement('div');
        horizontalGlow.className = 'horizontal-line-glow';
        element.appendChild(horizontalGlow);

        return {
          element,
          horizontalGlow,
          bottomY: 0, // Will be updated on scroll
        };
      })
      .filter(Boolean);
  }

  addScrollListener() {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateGlowEffects();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial update
    this.updateGlowEffects();
  }

  updateGlowEffects() {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const viewportMiddle = scrollY + viewportHeight / 2;

    // Update grid glow based on scroll position
    this.updateGridGlow(scrollY, viewportHeight);

    // Check each section for intersection
    this.sections.forEach((section) => {
      const rect = section.element.getBoundingClientRect();
      const sectionBottom = rect.bottom + scrollY;
      section.bottomY = sectionBottom;

      // Calculate if horizontal line is near vertical lines (in viewport)
      const linePositionInViewport = rect.bottom;

      // Check if line is in viewport
      if (linePositionInViewport >= 0 && linePositionInViewport <= viewportHeight) {
        this.updateHorizontalGlow(section, linePositionInViewport, viewportHeight);
        this.updateVerticalIntersectionGlow(linePositionInViewport, viewportHeight);
      } else {
        // Reset glows when out of viewport
        section.horizontalGlow.style.opacity = '0';
      }
    });
  }

  updateGridGlow(scrollY, viewportHeight) {
    // Calculate glow intensity based on scroll position
    // The grid glows more as you scroll
    const scrollProgress = Math.min(scrollY / (viewportHeight * 2), 1);
    const glowIntensity = 0.3 + scrollProgress * 0.4; // 0.3 to 0.7

    this.gridElement.style.opacity = glowIntensity.toFixed(2);
  }

  updateHorizontalGlow(section, linePositionInViewport, viewportHeight) {
    // Calculate distance from center of viewport
    const viewportCenter = viewportHeight / 2;
    const distanceFromCenter = Math.abs(linePositionInViewport - viewportCenter);
    const maxDistance = viewportHeight / 2;

    // Glow intensity increases as line approaches center
    const intensity = 1 - distanceFromCenter / maxDistance;
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // Apply glow with smooth transition
    section.horizontalGlow.style.opacity = clampedIntensity.toFixed(2);

    // Calculate width animation (expands from intersection points toward center)
    // When at center, width should be 100%
    const widthPercent = 50 + clampedIntensity * 50; // 50% to 100%
    section.horizontalGlow.style.width = `${widthPercent}%`;
  }

  updateVerticalIntersectionGlow(linePositionInViewport, viewportHeight) {
    // Calculate distance from center
    const viewportCenter = viewportHeight / 2;
    const distanceFromCenter = Math.abs(linePositionInViewport - viewportCenter);
    const maxDistance = viewportHeight / 2;

    // Glow intensity for vertical lines at intersection
    const intensity = 1 - distanceFromCenter / maxDistance;
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // Update both vertical line glows
    if (this.verticalLines.left && this.verticalLines.right) {
      const glowHeight = 200 * clampedIntensity; // Maximum 200px glow height
      const topPosition = linePositionInViewport;

      // Left line glow
      this.verticalLines.left.style.top = `${topPosition}px`;
      this.verticalLines.left.style.height = `${glowHeight}px`;
      this.verticalLines.left.style.opacity = clampedIntensity.toFixed(2);

      // Right line glow
      this.verticalLines.right.style.top = `${topPosition}px`;
      this.verticalLines.right.style.height = `${glowHeight}px`;
      this.verticalLines.right.style.opacity = clampedIntensity.toFixed(2);
    }
  }
}
