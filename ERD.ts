export interface ListingImages {
  id: number; // PK / BIGINT
  listing_id: number; // FK / BIGINT
  image_url: string; // VARCHAR(500)
  sort_order: number; // INT
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
}

export interface MarketProperties {
  id: number; // PK / BIGINT
  city: string; // VARCHAR(50)
  district: string; // VARCHAR(50)
  neighborhood: string; // VARCHAR(50)
  deal_type: string; // ENUM('SALE', 'JEONSE', 'MONTHLY')
  price: number; // BIGINT
  deposit: number | null; // BIGINT
  monthly_rent: number | null; // BIGINT
  area: number | null; // DECIMAL(10, 2)
  floor: number | null; // INT
  deal_date: Date | null; // DATE
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
  updated_at: Date; // DATETIME
}

export interface Listings {
  id: number; // PK / BIGINT
  seller_id: number; // users.id 참조 (FK 없음) / BIGINT
  title: string; // VARCHAR(200)
  description: string | null; // TEXT
  deal_type: string; // ENUM('SALE', 'JEONSE', 'MONTHLY')
  sale_price: number | null; // BIGINT
  jeonse_price: number | null; // BIGINT
  deposit: number | null; // BIGINT
  monthly_rent: number | null; // BIGINT
  city: string; // VARCHAR(50)
  district: string; // VARCHAR(50)
  neighborhood: string; // VARCHAR(50)
  address_detail: string | null; // VARCHAR(200)
  latitude: number | null; // DECIMAL(10, 7)
  longitude: number | null; // DECIMAL(10, 7)
  area: number | null; // DECIMAL(10, 2)
  floor: number | null; // INT
  status: string; // ENUM('ACTIVE', 'RESERVED', 'COMPLETED')
  thumbnail_url: string | null; // VARCHAR(500)
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
  updated_at: Date; // DATETIME
}

export interface ChatRooms {
  id: number; // PK / BIGINT
  listing_id: number; // FK / BIGINT
  buyer_id: number; // users.id 참조 (FK 없음) / BIGINT
  seller_id: number; // users.id 참조 (FK 없음) / BIGINT
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
}

export interface Reports {
  id: number; // PK / BIGINT
  reporter_id: number; // users.id 참조 (FK 없음) / BIGINT
  target_type: string; // ENUM('USER', 'LISTING')
  target_id: number; // BIGINT
  reason: string; // ENUM('SPAM', 'FRAUD', 'INAPPROPRIATE', 'OTHER')
  description: string | null; // TEXT
  status: string; // ENUM('PENDING', 'RESOLVED', 'DISMISSED')
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
  updated_at: Date; // DATETIME
}

export interface ListingBookmarks {
  id: number; // PK / BIGINT
  user_id: number; // users.id 참조 (FK 없음) / BIGINT
  listing_id: number; // FK / BIGINT
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
}

export interface ChatMessages {
  id: number; // PK / BIGINT
  chat_room_id: number; // FK / BIGINT
  sender_id: number; // users.id 참조 (FK 없음) / BIGINT
  content: string; // TEXT
  is_read: number; // TINYINT(1)
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
}

export interface AiAnalyses {
  id: number; // PK / BIGINT
  user_id: number; // users.id 참조 (FK 없음) / BIGINT
  analysis_type: string; // ENUM('PRICE', 'REGISTRY')
  target_id: number | null; // 분석 대상 매물 ID / BIGINT
  file_url: string | null; // 등기부 파일 URL / VARCHAR(500)
  result_level: string | null; // ENUM('SAFE', 'CAUTION', 'DANGER')
  summary: string | null; // TEXT
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
}

export interface Notices {
  id: number; // PK / BIGINT
  author_id: number; // users.id 참조 (FK 없음) / BIGINT
  notice_type: string; // ENUM('NOTICE', 'POPUP')
  title: string; // VARCHAR(200)
  content: string; // TEXT
  is_active: number; // TINYINT(1)
  start_at: Date | null; // DATETIME
  end_at: Date | null; // DATETIME
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
  updated_at: Date; // DATETIME
}

export interface MarketBookmarks {
  id: number; // PK / BIGINT
  user_id: number; // users.id 참조 (FK 없음) / BIGINT
  market_property_id: number; // FK / BIGINT
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
}

export interface Users {
  id: number; // PK / BIGINT
  email: string; // VARCHAR(100)
  password: string | null; // VARCHAR(255)
  nickname: string; // VARCHAR(50)
  role: string; // ENUM('USER', 'ADMIN')
  is_deleted: number; // TINYINT(1)
  deleted_at: Date | null; // DATETIME
  created_at: Date; // DATETIME
  updated_at: Date; // DATETIME
}

export interface SocialAccounts {
  id: number; // PK / BIGINT
  user_id: number; // FK / BIGINT
  provider: string; // ENUM('KAKAO')
  provider_id: string; // VARCHAR(100)
  created_at: Date; // DATETIME
}
