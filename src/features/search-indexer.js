/**
 * Search Index Manager (Feature #22)
 * Manages search indexes for fast queries
 */

class SearchIndexManager {
  constructor() {
    this.indexes = new Map();
    this.documents = new Map();
  }

  /**
   * Create index
   */
  createIndex(name, fields = []) {
    const index = {
      name,
      fields,
      documents: new Map(),
      createdAt: new Date(),
    };
    this.indexes.set(name, index);
    return index;
  }

  /**
   * Index document
   */
  indexDocument(indexName, documentId, data) {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    const indexedData = {};
    for (const field of index.fields) {
      if (data[field]) {
        indexedData[field] = data[field];
      }
    }

    index.documents.set(documentId, indexedData);
    this.documents.set(`${indexName}:${documentId}`, data);

    return indexedData;
  }

  /**
   * Search index
   */
  search(indexName, query, limit = 10) {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    const results = [];
    const queryLower = query.toLowerCase();

    for (const [documentId, data] of index.documents.entries()) {
      let score = 0;

      for (const field of index.fields) {
        const fieldValue = String(data[field]).toLowerCase();
        if (fieldValue.includes(queryLower)) {
          score += 1;
        }
      }

      if (score > 0) {
        results.push({
          documentId,
          score,
          data: this.documents.get(`${indexName}:${documentId}`),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Delete from index
   */
  deleteFromIndex(indexName, documentId) {
    const index = this.indexes.get(indexName);
    if (index) {
      index.documents.delete(documentId);
      this.documents.delete(`${indexName}:${documentId}`);
    }
  }
}

module.exports = SearchIndexManager;