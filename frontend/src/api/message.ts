import request from './request'

// Messages
export function getMessageList(params?: any): Promise<any> {
  return request.get('/message/list', { params })
}

export function createMessage(data: any): Promise<any> {
  return request.post('/message/create', data)
}

export function markMessageRead(id: number): Promise<any> {
  return request.put(`/message/${id}/read`)
}

export function markAllMessagesRead(): Promise<any> {
  return request.put('/message/read-all')
}

export function deleteMessage(id: number): Promise<any> {
  return request.delete(`/message/${id}`)
}

export function getUnreadCount(): Promise<any> {
  return request.get('/message/unread-count')
}

export function batchDeleteMessages(ids: number[]): Promise<any> {
  return request.post('/message/batch-delete', { ids })
}

export function batchMarkRead(ids: number[]): Promise<any> {
  return request.post('/message/batch-read', { ids })
}

// Templates
export function getTemplateList(params?: any): Promise<any> {
  return request.get('/message/template/list', { params })
}

export function createTemplate(data: any): Promise<any> {
  return request.post('/message/template/create', data)
}

export function updateTemplate(id: number, data: any): Promise<any> {
  return request.put(`/message/template/${id}`, data)
}

export function deleteTemplate(id: number): Promise<any> {
  return request.delete(`/message/template/${id}`)
}

// Push Records
export function getPushRecordList(params?: any): Promise<any> {
  return request.get('/message/push/list', { params })
}

export function createPushRecord(data: any): Promise<any> {
  return request.post('/message/push/create', data)
}

export function getPushRecordDetail(id: number): Promise<any> {
  return request.get(`/message/push/${id}/detail`)
}

export function retryPushRecord(id: number): Promise<any> {
  return request.post(`/message/push/${id}/retry`)
}

export function getPushStats(): Promise<any> {
  return request.get('/message/push/stats')
}
