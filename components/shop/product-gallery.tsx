import Image from "next/image"

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const displayImages = images.length > 0 ? images : ["/tech-fix-storefront.png"]

  return (
    <div className="grid gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <Image src={displayImages[0]} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
      </div>
      {displayImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {displayImages.slice(1, 5).map((image) => (
            <div key={image} className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              <Image src={image} alt={title} fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
