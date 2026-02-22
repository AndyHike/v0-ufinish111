'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { TableOfContentsItem } from '@/lib/content-formatter'

interface TableOfContentsProps {
  items: TableOfContentsItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Слідкуємо за активним заголовком при скролі
    const handleScroll = () => {
      const headings = items.map(item => document.getElementById(item.id))
      
      for (const heading of headings) {
        if (!heading) continue
        
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom >= 100) {
          setActiveId(heading.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  if (items.length === 0) return null

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="my-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Зміст статті</h2>
      <nav className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`
              block w-full text-left px-3 py-2 rounded transition-all duration-200
              ${activeId === item.id 
                ? 'bg-blue-500 text-white font-medium' 
                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-900'
              }
              ${item.level === 1 ? 'ml-0' : item.level === 2 ? 'ml-4' : 'ml-8'}
            `}
            style={{
              fontSize: item.level === 1 ? '1rem' : item.level === 2 ? '0.95rem' : '0.9rem',
            }}
          >
            {item.title}
          </button>
        ))}
      </nav>
    </motion.div>
  )
}
