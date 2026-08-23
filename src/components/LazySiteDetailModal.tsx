import { lazy } from 'react'

// Shared code-split reference — pulls in Leaflet (~150kB) and the multi-model
// fetch/scoring code, only worth loading once someone actually opens a site's
// detail view. Both SiteCard (today, from a site card) and the pinned-sites
// dashboard (any of the next 7 days, from a grid cell) import this same
// lazy() wrapper rather than each declaring their own, so it's one chunk.
export const LazySiteDetailModal = lazy(() => import('./SiteDetailModal').then((m) => ({ default: m.SiteDetailModal })))
