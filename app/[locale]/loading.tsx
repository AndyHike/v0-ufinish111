export default function Loading() {
  return (
    <div className="flex-1">
      {/* Hero skeleton */}
      <div className="hero-section">
        <div className="container">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <div className="h-12 w-3/4 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-6 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="h-6 w-5/6 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-200" />
            </div>
            <div className="h-[250px] w-full animate-pulse rounded-xl bg-gray-200 md:h-[300px] lg:h-[350px]" />
          </div>
        </div>
      </div>

      {/* Brands skeleton */}
      <div className="container py-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  )
}
