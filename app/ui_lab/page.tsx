import { ResourcesTable } from '@/components/resources/resources-table'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'

const placeholderResources = [
  {
    id: 'c1VSI8M',
    content:
      'As a passionate Software Engineer, I thrive on crafting and maintaining innovative software and web applications that make a difference. With a solid foundation in backend development, machine learning, frontend technologies, and mobile applications, I enjoy tackling diverse challenges and exploring new ideas.',
    userId: '052e6c16-78ef-45dc-831c-5c230b429ed4',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default async function UILab() {
  return (
    <>
      <h1>UI Lab</h1>
      <EventsSkeleton />

      <ResourcesTable resources={placeholderResources} />
    </>
  )
}
