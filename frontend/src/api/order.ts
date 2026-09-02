import request from './request'

export function getOrderList(params?: any): Promise<any> {
  return request.get('/order/list', { params })
}

export function getOrderDetail(id: number): Promise<any> {
  return request.get(`/order/${id}`)
}

export function createOrder(data: any): Promise<any> {
  return request.post('/order/create', data)
}

export function updateOrder(id: number, data: any): Promise<any> {
  return request.put(`/order/${id}`, data)
}

export function deleteOrder(id: number): Promise<any> {
  return request.delete(`/order/${id}`)
}

export function shipOrder(id: number, logisticsCompany: string, logisticsNo: string): Promise<any> {
  return request.post(`/order/${id}/ship`, { logisticsCompany, logisticsNo })
}

export function getOrderStats(): Promise<any> {
  return request.get('/order/stats')
}

export function batchDeleteOrders(ids: number[]): Promise<any> {
  return request.post('/order/batch-delete', { ids })
}

// After Sale
export function getAfterSaleList(params?: any): Promise<any> {
  return request.get('/order/after-sale/list', { params })
}

export function createAfterSale(data: any): Promise<any> {
  return request.post('/order/after-sale/create', data)
}

export function handleAfterSale(id: number, status: string, handleResult: string): Promise<any> {
  return request.put(`/order/after-sale/${id}/handle`, { status, handleResult })
}

export function reviewAfterSale(id: number, data: any): Promise<any> {
  return request.put(`/order/after-sale/${id}/review`, data)
}

export function getAfterSaleStats(): Promise<any> {
  return request.get('/order/after-sale/stats')
}

// Shipping Companies
export function getShippingCompanies(): Promise<any> {
  return request.get('/order/shipping-company/list')
}

export function createShippingCompany(data: any): Promise<any> {
  return request.post('/order/shipping-company', data)
}

export function updateShippingCompany(id: number, data: any): Promise<any> {
  return request.put(`/order/shipping-company/${id}`, data)
}

export function deleteShippingCompany(id: number): Promise<any> {
  return request.delete(`/order/shipping-company/${id}`)
}

// Shipping Templates
export function getShippingTemplates(): Promise<any> {
  return request.get('/order/shipping-template/list')
}

export function createShippingTemplate(data: any): Promise<any> {
  return request.post('/order/shipping-template', data)
}

export function updateShippingTemplate(id: number, data: any): Promise<any> {
  return request.put(`/order/shipping-template/${id}`, data)
}

export function deleteShippingTemplate(id: number): Promise<any> {
  return request.delete(`/order/shipping-template/${id}`)
}
