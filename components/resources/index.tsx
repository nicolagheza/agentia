'use client'

import dynamic from 'next/dynamic'
import { ResourcesTableSkeleton } from './resources-table-skeleton'

const ResourcesTable = dynamic(
  () => import('./resources-table').then(mod => mod.ResourcesTable),
  {
    ssr: false,
    loading: () => <ResourcesTableSkeleton />
  }
)

export { ResourcesTable }
