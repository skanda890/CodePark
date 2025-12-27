/**
 * Batch Job Processor (Feature #18)
 * Processes jobs in batches with progress tracking
 */

const crypto = require('crypto');

class BatchProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.concurrency = options.concurrency || 5;
    this.timeout = options.timeout || 30000;
    this.jobs = new Map();
    this.results = new Map();
  }

  /**
   * Create batch job
   */
  createBatch(items, processFn, options = {}) {
    const batchId = crypto.randomUUID();
    const batch = {
      id: batchId,
      items,
      processFn,
      status: 'pending',
      progress: 0,
      totalItems: items.length,
      processedItems: 0,
      failedItems: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    };

    this.jobs.set(batchId, batch);
    return batch;
  }

  /**
   * Process batch
   */
  async processBatch(batchId) {
    const batch = this.jobs.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.status = 'processing';
    batch.startedAt = new Date();

    const batches = this.createBatches(batch.items, this.batchSize);
    const batchResults = [];

    for (const batchChunk of batches) {
      const results = await this.processBatchChunk(
        batch,
        batchChunk,
        batchResults
      );
      batchResults.push(...results);
    }

    batch.status = 'completed';
    batch.completedAt = new Date();

    this.results.set(batchId, batchResults);

    return {
      batchId,
      results: batchResults,
      summary: {
        total: batch.totalItems,
        processed: batch.processedItems,
        failed: batch.failedItems,
        successRate: `${((batch.processedItems / batch.totalItems) * 100).toFixed(2)}%`,
      },
    };
  }

  /**
   * Process batch chunk
   */
  async processBatchChunk(batch, items, previousResults) {
    const promises = items.map((item) =>
      this.processItem(batch, item).catch((error) => ({
        item,
        error: error.message,
        success: false,
      }))
    );

    return Promise.all(promises);
  }

  /**
   * Process single item
   */
  async processItem(batch, item) {
    try {
      const result = await Promise.race([
        batch.processFn(item),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Processing timeout')),
            this.timeout
          )
        ),
      ]);

      batch.processedItems += 1;
      batch.progress = (batch.processedItems / batch.totalItems) * 100;

      return {
        item,
        result,
        success: true,
      };
    } catch (error) {
      batch.failedItems += 1;
      batch.progress = (batch.processedItems / batch.totalItems) * 100;

      return {
        item,
        error: error.message,
        success: false,
      };
    }
  }

  /**
   * Create batches from items
   */
  createBatches(items, size) {
    const batches = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId) {
    return this.jobs.get(batchId);
  }

  /**
   * Get batch results
   */
  getBatchResults(batchId) {
    return this.results.get(batchId);
  }
}

module.exports = BatchProcessor;
