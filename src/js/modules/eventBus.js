class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data = null) {
    if (!this.events.has(event)) return;
    
    this.events.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  once(event, callback) {
    const onceWrapper = (data) => {
      callback(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  hasListeners(event) {
    return this.events.has(event) && this.events.get(event).length > 0;
  }
}

export const eventBus = new EventBus();
export default eventBus;