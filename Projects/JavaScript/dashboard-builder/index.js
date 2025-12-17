class DashboardBuilder {
  constructor () {
    this.dashboards = new Map()
    this.widgets = new Map()
  }

  createDashboard (userId, name) {
    const dashboard = {
      id: Math.random().toString(36).substring(7),
      userId,
      name,
      widgets: [],
      layout: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.dashboards.set(dashboard.id, dashboard)
    return dashboard
  }

  addWidget (dashboardId, widgetConfig) {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) return null

    const widget = {
      id: Math.random().toString(36).substring(7),
      type: widgetConfig.type,
      title: widgetConfig.title,
      config: widgetConfig.config,
      position: widgetConfig.position,
      createdAt: new Date()
    }

    dashboard.widgets.push(widget)
    dashboard.updatedAt = new Date()
    return widget
  }

  removeWidget (dashboardId, widgetId) {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) return false

    dashboard.widgets = dashboard.widgets.filter((w) => w.id !== widgetId)
    dashboard.updatedAt = new Date()
    return true
  }

  updateLayout (dashboardId, layout) {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) return null

    dashboard.layout = layout
    dashboard.updatedAt = new Date()
    return dashboard
  }

  getDashboard (dashboardId) {
    return this.dashboards.get(dashboardId)
  }

  getUserDashboards (userId) {
    const userDashboards = []
    for (const dashboard of this.dashboards.values()) {
      if (dashboard.userId === userId) {
        userDashboards.push(dashboard)
      }
    }
    return userDashboards
  }
}

module.exports = DashboardBuilder
