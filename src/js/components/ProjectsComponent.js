import { ComponentBase } from '../modules/componentBase.js';

export class ProjectsComponent extends ComponentBase {
  get defaultOptions() {
    return {
      containerSelector: '.projects-container',
      autoRender: true,
    };
  }

  setupEvents() {
    // No data loading events needed for static version
  }

  render() {
    if (!this.options.autoRender) return;

    // Simply activate the existing static project items
    this.activateProjects();
  }

  // Removed renderProjects and renderError methods as they're not needed for static version

  setupProjectEvents() {
    const projectLinks = this.$$('.project-link');

    projectLinks.forEach((link) => {
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

  // Removed data management methods as they're not needed for static version
}

export default ProjectsComponent;
