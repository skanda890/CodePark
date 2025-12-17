const cron = require('node-cron');
const EventEmitter = require('events');

class JobScheduler extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
  }

  schedule(jobName, cronExpression, handler, options = {}) {
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Executing job: ${jobName}`);
        await handler();
        this.emit('jobCompleted', { jobName, timestamp: new Date() });
      } catch (error) {
        console.error(`Job failed: ${jobName} - ${error.message}`);
        this.emit('jobFailed', { jobName, error, timestamp: new Date() });
      }
    }, { scheduled: false });

    this.jobs.set(jobName, {
      task,
      expression: cronExpression,
      handler,
      active: true,
      createdAt: new Date(),
      lastRun: null,
      nextRun: task.nextDate().toJSDate()
    });

    task.start();
    return jobName;
  }

  stop(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.task.stop();
      job.active = false;
      return true;
    }
    return false;
  }

  start(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.task.start();
      job.active = true;
      return true;
    }
    return false;
  }

  getJobs() {
    return Array.from(this.jobs.values()).map(job => ({
      active: job.active,
      expression: job.expression,
      createdAt: job.createdAt,
      lastRun: job.lastRun,
      nextRun: job.nextRun
    }));
  }
}

module.exports = JobScheduler;
