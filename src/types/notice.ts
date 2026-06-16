export interface NoticeResponse {
  id: number
  title: string
  content: string
  type: 'NOTICE' | 'EVENT'
  isActive: boolean
  createdAt: string
  updatedAt: string
}
