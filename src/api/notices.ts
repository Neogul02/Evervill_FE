import client from './client'
import type { ApiResponse } from '@/types'
import type { NoticeResponse } from '@/types/notice'

export const noticesApi = {
  getList: (type = 'NOTICE') =>
    client.get<ApiResponse<NoticeResponse[]>>('/api/notices', { params: { type } }),
}
