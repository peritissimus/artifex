import { ComponentBase } from '../modules/componentBase.js';
import { dataManager } from '../modules/dataManager.js';
import { templateRenderer } from '../modules/templateRenderer.js';

export class ProjectsComponent extends ComponentBase {
  get defaultOptions() {
    return {
      containerSelector: '.projects-container',
      autoRender: true
    };
  }

  setupEvents() {
    this.on('data:loaded', this.handleDataLoaded.bind(this));
  }

  async render() {
    if (!this.options.autoRender) return;

    try {
      // For now, just activate the existing static project items
      this.activateProjects();
      
      // Load data in background for future use
      const data = await dataManager.loadAll();
      const projects = dataManager.getFeaturedProjects();
      console.log('Projects data loaded:', projects);
    } catch (error) {
      console.error('Failed to render projects:', error);
      this.activateProjects(); // Still show static content even if data fails
    }
  }

  renderProjects(projects) {
    const container = this.$(this.options.containerSelector);
    if (!container) {
      console.error('Projects container not found');
      return;
    }

    const projectsHTML = projects.map(project => 
      templateRenderer.render('project', project)
    ).join('');

    container.innerHTML = projectsHTML;
    this.setupProjectEvents();
    this.emit('projects:rendered', { projects });
  }

  renderError() {
    const container = this.$(this.options.containerSelector);
    if (!container) return;

    container.innerHTML = `
      <div class="projects-error">
        <p>Failed to load projects. Please try again later.</p>
      </div>
    `;
  }

  setupProjectEvents() {
    const projectLinks = this.$$('.project-link');
    
    projectLinks.forEach(link => {
      this.addEventListener(link, 'click', this.handleProjectClick);
      this.addEventListener(link, 'mouseenter', this.handleProjectHover);
      this.addEventListener(link, 'mouseleave', this.handleProjectLeave);
    });
  }

  handleProjectClick(event) {
    event.preventDefault();
    const projectId = event.currentTarget.getAttribute('href').slice(1);
    this.emit('project:click', { projectId, element: event.currentTarget });
  }

  handleProjectHover(event) {
    const projectItem = event.currentTarget.closest('.project-item');
    if (projectItem) {
      projectItem.classList.add('hovered');
      this.emit('project:hover', { element: projectItem });
    }
  }

  handleProjectLeave(event) {
    const projectItem = event.currentTarget.closest('.project-item');
    if (projectItem) {
      projectItem.classList.remove('hovered');
      this.emit('project:leave', { element: projectItem });
    }
  }

  activateProjects() {
    // Add active class to existing static project items to make them visible
    const projectItems = this.$$('.project-item');
    projectItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('active');
      }, index * 100); // Staggered animation
    });
    
    this.setupProjectEvents();
  }

  handleDataLoaded(data) {
    if (this.options.autoRender) {
      this.render();
    }
  }

  addProject(project) {
    const projects = dataManager.getProjects();
    projects.push(project);
    this.render();
  }

  removeProject(projectId) {
    const projects = dataManager.getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index > -1) {
      projects.splice(index, 1);
      this.render();
    }
  }

  updateProject(projectId, updates) {
    const projects = dataManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      Object.assign(project, updates);
      this.render();
    }
  }
}

export default ProjectsComponent;