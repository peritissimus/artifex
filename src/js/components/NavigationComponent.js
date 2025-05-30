import { ComponentBase } from '../modules/componentBase.js';
import { debounce, passiveListener } from '../modules/utils.js';
import APP_CONFIG from '../../config/app.config.js';
import anime from 'animejs';

export class NavigationComponent extends ComponentBase {
  get defaultOptions() {
    return {
      menuToggleSelector: '.menu-toggle',
      mainNavSelector: '.main-nav',
      navLinksSelector: '.nav-link',
      activeClass: 'active',
      scrollOffset: 100,
      animationDuration: APP_CONFIG.animation.durations.slow,
      staggerDelay: APP_CONFIG.animation.delays.stagger,
    };
  }

  setupEvents() {
    this.menuToggle = this.$(this.options.menuToggleSelector);
    this.mainNav = this.$(this.options.mainNavSelector);
    this.navLinks = this.$$(this.options.navLinksSelector);

    if (!this.menuToggle || !this.mainNav) {
      console.error('Navigation elements not found');
      return;
    }

    this.setupInitialState();
    this.setupMenuToggle();
    this.setupNavLinks();
    this.setupScrollListener();
    this.setupSocialLinks();
  }

  setupInitialState() {
    // Set initial index for staggered animations
    this.navLinks.forEach((link, index) => {
      link.style.setProperty('--index', index);
    });

    // Enable transitions after initial render to prevent flashing
    setTimeout(() => {
      this.mainNav.classList.add('transition-enabled');
    }, 300);
  }

