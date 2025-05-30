import { ComponentBase } from '../modules/componentBase.js';

export class ContactComponent extends ComponentBase {
  get defaultOptions() {
    return {
      contactInfoSelector: '.contact-info',
      socialLinksSelector: '.social-links',
      autoRender: true
    };
  }

  setupEvents() {
    // No data loading needed for static version
  }

  render() {
    if (!this.options.autoRender) return;
    
    // Activate existing static contact content
    this.activateContact();
  }

  activateContact() {
    // Add active class to existing static contact items
    const contactItems = this.$$('.contact-item');
    contactItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('active');
      }, index * 100);
    });
    
    this.setupContactEvents();
    this.setupSocialEvents();
  }

  setupContactEvents() {
    const contactLinks = this.$$('.contact-info a');
    
    contactLinks.forEach(link => {
      this.addEventListener(link, 'click', this.handleContactClick);
      this.addEventListener(link, 'mouseenter', this.handleContactHover);
      this.addEventListener(link, 'mouseleave', this.handleContactLeave);
    });
  }

  setupSocialEvents() {
    const socialLinks = this.$$('.social-link');
    
    socialLinks.forEach(link => {
      this.addEventListener(link, 'click', this.handleSocialClick);
      this.addEventListener(link, 'mouseenter', this.handleSocialHover);
      this.addEventListener(link, 'mouseleave', this.handleSocialLeave);
    });
  }

  handleContactClick(event) {
    const href = event.currentTarget.getAttribute('href');
    const type = href.startsWith('mailto:') ? 'email' : 'link';
    
    this.emit('contact:click', { 
      type, 
      href, 
      element: event.currentTarget 
    });

    // Analytics tracking could go here
    this.trackContactInteraction(type, href);
  }

  handleContactHover(event) {
    event.currentTarget.classList.add('hovered');
    this.emit('contact:hover', { element: event.currentTarget });
  }

  handleContactLeave(event) {
    event.currentTarget.classList.remove('hovered');
    this.emit('contact:leave', { element: event.currentTarget });
  }

  handleSocialClick(event) {
    const href = event.currentTarget.getAttribute('href');
    const platform = this.extractPlatformFromUrl(href);
    
    this.emit('social:click', { 
      platform, 
      href, 
      element: event.currentTarget 
    });

    // Analytics tracking could go here
    this.trackSocialInteraction(platform, href);
  }

  handleSocialHover(event) {
    event.currentTarget.classList.add('hovered');
    this.emit('social:hover', { element: event.currentTarget });
  }

  handleSocialLeave(event) {
    event.currentTarget.classList.remove('hovered');
    this.emit('social:leave', { element: event.currentTarget });
  }

  extractPlatformFromUrl(url) {
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('github.com')) return 'github';
    if (url.includes('twitter.com')) return 'twitter';
    if (url.includes('behance.net')) return 'behance';
    return 'unknown';
  }

  trackContactInteraction(type, href) {
    // Implement analytics tracking
    console.log(`Contact interaction: ${type} - ${href}`);
  }

  trackSocialInteraction(platform, href) {
    // Implement analytics tracking
    console.log(`Social interaction: ${platform} - ${href}`);
  }

  animateIn() {
    const contactItems = this.$$('.contact-item');
    const socialLinks = this.$$('.social-link');
    
    contactItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('animate-in');
      }, index * 100);
    });

    setTimeout(() => {
      socialLinks.forEach((link, index) => {
        setTimeout(() => {
          link.classList.add('animate-in');
        }, index * 50);
      });
    }, contactItems.length * 100);

    this.emit('contact:animated');
  }
}

export default ContactComponent;