"use client"

import Image from "next/image"
import { ShoppingCart, Heart } from "lucide-react"
import { useState } from "react"
import { useShoppingCart } from "@/context/cart-context"
import Link from "next/link"
import { useAssistant } from "@/context/assistant-context"
import { useUser } from "@/context/user-context"

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useShoppingCart()
  const { speak } = useAssistant()
  const { user, addToWishlist, removeFromWishlist } = useUser()

  const isInWishlist = user?.wishlist?.includes(product.id)

  const handleAddToCart = (e) => {
    e.preventDefault() // Prevent navigation when clicking the add to cart button
    e.stopPropagation() // Stop event propagation
    addToCart(product)
    speak(`Added ${product.name} to your cart.`)
  }

  const handleWishlistToggle = (e) => {
    e.preventDefault() // Prevent navigation when clicking the wishlist button
    e.stopPropagation() // Stop event propagation
    if (isInWishlist) {
      removeFromWishlist(product.id)
      speak(`Removed ${product.name} from your wishlist.`)
    } else {
      addToWishlist(product.id)
      speak(`Added ${product.name} to your wishlist.`)
    }
  }

  return (
    <Link href={`/product/${product.id}`} className="block">
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
          />

          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {product.discount}% OFF
            </div>
          )}

          <button
            className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-md transition-colors ${
              isInWishlist ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:bg-gray-100 hover:text-red-500"
            }`}
            onClick={handleWishlistToggle}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} fill={isInWishlist ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
          </div>

          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(product.rating || 0) ? "text-yellow-400" : "text-gray-300"}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({product.reviews || 0} reviews)</span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

          <div className="flex justify-between items-center">
            <div>
              {product.discount ? (
                <div className="flex items-center">
                  <span className="text-lg font-bold text-teal-600">
                    ${(product.price * (1 - product.discount / 100)).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 line-through ml-2">${product.price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-lg font-bold text-teal-600">${product.price.toFixed(2)}</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
