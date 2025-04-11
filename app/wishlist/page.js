"use client"

import { useState } from "react"
import { useUser } from "@/context/user-context"
import { useShoppingCart } from "@/context/cart-context"
import { Heart, Trash2, ShoppingCart, Search } from "lucide-react"
import { products } from "@/lib/product-data"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import VoiceAssistant from "@/components/voice-assistant"

export default function WishlistPage() {
  const { user, isLoading, removeFromWishlist } = useUser()
  const { addToCart } = useShoppingCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAssistantActive, setIsAssistantActive] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  // Get wishlist items from products
  const wishlistItems = user ? products.filter((product) => user.wishlist.includes(product.id)) : []

  // Filter by search query if present
  const filteredItems = searchQuery
    ? wishlistItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : wishlistItems

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header
        onSearch={() => {}}
        searchQuery=""
        toggleAssistant={() => setIsAssistantActive(!isAssistantActive)}
        isAssistantActive={isAssistantActive}
        toggleSidebar={() => {}}
      />

      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Wishlist</h1>
            <span className="text-gray-500">{wishlistItems.length} items</span>
          </div>

          {!user ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h1>
              <p className="text-gray-600 mb-6">Please sign in to view your wishlist.</p>
              <Link
                href="/login"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            wishlistItems.length > 0 && (
              <div className="mb-6 relative">
                <input
                  type="text"
                  placeholder="Search your wishlist..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              </div>
            )
          )}

          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Heart className="mx-auto text-gray-300 mb-4" size={64} />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">
                Save items you're interested in by clicking the heart icon on any product.
              </p>
              <Link
                href="/"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">No items found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>

                  <div className="p-4">
                    <Link href={`/product/${item.id}`} className="hover:text-teal-600">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    </Link>

                    <p className="text-gray-500 text-sm mb-2">{item.category}</p>

                    <div className="flex justify-between items-center mb-4">
                      {item.discount ? (
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-teal-600">
                            ${(item.price * (1 - item.discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through ml-2">${item.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-teal-600">${item.price.toFixed(2)}</span>
                      )}

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-teal-600 text-white py-2 rounded-md flex items-center justify-center space-x-2 hover:bg-teal-700 transition-colors"
                    >
                      <ShoppingCart size={18} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAssistantActive && (
        <VoiceAssistant
          isActive={isAssistantActive}
          onNavigate={(path) => (window.location.href = path)}
          onSearch={() => {}}
          onCategoryChange={() => {}}
        />
      )}
    </div>
  )
}
