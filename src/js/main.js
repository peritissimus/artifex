class Peritissimus {
  constructor() {
    this.canvas = document.getElementById('world');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.init();
    this.setupEventListeners();
  }

  init() {
    // Canvas context could be initialized here if needed
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());

    // Project item click navigation
    document.querySelectorAll('.project-item').forEach((item) => {
      item.addEventListener('click', () => {
        const path = item.getAttribute('data-path');
        if (path) {
          window.location.href = path;
        }
      });
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  new Peritissimus();
});
