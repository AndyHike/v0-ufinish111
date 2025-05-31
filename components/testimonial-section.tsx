"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function TestimonialSection() {
  const t = useTranslations()
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: "Олександр П.",
      rating: 5,
      text: "Дуже задоволений якістю ремонту. Швидко, професійно і за розумною ціною! Рекомендую всім, хто цінує свій час і якість.",
    },
    {
      name: "Марія К.",
      rating: 5,
      text: "Зламався екран на iPhone, звернулася сюди і не пошкодувала. Ремонт зробили за годину, ціна відповідає якості.",
    },
    {
      name: "Іван С.",
      rating: 4,
      text: "Хороший сервіс, приємний персонал. Єдиний мінус - довелося трохи почекати, але результат того вартий.",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [testimonials.length])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-10 bg-gray-50">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Відгуки наших клієнтів</h2>

        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4">
                  {testimonials[currentIndex].name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{testimonials[currentIndex].name}</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < testimonials[currentIndex].rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700">{testimonials[currentIndex].text}</p>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-md"
            aria-label="Попередній відгук"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-md"
            aria-label="Наступний відгук"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentIndex ? "bg-primary w-4" : "bg-gray-300",
                )}
                aria-label={`Перейти до відгуку ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
