import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"

export default function ContactMessagesLoading() {
  return (
    <div className="space-y-6">
      <PageHeader heading="Contact Form Messages" text="View and manage messages received through the contact form" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  )
}
