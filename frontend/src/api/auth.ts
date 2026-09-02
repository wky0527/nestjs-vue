import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  companyId: number
  roleId: number
  roleName: string
}

export interface LoginResult {
  data: {
    access_token: string
    user: UserInfo
  }
}

export interface MenuItem {
  id: number
  name: string
  title: string
  path: string
  component: string
  icon: string
  parentId: number
  order: number
  visible: boolean
  enabled: boolean
  roles: string[]
  children: MenuItem[]
}

export interface ButtonItem {
  id: number
  name: string
  title: string
  action: string
  description: string
  roles: string[]
  menuId: number
  enabled: boolean
}

export function login(data: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', data)
}

export function getProfile(): Promise<UserInfo> {
  return request.get('/auth/profile')
}

export function getMenus(): Promise<MenuItem[]> {
  return request.get('/auth/menus')
}

export function getButtons(): Promise<ButtonItem[]> {
  return request.get('/auth/buttons')
}

export function getButtonsByMenu(menuId: number): Promise<ButtonItem[]> {
  return request.get(`/auth/buttons/${menuId}`)
}

// Roles
export function getRoleList(): Promise<any> {
  return request.get('/auth/role/list')
}

export function createRole(data: any): Promise<any> {
  return request.post('/auth/role', data)
}

export function updateRole(id: number, data: any): Promise<any> {
  return request.put(`/auth/role/${id}`, data)
}

export function deleteRole(id: number): Promise<any> {
  return request.delete(`/auth/role/${id}`)
}

export function getRolePermissions(id: number): Promise<any> {
  return request.get(`/auth/role/${id}/permissions`)
}

export function updateRolePermissions(id: number, permissions: any): Promise<any> {
  return request.put(`/auth/role/${id}/permissions`, { permissions })
}

// Admins
export function getAdminList(params?: any): Promise<any> {
  return request.get('/auth/admin/list', { params })
}

export function createAdmin(data: any): Promise<any> {
  return request.post('/auth/admin', data)
}

export function updateAdmin(id: number, data: any): Promise<any> {
  return request.put(`/auth/admin/${id}`, data)
}

export function deleteAdmin(id: number): Promise<any> {
  return request.delete(`/auth/admin/${id}`)
}

export function resetAdminPassword(id: number, password: string): Promise<any> {
  return request.put(`/auth/admin/${id}/reset-password`, { password })
}

// All menus for permission config
export function getAllMenus(): Promise<any> {
  return request.get('/auth/all-menus')
}
