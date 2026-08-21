import type { Status, Reason } from './scoring'

export interface Site {
  slug: string
  name: string
  grid_ref: string | null
  lat: number | null
  lon: number | null
  wind_dir_min: number | null
  wind_dir_max: number | null
  wind_speed_min_mph: number | null
  wind_speed_max_mph: number | null
  members_only: boolean
  hg_rating: string | null
  pg_rating: string | null
  liaison: string | null
  notes: string
  source_url: string | null
  missing_wind_dir: boolean
  owner_id: string | null
  is_custom: boolean
}

export interface HourlyCondition {
  time: string
  status: Status
  reason: Reason
  wind_speed_mph: number
  wind_gust_mph: number
  wind_direction_deg: number
  precipitation_probability_percent: number
}

export interface DailyCondition {
  date: string // YYYY-MM-DD
  status: Status
  hours: HourlyCondition[]
}

export interface SiteConditions {
  slug: string
  updated_at: string
  now: HourlyCondition | null
  daily: DailyCondition[]
}

export interface ConditionsCache {
  generated_at: string
  sites: Record<string, SiteConditions>
}
