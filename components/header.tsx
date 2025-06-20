"use client"

import Link from "next/link"
import { useState } from "react"
import { GiHamburgerMenu } from "react-icons/gi"
import { IoClose } from "react-icons/io5"
import { DynamicLogo } from "@/components/dynamic-header"

function Header(props: { user?: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto py-4 px-6">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <DynamicLogo fallbackLogo="/logo.PNG" />
            <span className="font-bold text-xl">DeviceHelp</span>
          </Link>

          {/* Mobile Menu Button */}
          <button onClick={toggleMenu} className="md:hidden text-gray-600 focus:outline-none">
            {isMenuOpen ? <IoClose size={24} /> : <GiHamburgerMenu size={24} />}
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-gray-800">
              Home
            </Link>
            <Link href="/about" className="hover:text-gray-800">
              About
            </Link>
            <Link href="/services" className="hover:text-gray-800">
              Services
            </Link>
            <Link href="/contact" className="hover:text-gray-800">
              Contact
            </Link>
          </nav>
        </div>

        {/* Mobile Menu (Hidden by default) */}
        <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
          <nav className="flex flex-col space-y-4 mt-4">
            <Link href="/" className="hover:text-gray-800">
              Home
            </Link>
            <Link href="/about" className="hover:text-gray-800">
              About
            </Link>
            <Link href="/services" className="hover:text-gray-800">
              Services
            </Link>
            <Link href="/contact" className="hover:text-gray-800">
              Contact
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <DynamicLogo fallbackLogo="/logo.PNG" />
              <span className="font-bold text-xl">DeviceHelp</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export { Header }
export default Header
