/**
 * Service Discovery (Feature #48)
 * Discovers and manages microservices
 */

const crypto = require('crypto');

class ServiceDiscovery {
  constructor(options = {}) {
    this.services = new Map();
    this.instances = new Map();
    this.healthChecks = new Map();
    this.heartbeatInterval = options.heartbeatInterval || 5000;
  }

  /**
   * Register service
   */
  registerService(name, instance) {
    const instanceId = crypto.randomUUID();
    const service = {
      id: instanceId,
      name,
      host: instance.host,
      port: instance.port,
      metadata: instance.metadata || {},
      registeredAt: new Date(),
      healthy: true,
      lastHeartbeat: Date.now(),
    };

    if (!this.services.has(name)) {
      this.services.set(name, []);
    }

    this.services.get(name).push(service);
    this.instances.set(instanceId, service);

    return instanceId;
  }

  /**
   * Discover service
   */
  discoverService(name) {
    const instances = this.services.get(name);
    if (!instances || instances.length === 0) {
      throw new Error(`Service ${name} not found`);
    }

    const healthyInstances = instances.filter((i) => i.healthy);
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances for ${name}`);
    }

    // Return random healthy instance
    return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
  }

  /**
   * Deregister service
   */
  deregisterService(instanceId) {
    const service = this.instances.get(instanceId);
    if (service) {
      const instances = this.services.get(service.name);
      if (instances) {
        const index = instances.indexOf(service);
        if (index > -1) {
          instances.splice(index, 1);
        }
      }
      this.instances.delete(instanceId);
      return true;
    }
    return false;
  }

  /**
   * Heartbeat
   */
  heartbeat(instanceId) {
    const service = this.instances.get(instanceId);
    if (service) {
      service.lastHeartbeat = Date.now();
      service.healthy = true;
    }
  }

  /**
   * List services
   */
  listServices(name = null) {
    if (name) {
      return this.services.get(name) || [];
    }
    return Array.from(this.services.values()).flat();
  }
}

module.exports = ServiceDiscovery;