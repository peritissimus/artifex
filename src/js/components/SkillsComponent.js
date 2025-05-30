import { ComponentBase } from '../modules/componentBase.js';

export class SkillsComponent extends ComponentBase {
  get defaultOptions() {
    return {
      containerSelector: '.skills-grid',
      autoRender: true,
      animateOnScroll: true
    };
  }

  setupEvents() {
    if (this.options.animateOnScroll) {
      this.setupScrollAnimation();
    }
  }

  render() {
    if (!this.options.autoRender) return;
    
    // Activate existing static skills content
    this.activateSkills();
  }

  activateSkills() {
    // Add active class to existing static skill categories
    const skillCategories = this.$$('.skill-category');
    skillCategories.forEach((category, index) => {
      setTimeout(() => {
        category.classList.add('active');
      }, index * 100);
    });
    
    this.setupSkillEvents();
  }

  setupSkillEvents() {
    const skillItems = this.$$('.skill-list li');
    
    skillItems.forEach((item, index) => {
      this.addEventListener(item, 'mouseenter', this.handleSkillHover);
      this.addEventListener(item, 'mouseleave', this.handleSkillLeave);
      
      // Add animation delay based on index
      item.style.setProperty('--animation-delay', `${index * 100}ms`);
    });
  }

  setupScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateSkillsIn();
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    });

    observer.observe(this.element);
  }

  animateSkillsIn() {
    const skillCategories = this.$$('.skill-category');
    
    skillCategories.forEach((category, index) => {
      setTimeout(() => {
        category.classList.add('animate-in');
        
        const skillItems = category.querySelectorAll('.skill-list li');
        skillItems.forEach((item, itemIndex) => {
          setTimeout(() => {
            item.classList.add('animate-in');
          }, itemIndex * 100);
        });
      }, index * 200);
    });

    this.emit('skills:animated');
  }

  handleSkillHover(event) {
    const skillItem = event.currentTarget;
    const skillName = skillItem.querySelector('span').textContent;
    
    skillItem.classList.add('hovered');
    this.emit('skill:hover', { skillName, element: skillItem });
  }

  handleSkillLeave(event) {
    const skillItem = event.currentTarget;
    skillItem.classList.remove('hovered');
    this.emit('skill:leave', { element: skillItem });
  }

  // Removed data-dependent methods for static version

  highlightSkillsByTechnology(technology) {
    const skillItems = this.$$('.skill-list li');
    
    skillItems.forEach(item => {
      const skillName = item.querySelector('span').textContent.toLowerCase();
      if (skillName.includes(technology.toLowerCase())) {
        item.classList.add('highlighted');
      } else {
        item.classList.remove('highlighted');
      }
    });

    this.emit('skills:highlighted', { technology });
  }

  clearHighlights() {
    const skillItems = this.$$('.skill-list li');
    skillItems.forEach(item => {
      item.classList.remove('highlighted');
    });

    this.emit('skills:highlights-cleared');
  }
}

export default SkillsComponent;