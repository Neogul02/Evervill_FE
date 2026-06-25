# Evervill 클래스 다이어그램 (도메인 모델)

> `src/types/*.ts`에 정의된 애플리케이션 도메인 타입을 기준으로 작성한 분석/설계 수준 클래스 다이어그램이다. 프론트엔드는 순수 데이터 타입(인터페이스)만 가지므로 메서드는 생략하고 속성·관계 중심으로 표현했다. DB 컬럼명(snake_case)과의 매핑은 `docs/er-diagram.md` 참고.

```mermaid
classDiagram
    class User {
        +number id
        +string email
        +string nickname
        +string profileImageUrl
        +Role role
        +DealerStatus dealerStatus
        +string createdAt
        +string updatedAt
    }

    class DealerProfile {
        +string realEstateLocation
        +string brokerRegistrationNumber
        +string businessRegistrationFileUrl
        +string brokerLicenseFileUrl
    }

    class RealtorApplication {
        +number id
        +number userId
        +string businessName
        +string businessNumber
        +string officeAddress
        +string licenseImageUrl
        +RealtorApplicationStatus status
        +string createdAt
    }

    class Listing {
        +number id
        +number sellerId
        +string title
        +string description
        +DealType dealType
        +number price
        +number monthlyRent
        +number area
        +number floor
        +string address
        +string addressDetail
        +number latitude
        +number longitude
        +ListingStatus status
        +number viewCount
        +number bookmarkCount
        +boolean bookmarked
        +string createdAt
    }

    class ListingImage {
        +number id
        +string imageUrl
        +number sortOrder
    }

    class ListingOffer {
        +number id
        +number dealerId
        +number price
        +OfferStatus status
        +string createdAt
    }

    class ListingBookmark {
        +number id
        +number userId
        +number listingId
    }

    class MarketProperty {
        +number id
        +string districtCode
        +string districtName
        +string propertyName
        +MarketPropertyType propertyType
        +MarketDealType dealType
        +number dealAmount
        +number monthlyRent
        +number area
        +number floor
        +number buildYear
        +number dealYear
        +number dealMonth
        +number dealDay
        +boolean bookmarked
    }

    class MarketBookmark {
        +number id
        +number userId
        +number marketPropertyId
    }

    class ChatRoom {
        +number id
        +number listingId
        +string lastMessage
        +string lastMessageAt
        +number unreadCount
        +string createdAt
    }

    class ChatParticipant {
        +number userId
        +ParticipantRole role
        +boolean active
        +string nickname
    }

    class ChatMessage {
        +number id
        +number chatRoomId
        +number senderId
        +string content
        +boolean isRead
        +string createdAt
    }

    class AiAnalysis {
        +number id
        +AnalysisType analysisType
        +number targetId
        +string fileUrl
        +RiskLevel riskLevel
        +string resultSummary
        +string createdAt
    }

    class Notice {
        +number id
        +string title
        +string content
        +NoticeType type
        +boolean isActive
        +string startAt
        +string endAt
        +string createdAt
    }

    class Report {
        +number id
        +number reporterId
        +ReportTargetType targetType
        +number targetId
        +string reason
        +ReportStatus status
        +string createdAt
        +string processedAt
    }

    class SocialAccount {
        +number id
        +SocialProvider provider
        +string providerId
        +string createdAt
    }

    %% --- Enumerations ---
    class Role {
        <<enumeration>>
        USER
        DEALER
        ADMIN
    }
    class DealerStatus {
        <<enumeration>>
        NONE
        PENDING
        APPROVED
        REJECTED
    }
    class DealType {
        <<enumeration>>
        SALE
        JEONSE
        MONTHLY_RENT
    }
    class ListingStatus {
        <<enumeration>>
        ACTIVE
        RESERVED
        CLOSED
    }
    class OfferStatus {
        <<enumeration>>
        PENDING
        ACCEPTED
        CANCELLED
    }
    class ParticipantRole {
        <<enumeration>>
        BUYER
        SELLER
        DEALER
    }
    class RiskLevel {
        <<enumeration>>
        SAFE
        CAUTION
        DANGER
    }

    %% --- Relationships ---
    User "1" --> "0..1" DealerProfile : has (role=DEALER)
    User "1" --> "0..*" RealtorApplication : submits
    User "1" --> "0..*" Listing : sells
    User "1" --> "0..*" ListingOffer : proposes (role=DEALER)
    User "1" --> "0..*" ListingBookmark : bookmarks
    User "1" --> "0..*" MarketBookmark : bookmarks
    User "1" --> "0..*" AiAnalysis : requests
    User "1" --> "0..*" Report : reports
    User "1" --> "0..1" SocialAccount : links
    User "1" --> "0..*" ChatParticipant : joins as

    Listing "1" *-- "0..*" ListingImage : composed of
    Listing "1" --> "0..*" ListingOffer : receives
    Listing "1" --> "0..*" ListingBookmark : bookmarked by
    Listing "1" --> "0..*" ChatRoom : opens

    MarketProperty "1" --> "0..*" MarketBookmark : bookmarked by

    ChatRoom "1" *-- "2..3" ChatParticipant : has (구매자/판매자, 수락 시 딜러 추가)
    ChatRoom "1" *-- "0..*" ChatMessage : contains

    Role <.. User
    DealerStatus <.. User
    DealType <.. Listing
    ListingStatus <.. Listing
    OfferStatus <.. ListingOffer
    ParticipantRole <.. ChatParticipant
    RiskLevel <.. AiAnalysis
```

## 비고

- `ChatParticipant`는 `ChatRoom`이 생성될 때 구매자/판매자 2명으로 시작하고, `ListingOffer`가 수락(`accept`)되면 해당 공인중개사가 3번째 `ChatParticipant`(`role=DEALER`)로 추가되는 구조다(`DealerMatchModal.vue` 참고).
- `ListingOffer`는 같은 `(listing, dealer)` 조합에 대해 재제안 시 새 레코드를 만들지 않고 기존 제안을 덮어쓴다(`status` 전환은 `PENDING → ACCEPTED|CANCELLED`).
- `Report.targetType`은 FE 타입에는 명시적으로 노출되어 있지 않지만(현재는 매물 신고만 FE에서 트리거), 기존 `ERD.ts`의 `Reports.target_type ENUM('USER','LISTING')`을 그대로 승계해 표기했다.
