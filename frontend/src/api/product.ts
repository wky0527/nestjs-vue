import request from './request'

// Products
export function getProductList(params?: any): Promise<any> {
  return request.get('/product/list', { params })
}

export function getProductDetail(id: number): Promise<any> {
  return request.get(`/product/${id}`)
}

export function createProduct(data: any): Promise<any> {
  return request.post('/product/create', data)
}

export function updateProduct(id: number, data: any): Promise<any> {
  return request.put(`/product/${id}`, data)
}

export function deleteProduct(id: number): Promise<any> {
  return request.delete(`/product/${id}`)
}

export function toggleProductSale(id: number): Promise<any> {
  return request.post(`/product/${id}/toggle-sale`)
}

export function getProductStats(): Promise<any> {
  return request.get('/product/stats')
}

export function batchUpdateProducts(ids: number[], data: any): Promise<any> {
  return request.post('/product/batch-update', { ids, data })
}

// Categories
export function getProductCategories(): Promise<any> {
  return request.get('/product/category/list')
}

export function createProductCategory(data: any): Promise<any> {
  return request.post('/product/category/create', data)
}

export function updateProductCategory(id: number, data: any): Promise<any> {
  return request.put(`/product/category/${id}`, data)
}

export function deleteProductCategory(id: number): Promise<any> {
  return request.delete(`/product/category/${id}`)
}

// Brands
export function getProductBrands(): Promise<any> {
  return request.get('/product/brand/list')
}

export function createProductBrand(data: any): Promise<any> {
  return request.post('/product/brand/create', data)
}

export function updateProductBrand(id: number, data: any): Promise<any> {
  return request.put(`/product/brand/${id}`, data)
}

export function deleteProductBrand(id: number): Promise<any> {
  return request.delete(`/product/brand/${id}`)
}

// Specs
export function getProductSpecs(): Promise<any> {
  return request.get('/product/spec/list')
}

export function createProductSpec(data: any): Promise<any> {
  return request.post('/product/spec', data)
}

export function updateProductSpec(id: number, data: any): Promise<any> {
  return request.put(`/product/spec/${id}`, data)
}

export function deleteProductSpec(id: number): Promise<any> {
  return request.delete(`/product/spec/${id}`)
}
