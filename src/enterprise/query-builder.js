/**
 * Database Query Builder (Feature #41)
 * Constructs complex database queries programmatically
 */

class QueryBuilder {
  constructor (table) {
    this.table = table
    this.selections = ['*']
    this.conditions = []
    this.joins = []
    this.orders = []
    this.limit_value = null
    this.offset_value = 0
  }

  /**
   * Select columns
   */
  select (...columns) {
    this.selections = columns
    return this
  }

  /**
   * Where condition
   */
  where (field, operator, value) {
    this.conditions.push({
      field,
      operator,
      value,
      type: 'AND'
    })
    return this
  }

  /**
   * OR condition
   */
  orWhere (field, operator, value) {
    this.conditions.push({
      field,
      operator,
      value,
      type: 'OR'
    })
    return this
  }

  /**
   * Join table
   */
  join (table, field1, operator, field2) {
    this.joins.push({
      type: 'INNER',
      table,
      field1,
      operator,
      field2
    })
    return this
  }

  /**
   * Order by
   */
  orderBy (field, direction = 'ASC') {
    this.orders.push({ field, direction })
    return this
  }

  /**
   * Limit results
   */
  limit (count) {
    this.limit_value = count
    return this
  }

  /**
   * Offset results
   */
  offset (count) {
    this.offset_value = count
    return this
  }

  /**
   * Build SQL query
   */
  toSQL () {
    let sql = `SELECT ${this.selections.join(', ')} FROM ${this.table}`

    if (this.joins.length > 0) {
      for (const join of this.joins) {
        sql += ` ${join.type} JOIN ${join.table} ON ${join.field1} ${join.operator} ${join.field2}`
      }
    }

    if (this.conditions.length > 0) {
      sql += ' WHERE '
      const conditionStrings = this.conditions.map(
        (c, i) => `${i > 0 ? c.type : ''} ${c.field} ${c.operator} ?`
      )
      sql += conditionStrings.join(' ')
    }

    if (this.orders.length > 0) {
      sql +=
        ' ORDER BY ' +
        this.orders.map((o) => `${o.field} ${o.direction}`).join(', ')
    }

    if (this.limit_value) {
      sql += ` LIMIT ${this.limit_value}`
    }

    if (this.offset_value) {
      sql += ` OFFSET ${this.offset_value}`
    }

    return sql
  }

  /**
   * Get parameters
   */
  getParameters () {
    return this.conditions.map((c) => c.value)
  }
}

module.exports = QueryBuilder
