import Image from "next/image"

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const displayImages = images.length > 0 ? images : ["/tech-fix-storefront.png"]

  return (
    // Fills the column height so the gallery and the info panel form one equal
    // block on desktop. Main image uses object-contain (no crop) and grows with
    // flex-1; thumbnails keep a fixed size at the bottom.
    <div className="flex flex-col gap-3">
      {/* Square on small screens (scales with width), fixed height on desktop so
          the gallery has a clean, predictable size regardless of the info column. */}
      <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 lg:aspect-auto lg:h-[460px]">
        <Image
          src={displayImages[0]}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 460px"
          className="object-cover"
        />
      </div>
      {displayImages.length > 1 ? (
        <div className="grid shrink-0 grid-cols-4 gap-3">
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
