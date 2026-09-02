import request from './request'

export function getDashboard(): Promise<any> {
  return request.get('/statistics/dashboard')
}

export function getVisitAnalysis(period?: string): Promise<any> {
  return request.get('/statistics/visit', { params: { period } })
}

export function getSalesAnalysis(period?: string): Promise<any> {
  return request.get('/statistics/sales', { params: { period } })
}

export function getUserProfile(period?: string): Promise<any> {
  return request.get('/statistics/user-profile', { params: { period } })
}
