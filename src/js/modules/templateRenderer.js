export class TemplateRenderer {
  constructor() {
    this.templates = new Map();
  }

  registerTemplate(name, templateFunction) {
    this.templates.set(name, templateFunction);
  }

  render(templateName, data, container) {
    const template = this.templates.get(templateName);
    if (!template) {
      console.error(`Template "${templateName}" not found`);
      return;
    }

    const html = template(data);
    if (container) {
      container.innerHTML = html;
    }
    return html;
  }

  renderToElement(templateName, data) {
    const html = this.render(templateName, data);
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }
}

// Project templates
export const projectTemplate = (project) => `
  <article class="project-item">
    <div class="project-meta">
      ${project.categories.map((cat) => `<span class="project-category">${cat}</span>`).join('')}
    </div>
    <div class="project-content">
      <a href="#${project.id}" class="project-link">
        <div class="project-image project-image-${project.id.slice(-1)}" aria-label="${project.image.alt}">
          <svg
            viewBox="0 0 16 9"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            width="100%"
            height="100%"
            style="position: absolute; top: 0; left: 0"
          >
            <filter id="${project.image.placeholder.blur}" width="100%" height="100%">
              <feGaussianBlur stdDeviation="20"></feGaussianBlur>
            </filter>
            <rect
              width="100%"
              height="100%"
              fill="${project.image.placeholder.color}"
              filter="url(#${project.image.placeholder.blur})"
            ></rect>
          </svg>
        </div>
      </a>
      <h3 class="visually-hidden">${project.title}</h3>
    </div>
  </article>
`;

// Skills templates
export const skillCategoryTemplate = (category) => `
  <div class="skill-category">
    <h3>${category.title}</h3>
    <ul class="skill-list">
      ${category.skills.map((skill) => `<li><span>${skill.name}</span></li>`).join('')}
    </ul>
  </div>
`;

// Contact templates
export const contactItemTemplate = (label, content, isLink = false, target = null) => `
  <div class="contact-item">
    <h3 id="${label.toLowerCase()}-label">${label}</h3>
    ${
      isLink
        ? `<a href="${content}" ${target ? `target="${target}" rel="noopener noreferrer"` : ''} aria-labelledby="${label.toLowerCase()}-label">${content.replace(/^https?:\/\//, '').replace(/^mailto:/, '')}</a>`
        : `<p aria-labelledby="${label.toLowerCase()}-label">${content}</p>`
    }
  </div>
`;

// Social link template
export const socialLinkTemplate = (social) => `
  <a
    href="${social.url}"
    class="social-link"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="${social.label}"
  >${social.username.toUpperCase()}</a>
`;

// Create global template renderer instance
export const templateRenderer = new TemplateRenderer();

// Register all templates
templateRenderer.registerTemplate('project', projectTemplate);
templateRenderer.registerTemplate('skillCategory', skillCategoryTemplate);
templateRenderer.registerTemplate('contactItem', contactItemTemplate);
templateRenderer.registerTemplate('socialLink', socialLinkTemplate);

export default templateRenderer;
