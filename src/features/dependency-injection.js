/**
 * Dependency Injection Container (Feature #28)
 * Manages dependencies and their lifecycles
 */

class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  /**
   * Register service
   */
  register(name, factory, options = {}) {
    this.services.set(name, {
      factory,
      singleton: options.singleton !== false,
      dependencies: options.dependencies || [],
    });
  }

  /**
   * Get service
   */
  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not registered`);
    }

    const service = this.services.get(name);

    if (service.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const dependencies = service.dependencies.map((dep) => this.get(dep));

    const instance = service.factory(...dependencies);

    if (service.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Register singleton
   */
  singleton(name, instance) {
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      dependencies: [],
    });
    this.singletons.set(name, instance);
  }
}

module.exports = DIContainer;