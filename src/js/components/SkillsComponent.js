import { ComponentBase } from '../modules/componentBase.js';
import { dataManager } from '../modules/dataManager.js';
import { templateRenderer } from '../modules/templateRenderer.js';

export class SkillsComponent extends ComponentBase {
  get defaultOptions() {
    return {
      containerSelector: '.skills-grid',
      autoRender: true,
      animateOnScroll: true
    };
  }

  setupEvents() {
    this.on('data:loaded', this.handleDataLoaded.bind(this));
    
    if (this.options.animateOnScroll) {
      this.setupScrollAnimation();
    }
  }

  async render() {
    if (!this.options.autoRender) return;

    try {
      const data = await dataManager.loadAll();
      const skillCategories = dataManager.getSkillCategories();
      this.renderSkills(skillCategories);
    } catch (error) {
      console.error('Failed to render skills:', error);
      this.renderError();
    }
  }

  renderSkills(skillCategories) {
    const container = this.$(this.options.containerSelector);
    if (!container) {
      console.error('Skills container not found');
      return;
    }

    const skillsHTML = skillCategories.map(category => 
      templateRenderer.render('skillCategory', category)
    ).join('');

    container.innerHTML = skillsHTML;
    this.setupSkillEvents();
    this.emit('skills:rendered', { skillCategories });
  }

  renderError() {
    const container = this.$(this.options.containerSelector);
    if (!container) return;

    container.innerHTML = `
      <div class="skills-error">
        <p>Failed to load skills. Please try again later.</p>
      </div>
    `;
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

  handleDataLoaded(data) {
    if (this.options.autoRender) {
      this.render();
    }
  }

  filterSkillsByLevel(level) {
    const skillItems = this.$$('.skill-list li');
    
    skillItems.forEach(item => {
      const skillData = this.getSkillData(item);
      if (!level || skillData.level === level) {
        item.style.display = '';
        item.classList.add('filtered-in');
      } else {
        item.style.display = 'none';
        item.classList.remove('filtered-in');
      }
    });

    this.emit('skills:filtered', { level });
  }

  getSkillData(skillElement) {
    // In a real implementation, you might store this data as data attributes
    // or maintain a mapping between elements and data
    const skillName = skillElement.querySelector('span').textContent;
    const categories = dataManager.getSkillCategories();
    
    for (const category of categories) {
      const skill = category.skills.find(s => s.name === skillName);
      if (skill) {
        return skill;
      }
    }
    
    return null;
  }

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