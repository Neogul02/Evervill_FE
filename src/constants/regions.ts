export type RegionFilter = {
  label: string
  regions?: string[]
}

export const REGION_FILTERS: RegionFilter[] = [
  { label: '전체', regions: undefined },
  { label: '서울', regions: ['서울'] },
  { label: '수도권', regions: ['서울', '경기', '인천'] },
  { label: '강원', regions: ['강원'] },
  { label: '충청', regions: ['충청'] },
  { label: '전라', regions: ['전라'] },
  { label: '경상', regions: ['경상'] },
  { label: '부울경', regions: ['부산', '대구', '울산'] },
  { label: '제주', regions: ['제주'] },
]
