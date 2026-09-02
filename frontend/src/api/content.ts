import request from './request'

// Articles
export function getArticleList(params?: any): Promise<any> {
  return request.get('/content/article/list', { params })
}

export function getArticleDetail(id: number): Promise<any> {
  return request.get(`/content/article/${id}`)
}

export function createArticle(data: any): Promise<any> {
  return request.post('/content/article/create', data)
}

export function updateArticle(id: number, data: any): Promise<any> {
  return request.put(`/content/article/${id}`, data)
}

export function deleteArticle(id: number): Promise<any> {
  return request.delete(`/content/article/${id}`)
}

export function getArticleStats(): Promise<any> {
  return request.get('/content/article/stats')
}

export function batchArticle(ids: number[], action: string): Promise<any> {
  return request.post('/content/article/batch', { ids, action })
}

// Categories
export function getContentCategories(): Promise<any> {
  return request.get('/content/category/list')
}

export function createContentCategory(data: any): Promise<any> {
  return request.post('/content/category/create', data)
}

export function updateContentCategory(id: number, data: any): Promise<any> {
  return request.put(`/content/category/${id}`, data)
}

export function deleteContentCategory(id: number): Promise<any> {
  return request.delete(`/content/category/${id}`)
}

// Ads
export function getAdList(positionId?: number): Promise<any> {
  return request.get('/content/ad/list', { params: { positionId } })
}

export function createAd(data: any): Promise<any> {
  return request.post('/content/ad/create', data)
}

export function updateAd(id: number, data: any): Promise<any> {
  return request.put(`/content/ad/${id}`, data)
}

export function deleteAd(id: number): Promise<any> {
  return request.delete(`/content/ad/${id}`)
}

// Ad Positions
export function getAdPositions(): Promise<any> {
  return request.get('/content/ad-position/list')
}

export function createAdPosition(data: any): Promise<any> {
  return request.post('/content/ad-position', data)
}

export function updateAdPosition(id: number, data: any): Promise<any> {
  return request.put(`/content/ad-position/${id}`, data)
}

export function deleteAdPosition(id: number): Promise<any> {
  return request.delete(`/content/ad-position/${id}`)
}

// Announcements
export function getAnnouncementList(params?: any): Promise<any> {
  return request.get('/content/announcement/list', { params })
}

export function createAnnouncement(data: any): Promise<any> {
  return request.post('/content/announcement/create', data)
}

export function updateAnnouncement(id: number, data: any): Promise<any> {
  return request.put(`/content/announcement/${id}`, data)
}

export function deleteAnnouncement(id: number): Promise<any> {
  return request.delete(`/content/announcement/${id}`)
}
