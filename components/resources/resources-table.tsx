'use client'

import { Resource } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '../ui/button'
import { MoreHorizontal } from 'lucide-react'
import { deleteResource } from '@/lib/resources/actions'
import { toast } from 'sonner'

interface ResourcesTableProps {
  resources: Resource[]
}

type MetaType = {
  removeRow: (rowIndex: number) => void
}

export const columns: ColumnDef<Resource>[] = [
  {
    accessorKey: 'title',
    header: '📚 Title'
  },
  {
    accessorKey: 'content',
    header: '📄 Content',
    cell: ({ row }) => {
      const content = row.original.content
      return content.length > 50 ? `${content.substring(0, 50)}...` : content
    }
  },
  {
    accessorKey: 'createdAt',
    header: '📅 Created At'
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as MetaType
      const resource = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => console.log(resource.content)}>
              Copy content
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await deleteResource(resource.id)
                meta.removeRow(row.index)
                toast.success('Resource deleted successfully.')
              }}
            >
              🗑️ Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export const ResourcesTable = ({ resources }: ResourcesTableProps) => {
  return (
    <div className="-mt-2 flex w-full flex-col gap-2 py-4">
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Your Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={resources} />
        </CardContent>
      </Card>
    </div>
  )
}
