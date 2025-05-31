import { ComponentBase } from '../modules/componentBase.js';
import { eventBus } from '../modules/eventBus.js';

export class ProjectDetailComponent extends ComponentBase {
  constructor() {
    super();
    this.currentProject = null;
  }

  async init() {
    try {
      await super.init();
      this.setupEventListeners();
      console.log('✅ ProjectDetailComponent initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ProjectDetailComponent:', error);
      throw error;
    }
  }

  setupEventListeners() {
    eventBus.on('project:view', (projectData) => {
      this.showProject(projectData);
    });

    eventBus.on('project:close', () => {
      this.hideProject();
    });
  }

  showProject(projectData) {
    this.currentProject = projectData;
    this.render();
    this.show();
  }

  hideProject() {
    this.currentProject = null;
    this.hide();
  }

  render() {
    if (!this.currentProject) return;

    const content = `
      <div class="project-detail-overlay">
        <div class="project-detail-container">
          <button class="project-close-btn" aria-label="Close project details">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="project-detail-content">
            <div class="project-detail-header">
              <h1 class="project-detail-title">${this.currentProject.title}</h1>
              <p class="project-detail-subtitle">${this.currentProject.subtitle}</p>
            </div>
            
            <div class="project-detail-body">
              <div class="project-detail-image">
                <img src="${this.currentProject.image || '/placeholder-project.jpg'}" 
                     alt="${this.currentProject.title}" 
                     loading="lazy" />
              </div>
              
              <div class="project-detail-info">
                <div class="project-detail-description">
                  <h3>About this project</h3>
                  <p>${this.currentProject.description}</p>
                </div>
                
                <div class="project-detail-tech">
                  <h3>Technologies</h3>
                  <div class="tech-tags">
                    ${this.currentProject.technologies?.map(tech => 
                      `<span class="tech-tag">${tech}</span>`
                    ).join('') || ''}
                  </div>
                </div>
                
                <div class="project-detail-links">
                  ${this.currentProject.liveUrl ? 
                    `<a href="${this.currentProject.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-link-btn">
                      <i class="fas fa-external-link-alt"></i> View Live
                    </a>` : ''}
                  ${this.currentProject.githubUrl ? 
                    `<a href="${this.currentProject.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-link-btn">
                      <i class="fab fa-github"></i> View Code
                    </a>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.element.innerHTML = content;
    
    const closeBtn = this.element.querySelector('.project-close-btn');
    const overlay = this.element.querySelector('.project-detail-overlay');
    
    closeBtn?.addEventListener('click', () => this.hideProject());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideProject();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideProject();
    });
  }

  show() {
    this.element.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      this.element.classList.add('active');
    });
  }

  hide() {
    this.element.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 300);
  }

  createElement() {
    const element = document.createElement('div');
    element.className = 'project-detail-component';
    element.style.display = 'none';
    return element;
  }
}