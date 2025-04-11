"use client"

import { useState } from "react"
import { ShoppingCart, Search, Mic, X, Menu, User, Heart } from "lucide-react"
import { useShoppingCart } from "@/context/cart-context"
import Link from "next/link"

export default function Header({ onSearch, searchQuery, toggleAssistant, isAssistantActive, toggleSidebar }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { getCartCount } = useShoppingCart()

  return (
    <header className="bg-teal-600 text-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-teal-700 transition-colors md:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="text-2xl font-bold">
              ShopSmart
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-teal-200 transition-colors">
                Home
              </Link>
              <Link href="/categories" className="hover:text-teal-200 transition-colors">
                Categories
              </Link>
              <Link href="/deals" className="hover:text-teal-200 transition-colors">
                Deals
              </Link>
              <Link href="/orders" className="hover:text-teal-200 transition-colors">
                Orders
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isSearchOpen ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 rounded-full text-gray-800 w-full md:w-80"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                />
                <Search className="absolute left-3 text-gray-500" size={18} />
                <button onClick={() => setIsSearchOpen(false)} className="ml-2 text-white">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full hover:bg-teal-700 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            )}

            <button
              onClick={toggleAssistant}
              className={`p-2 rounded-full transition-colors ${isAssistantActive ? "bg-teal-800" : "hover:bg-teal-700"}`}
              aria-label="Voice Assistant"
            >
              <Mic size={20} />
            </button>

            <Link href="/wishlist" className="p-2 rounded-full hover:bg-teal-700 transition-colors relative">
              <Heart size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </Link>

            <Link href="/cart" className="p-2 rounded-full hover:bg-teal-700 transition-colors relative">
              <ShoppingCart size={20} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            <Link href="/account" className="p-2 rounded-full hover:bg-teal-700 transition-colors">
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
