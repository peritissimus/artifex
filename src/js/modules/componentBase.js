import { eventBus } from './eventBus.js';

export class ComponentBase {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.defaultOptions, ...options };
    this.initialized = false;
    this.destroyed = false;
    this.eventListeners = [];
    
    this.init();
  }

  get defaultOptions() {
    return {};
  }

  init() {
    if (this.initialized) return;
    
    this.setupEvents();
    this.render();
    this.afterInit();
    
    this.initialized = true;
    this.emit('component:initialized', { component: this });
  }

  setupEvents() {
    // Override in subclasses
  }

  render() {
    // Override in subclasses
  }

  afterInit() {
    // Override in subclasses for post-initialization logic
  }

  addEventListener(element, event, handler, options = {}) {
    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);
    
    this.eventListeners.push({
      element,
      event,
      handler: boundHandler,
      options
    });
  }

  removeEventListener(element, event, handler) {
    const index = this.eventListeners.findIndex(
      listener => listener.element === element && 
                 listener.event === event && 
                 listener.handler === handler
    );
    
    if (index > -1) {
      const listener = this.eventListeners[index];
      element.removeEventListener(event, listener.handler, listener.options);
      this.eventListeners.splice(index, 1);
    }
  }

  on(event, callback) {
    eventBus.on(event, callback);
  }

  emit(event, data) {
    eventBus.emit(event, data);
  }

  update(newOptions = {}) {
    this.options = { ...this.options, ...newOptions };
    this.render();
    this.emit('component:updated', { component: this });
  }

  destroy() {
    if (this.destroyed) return;
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];
    
    // Override for custom cleanup
    this.beforeDestroy();
    
    this.destroyed = true;
    this.emit('component:destroyed', { component: this });
  }

  beforeDestroy() {
    // Override in subclasses for cleanup logic
  }

  $(selector) {
    return this.element.querySelector(selector);
  }

  $$(selector) {
    return Array.from(this.element.querySelectorAll(selector));
  }

  addClass(className) {
    this.element.classList.add(className);
    return this;
  }

  removeClass(className) {
    this.element.classList.remove(className);
    return this;
  }

  toggleClass(className) {
    this.element.classList.toggle(className);
    return this;
  }

  hasClass(className) {
    return this.element.classList.contains(className);
  }

  hide() {
    this.element.style.display = 'none';
    return this;
  }

  show() {
    this.element.style.display = '';
    return this;
  }

  isVisible() {
    return this.element.offsetParent !== null;
  }
}

export default ComponentBase;