import { ComponentBase } from '../modules/componentBase.js';
import { dataManager } from '../modules/dataManager.js';
import { templateRenderer } from '../modules/templateRenderer.js';

export class ContactComponent extends ComponentBase {
  get defaultOptions() {
    return {
      contactInfoSelector: '.contact-info',
      socialLinksSelector: '.social-links',
      autoRender: true
    };
  }

  setupEvents() {
    this.on('data:loaded', this.handleDataLoaded.bind(this));
  }

  async render() {
    if (!this.options.autoRender) return;

    try {
      const data = await dataManager.loadAll();
      const contact = dataManager.getContact();
      const social = dataManager.getSocial();
      
      this.renderContactInfo(contact);
      this.renderSocialLinks(social);
    } catch (error) {
      console.error('Failed to render contact:', error);
      this.renderError();
    }
  }

  renderContactInfo(contact) {
    const container = this.$(this.options.contactInfoSelector);
    if (!container) {
      console.error('Contact info container not found');
      return;
    }

    const contactHTML = `
      ${templateRenderer.render('contactItem', 'Email', `mailto:${contact.email}`, true)}
      ${templateRenderer.render('contactItem', 'GitHub', `https://github.com/${dataManager.getSocial().github?.username}`, true, '_blank')}
      ${templateRenderer.render('contactItem', 'Based in', contact.location)}
    `;

    container.innerHTML = contactHTML;
    this.setupContactEvents();
    this.emit('contact:rendered', { contact });
  }

  renderSocialLinks(social) {
    const container = this.$(this.options.socialLinksSelector);
    if (!container) {
      console.error('Social links container not found');
      return;
    }

    const socialHTML = Object.values(social).map(socialItem => 
      templateRenderer.render('socialLink', socialItem)
    ).join('');

    container.innerHTML = socialHTML;
    this.setupSocialEvents();
    this.emit('social:rendered', { social });
  }

  renderError() {
    const contactContainer = this.$(this.options.contactInfoSelector);
    const socialContainer = this.$(this.options.socialLinksSelector);

    if (contactContainer) {
      contactContainer.innerHTML = `
        <div class="contact-error">
          <p>Failed to load contact information.</p>
        </div>
      `;
    }

    if (socialContainer) {
      socialContainer.innerHTML = `
        <div class="social-error">
          <p>Failed to load social links.</p>
        </div>
      `;
    }
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

  handleDataLoaded(data) {
    if (this.options.autoRender) {
      this.render();
    }
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

  updateContact(newContactData) {
    const currentContact = dataManager.getContact();
    Object.assign(currentContact, newContactData);
    this.renderContactInfo(currentContact);
  }

  updateSocial(newSocialData) {
    const currentSocial = dataManager.getSocial();
    Object.assign(currentSocial, newSocialData);
    this.renderSocialLinks(currentSocial);
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