  setupMenuToggle() {
    this.addEventListener(this.menuToggle, 'click', this.handleMenuToggle);

    // Close menu on escape key
    this.addEventListener(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen()) {
        this.closeMenu();
      }
    });

    // Close menu when clicking outside
    this.addEventListener(document, 'click', (e) => {
      if (
        this.isMenuOpen() &&
        !this.mainNav.contains(e.target) &&
        !this.menuToggle.contains(e.target)
      ) {
        this.closeMenu();
      }
    });
  }

  setupNavLinks() {
    this.navLinks.forEach((link) => {
      this.addEventListener(link, 'click', this.handleNavLinkClick);
    });
  }

  setupScrollListener() {
    this.debouncedScrollHandler = debounce(() => {
      this.updateActiveNavLink();
    }, APP_CONFIG.performance.debounceTime.scroll);

    this.addEventListener(window, 'scroll', this.debouncedScrollHandler, passiveListener);
  }

  setupSocialLinks() {
    const socialLinks = this.$$('.social-links .social-link');
    socialLinks.forEach((link) => {
      this.addEventListener(link, 'click', this.handleSocialClick);
    });
  }

  handleMenuToggle(event) {
    event.preventDefault();

    if (this.isMenuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.menuToggle.classList.add(this.options.activeClass);
    this.mainNav.classList.add(this.options.activeClass);
    this.menuToggle.setAttribute('aria-expanded', 'true');

    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';

    this.animateMenuOpen();
    this.emit('navigation:menu-opened');
  }

  closeMenu() {
    this.menuToggle.classList.remove(this.options.activeClass);
    this.mainNav.classList.remove(this.options.activeClass);
    this.menuToggle.setAttribute('aria-expanded', 'false');

    // Restore body scroll
    document.body.style.overflow = '';

    this.emit('navigation:menu-closed');
  }

  isMenuOpen() {
    return this.mainNav.classList.contains(this.options.activeClass);
  }

  animateMenuOpen() {
    anime({
      targets: this.navLinks,
      translateY: [30, 0],
      opacity: [0, 1],
      duration: this.options.animationDuration,
      delay: anime.stagger(this.options.staggerDelay),
      easing: APP_CONFIG.animation.easings.smooth,
    });

    // Animate social links with different timing
    const socialLinks = this.$$('.social-links .social-link');
    anime({
      targets: socialLinks,
      translateY: [20, 0],
      opacity: [0, 1],
      duration: this.options.animationDuration * 0.8,
      delay: anime.stagger(50, { start: 400 }),
      easing: APP_CONFIG.animation.easings.smooth,
    });
  }

  handleNavLinkClick(event) {
    event.preventDefault();

    const link = event.currentTarget;
    const targetId = link.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (!targetElement) {
      console.warn(`Target element ${targetId} not found`);
      return;
    }

    // Update active state immediately for better UX
    this.setActiveLink(link);

    // Close menu first if on mobile
    if (this.isMenuOpen()) {
      this.closeMenu();

      // Delay scroll to allow menu close animation
      setTimeout(() => {
        this.scrollToSection(targetElement);
      }, 300);
    } else {
      this.scrollToSection(targetElement);
    }

    this.emit('navigation:link-clicked', {
      targetId: targetId.slice(1),
      link,
      targetElement,
    });
  }

  scrollToSection(targetElement) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    const targetPosition = targetElement.offsetTop - headerHeight;

    // Use smooth scroll with custom implementation for better control
    anime({
      targets: { scrollTop: window.pageYOffset },
      scrollTop: targetPosition,
      duration: APP_CONFIG.navigation.smoothScrollDuration,
      easing: APP_CONFIG.animation.easings.smooth,
      update: function (animation) {
        window.scrollTo(0, animation.animations[0].currentValue);
      },
    });
  }

  updateActiveNavLink() {
    const scrollPosition = window.pageYOffset;
    const sections = document.querySelectorAll('section');

    let activeSection = null;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - this.options.scrollOffset;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        activeSection = section;
      }
    });

    if (activeSection) {
      const currentId = activeSection.getAttribute('id');
      const targetLink = this.navLinks.find(
        (link) => link.getAttribute('href') === `#${currentId}`,
      );

      if (targetLink) {
        this.setActiveLink(targetLink);
      }
    }
  }

  setActiveLink(targetLink) {
    // Remove active class from all links
    this.navLinks.forEach((link) => {
      link.classList.remove(this.options.activeClass);
      link.removeAttribute('aria-current');
    });

    // Add active class to target link
    targetLink.classList.add(this.options.activeClass);
    targetLink.setAttribute('aria-current', 'page');

    this.emit('navigation:active-changed', {
      activeLink: targetLink,
      section: targetLink.getAttribute('href').slice(1),
    });
  }

  handleSocialClick(event) {
    const link = event.currentTarget;
    const platform = this.extractPlatformFromUrl(link.href);

    this.emit('navigation:social-clicked', {
      platform,
      url: link.href,
      element: link,
    });

    // Analytics tracking
    this.trackSocialClick(platform, link.href);
  }

  extractPlatformFromUrl(url) {
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('github.com')) return 'github';
    if (url.includes('twitter.com')) return 'twitter';
    if (url.includes('behance.net')) return 'behance';
    return 'unknown';
  }

  trackSocialClick(platform, url) {
    // Implement analytics tracking
    console.log(`Navigation social click: ${platform} - ${url}`);
  }

  // Public methods for external control
  navigateToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      this.scrollToSection(targetElement);

      // Update active link
      const targetLink = this.navLinks.find(
        (link) => link.getAttribute('href') === `#${sectionId}`,
      );
      if (targetLink) {
        this.setActiveLink(targetLink);
      }
    }
  }

  getCurrentActiveSection() {
    const activeLink = this.navLinks.find((link) =>
      link.classList.contains(this.options.activeClass),
    );
    return activeLink ? activeLink.getAttribute('href').slice(1) : null;
  }

  beforeDestroy() {
    // Clean up body styles
    document.body.style.overflow = '';

    // Cancel any ongoing animations
    anime.remove(this.navLinks);
    anime.remove(this.$$('.social-links .social-link'));
  }
}

export default NavigationComponent;
