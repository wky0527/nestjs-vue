import request from './request'

// Settings
export function getSettings(group?: string): Promise<any> {
  return request.get('/settings/list', { params: { group } })
}

export function getSetting(key: string): Promise<any> {
  return request.get(`/settings/${key}`)
}

export function updateSetting(key: string, value: string): Promise<any> {
  return request.put(`/settings/${key}`, { value })
}

export function batchUpdateSettings(settings: { key: string; value: string }[]): Promise<any> {
  return request.put('/settings/batch', { settings })
}

// Logs
export function getLogList(params?: any): Promise<any> {
  return request.get('/settings/log/list', { params })
}

export function createLog(data: any): Promise<any> {
  return request.post('/settings/log/create', data)
}

export function cleanupLogs(days: number): Promise<any> {
  return request.delete('/settings/log/cleanup', { data: { days } })
}

export function getLogStats(): Promise<any> {
  return request.get('/settings/log/stats')
}

// Statistics
export function getOverview(): Promise<any> {
  return request.get('/statistics/overview')
}

export function getSalesReport(): Promise<any> {
  return request.get('/statistics/sales-report')
}

export function getUserLevelStats(): Promise<any> {
  return request.get('/statistics/user-level')
}

export function getOrderStatusStats(): Promise<any> {
  return request.get('/statistics/order-status')
}
