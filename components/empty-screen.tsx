import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to Agentia </h1>
        <p className="leading-normal text-muted-foreground">
          Built by{' '}
          <ExternalLink href="https://nicode.solutions">
            nicode.solutions
          </ExternalLink>
        </p>
      </div>
    </div>
  )
}
