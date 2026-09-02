import request from './request'

export function getCart(userId: number): Promise<any> {
  return request.get(`/cart/${userId}`)
}

export function getCartStats(userId: number): Promise<any> {
  return request.get(`/cart/${userId}/stats`)
}

export function addToCart(data: { userId: number; productId: number; quantity?: number; spec?: string }): Promise<any> {
  return request.post('/cart/add', data)
}

export function updateCartQuantity(id: number, data: { userId: number; quantity: number }): Promise<any> {
  return request.put(`/cart/${id}/quantity`, data)
}

export function toggleCartChecked(id: number, data: { userId: number; checked: boolean }): Promise<any> {
  return request.put(`/cart/${id}/checked`, data)
}

export function toggleAllChecked(userId: number, data: { checked: boolean }): Promise<any> {
  return request.put(`/cart/${userId}/check-all`, data)
}

export function removeCartItem(id: number, userId: number): Promise<any> {
  return request.delete(`/cart/${id}`, { params: { userId } })
}

export function clearCart(userId: number): Promise<any> {
  return request.delete(`/cart/${userId}/clear`)
}

export function checkoutCart(data: {
  userId: number;
  address: string;
  receiverName: string;
  receiverPhone: string;
  paymentMethod: string;
  remark?: string;
  itemIds?: number[];
}): Promise<any> {
  return request.post('/cart/checkout', data)
}
