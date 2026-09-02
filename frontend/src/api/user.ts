import request from './request'

export interface UserItem {
  id: number
  username: string
  phone?: string
  email?: string
  avatar?: string
  companyId?: number
  roleId?: number
  level: string
  isBlacklisted: boolean
  blacklistReason?: string
  roleRef?: any
  gender?: string
  birthday?: string
  status?: string
  lastLoginAt?: string
  lastLoginIp?: string
  growthValue?: number
  createdAt: string
}

export function getUserList(params?: any): Promise<any> {
  return request.get('/user/list', { params })
}

export function getUserDetail(id: number): Promise<UserItem> {
  return request.get(`/user/${id}`)
}

export function createUser(data: any): Promise<any> {
  return request.post('/user/create', data)
}

export function updateUser(id: number, data: any): Promise<any> {
  return request.put(`/user/${id}`, data)
}

export function deleteUser(id: number): Promise<any> {
  return request.delete(`/user/${id}`)
}

export function updateUserLevel(id: number, level: string): Promise<any> {
  return request.put(`/user/${id}/level`, { level })
}

export function toggleUserBlacklist(id: number, isBlacklisted: boolean, reason?: string): Promise<any> {
  return request.put(`/user/${id}/blacklist`, { isBlacklisted, reason })
}

export function getUserStats(): Promise<any> {
  return request.get('/user/stats')
}

export function batchUpdateUsers(ids: number[], data: any): Promise<any> {
  return request.put('/user/batch-update', { ids, data })
}

export function resetUserPassword(id: number, password: string): Promise<any> {
  return request.put(`/user/${id}/reset-password`, { password })
}

export function updateUserRole(id: number, roleId: number): Promise<any> {
  return request.put(`/user/${id}/role`, { roleId })
}

export function getUserLoginLogs(id: number): Promise<any> {
  return request.get(`/user/${id}/login-logs`)
}

// Member Levels
export function getMemberLevels(): Promise<any> {
  return request.get('/user/levels')
}

export function createMemberLevel(data: any): Promise<any> {
  return request.post('/user/levels', data)
}

export function updateMemberLevel(id: number, data: any): Promise<any> {
  return request.put(`/user/levels/${id}`, data)
}

export function deleteMemberLevel(id: number): Promise<any> {
  return request.delete(`/user/levels/${id}`)
}

// Blacklist
export function getBlacklist(params?: any): Promise<any> {
  return request.get('/user/blacklist', { params })
}

export function addToBlacklist(data: any): Promise<any> {
  return request.post('/user/blacklist', data)
}

export function unblockFromBlacklist(id: number): Promise<any> {
  return request.put(`/user/blacklist/${id}/unblock`)
}
