/**
 * ORM Mapper (Feature #42)
 * Maps database records to objects
 */

class ORMMapper {
  constructor () {
    this.models = new Map()
    this.relations = new Map()
  }

  /**
   * Define model
   */
  defineModel (name, schema) {
    this.models.set(name, {
      name,
      schema,
      table: schema.table || name.toLowerCase() + 's',
      properties: Object.keys(schema.properties || {})
    })
  }

  /**
   * Define relation
   */
  defineRelation (sourceModel, targetModel, type, foreignKey) {
    const key = `${sourceModel}:${targetModel}`
    this.relations.set(key, {
      type, // hasOne, hasMany, belongsTo
      targetModel,
      foreignKey
    })
  }

  /**
   * Map row to model
   */
  mapRowToModel (modelName, row) {
    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    const instance = {}
    for (const prop of model.properties) {
      instance[prop] = row[prop]
    }

    instance._model = modelName
    instance._isDirty = false
    return instance
  }

  /**
   * Map rows to models
   */
  mapRowsToModels (modelName, rows) {
    return rows.map((row) => this.mapRowToModel(modelName, row))
  }

  /**
   * Get model schema
   */
  getModelSchema (modelName) {
    const model = this.models.get(modelName)
    return model ? model.schema : null
  }

  /**
   * Get relation
   */
  getRelation (sourceModel, targetModel) {
    const key = `${sourceModel}:${targetModel}`
    return this.relations.get(key)
  }
}

module.exports = ORMMapper
