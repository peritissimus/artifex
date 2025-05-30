class DataManager {
  constructor() {
    this.data = {
      projects: null,
      skills: null,
      contact: null,
      meta: null,
    };
    this.loaded = false;
    this.loading = false;
  }

  async loadAll() {
    if (this.loading) return;
    if (this.loaded) return this.data;

    this.loading = true;

    try {
      const [projectsRes, skillsRes, contactRes, metaRes] = await Promise.all([
        fetch('/src/data/projects.json'),
        fetch('/src/data/skills.json'),
        fetch('/src/data/contact.json'),
        fetch('/src/data/meta.json'),
      ]);

      this.data.projects = await projectsRes.json();
      this.data.skills = await skillsRes.json();
      this.data.contact = await contactRes.json();
      this.data.meta = await metaRes.json();

      this.loaded = true;
      this.loading = false;

      return this.data;
    } catch (error) {
      console.error('Failed to load data:', error);
      this.loading = false;
      throw error;
    }
  }

  getProjects() {
    return this.data.projects?.projects || [];
  }

  getFeaturedProjects() {
    return this.getProjects().filter((project) => project.featured);
  }

  getSkillCategories() {
    return this.data.skills?.skillCategories || [];
  }

  getContact() {
    return this.data.contact?.contact || {};
  }

  getSocial() {
    return this.data.contact?.social || {};
  }

  getMeta() {
    return this.data.meta || {};
  }

  getSite() {
    return this.data.meta?.site || {};
  }

  getPerson() {
    return this.data.meta?.person || {};
  }

  getBranding() {
    return this.data.meta?.branding || {};
  }
}

export const dataManager = new DataManager();
export default dataManager;
