"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { products } from "@/lib/product-data"
import { ShoppingCart, Heart, ArrowLeft, Star, ChevronDown, ChevronUp, Check } from "lucide-react"
import Image from "next/image"
import { useShoppingCart } from "@/context/cart-context"
import { useUser } from "@/context/user-context"
import { useAssistant } from "@/context/assistant-context"
import Header from "@/components/header"
import VoiceAssistant from "@/components/voice-assistant"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useShoppingCart()
  const { user, addToWishlist, removeFromWishlist } = useUser()
  const { speak } = useAssistant()
  const [isAssistantActive, setIsAssistantActive] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")
  const [isSpecsOpen, setIsSpecsOpen] = useState(false)
  const [isShippingOpen, setIsShippingOpen] = useState(false)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  // Find the product based on the ID from the URL
  const product = products.find((p) => p.id === Number(params.id))

  // Check if product is in wishlist
  const isInWishlist = user?.wishlist?.includes(product?.id)

  // Handle adding to cart
  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, quantity })
      speak(`Added ${quantity} ${product.name} to your cart.`)
    }
  }

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (!product) return

    if (isInWishlist) {
      removeFromWishlist(product.id)
      speak(`Removed ${product.name} from your wishlist.`)
    } else {
      addToWishlist(product.id)
      speak(`Added ${product.name} to your wishlist.`)
    }
  }

  // If product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header
          onSearch={() => {}}
          searchQuery=""
          toggleAssistant={() => setIsAssistantActive(!isAssistantActive)}
          isAssistantActive={isAssistantActive}
          toggleSidebar={() => {}}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate the discounted price if applicable
  const price = product.discount ? product.price * (1 - product.discount / 100) : product.price

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header
        onSearch={() => {}}
        searchQuery=""
        toggleAssistant={() => setIsAssistantActive(!isAssistantActive)}
        isAssistantActive={isAssistantActive}
        toggleSidebar={() => {}}
      />

      <div className="container mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center text-teal-600 hover:text-teal-700 mb-6">
          <ArrowLeft size={16} className="mr-1" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="relative h-80 md:h-96 rounded-lg overflow-hidden">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                  {product.discount}% OFF
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>

              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                      stroke={i < Math.floor(product.rating) ? "currentColor" : "currentColor"}
                    />
                  ))}
                </div>
                <span className="text-gray-500 text-sm">({product.reviews} reviews)</span>
              </div>

              <div className="mb-4">
                {product.discount ? (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-teal-600">${price.toFixed(2)}</span>
                    <span className="text-lg text-gray-500 line-through ml-2">${product.price.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-teal-600">${price.toFixed(2)}</span>
                )}
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <span className="text-gray-700 mr-4">Quantity:</span>
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  {product.stock > 0 ? (
                    <div className="flex items-center">
                      <Check size={16} className="text-green-500 mr-1" />
                      <span>{product.stock} in stock</span>
                    </div>
                  ) : (
                    <span className="text-red-500">Out of stock</span>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-teal-600 text-white py-3 rounded-md flex items-center justify-center space-x-2 hover:bg-teal-700 transition-colors"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 rounded-md border flex items-center justify-center ${
                    isInWishlist
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                  aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t">
            <div className="flex border-b">
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "description"
                    ? "border-b-2 border-teal-600 text-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("description")}
              >
                Description
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "specifications"
                    ? "border-b-2 border-teal-600 text-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("specifications")}
              >
                Specifications
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "reviews"
                    ? "border-b-2 border-teal-600 text-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews
              </button>
            </div>

            <div className="p-6">
              {activeTab === "description" && (
                <div>
                  <p className="text-gray-600">{product.description}</p>

                  <div className="mt-4">
                    <button
                      className="flex items-center justify-between w-full py-3 text-left border-b"
                      onClick={() => setIsShippingOpen(!isShippingOpen)}
                    >
                      <span className="font-medium">Shipping Information</span>
                      {isShippingOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isShippingOpen && (
                      <div className="py-3 text-gray-600">
                        <p>Free standard shipping on all orders over $50.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Standard shipping: 3-5 business days</li>
                          <li>Express shipping: 1-2 business days (additional fee)</li>
                          <li>Free returns within 30 days</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <h3 className="font-medium mb-2">Product Details</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span>{product.category}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Stock:</span>
                          <span>{product.stock} units</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span>{product.rating}/5</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                      <h3 className="font-medium mb-2">Technical Specifications</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Material:</span>
                          <span>Premium Quality</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span>Varies by product</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Weight:</span>
                          <span>Varies by product</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                          stroke={i < Math.floor(product.rating) ? "currentColor" : "currentColor"}
                        />
                      ))}
                    </div>
                    <span className="text-gray-700 font-medium">{product.rating} out of 5</span>
                    <span className="text-gray-500 ml-2">({product.reviews} reviews)</span>
                  </div>

                  {/* Sample reviews */}
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < 5 ? "currentColor" : "none"}
                              stroke={i < 5 ? "currentColor" : "currentColor"}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">John D.</span>
                        <span className="text-xs text-gray-500 ml-2">2 weeks ago</span>
                      </div>
                      <p className="text-gray-600">Great product! Exactly as described and arrived quickly.</p>
                    </div>

                    <div className="border-b pb-4">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < 4 ? "currentColor" : "none"}
                              stroke={i < 4 ? "currentColor" : "currentColor"}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">Sarah M.</span>
                        <span className="text-xs text-gray-500 ml-2">1 month ago</span>
                      </div>
                      <p className="text-gray-600">Very happy with my purchase. Would recommend to others.</p>
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < 5 ? "currentColor" : "none"}
                              stroke={i < 5 ? "currentColor" : "currentColor"}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">Michael T.</span>
                        <span className="text-xs text-gray-500 ml-2">3 months ago</span>
                      </div>
                      <p className="text-gray-600">Excellent quality and value for money. Will buy again!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter((p) => p.category === product.category && p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct) => (
                <div key={relatedProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={relatedProduct.image || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    {relatedProduct.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {relatedProduct.discount}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">{relatedProduct.name}</h3>

                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400 mr-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.floor(relatedProduct.rating) ? "currentColor" : "none"}
                            stroke={i < Math.floor(relatedProduct.rating) ? "currentColor" : "currentColor"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({relatedProduct.reviews})</span>
                    </div>

                    <div className="flex justify-between items-center">
                      {relatedProduct.discount ? (
                        <div className="flex items-center">
                          <span className="font-bold text-teal-600">
                            ${(relatedProduct.price * (1 - relatedProduct.discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 line-through ml-1">
                            ${relatedProduct.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-teal-600">${relatedProduct.price.toFixed(2)}</span>
                      )}

                      <button
                        onClick={() => router.push(`/product/${relatedProduct.id}`)}
                        className="text-teal-600 hover:text-teal-700 text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {isAssistantActive && (
        <VoiceAssistant
          isActive={isAssistantActive}
          onNavigate={(path) => router.push(path)}
          onSearch={() => {}}
          onCategoryChange={() => {}}
        />
      )}
    </div>
  )
}
