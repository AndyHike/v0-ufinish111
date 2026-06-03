"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

const ContactSection = dynamic(
  () => import("@/components/contact-section").then((mod) => mod.ContactSection),
  {
    ssr: false,
    loading: () => <ContactSectionPlaceholder />,
  },
)

function ContactSectionPlaceholder() {
  return <section className="py-12 md:py-20 bg-white" aria-hidden="true" />
}

export function LazyContactSection() {
  const [shouldLoad, setShouldLoad] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldLoad) return

    const root = rootRef.current
    if (!root) return

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: "700px 0px" },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [shouldLoad])

  return <div ref={rootRef}>{shouldLoad ? <ContactSection /> : <ContactSectionPlaceholder />}</div>
}
