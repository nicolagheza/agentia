import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export const ResourcesTableSkeleton = () => {
  return (
    <div className="-mt-2 flex w-full flex-col gap-2 py-4">
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Your Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📄 Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📅 Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-zinc-700 rounded-md w-3/4"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-zinc-700 rounded-md w-1/2"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-zinc-700 rounded-md w-1/4"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
