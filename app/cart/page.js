"use client"

import { useState } from "react"
import { useShoppingCart } from "@/context/cart-context"
import { Minus, Plus, Trash2, ArrowLeft, CreditCard } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAssistant } from "@/context/assistant-context"
import Header from "@/components/header"
import VoiceAssistant from "@/components/voice-assistant"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useShoppingCart()
  const { speak } = useAssistant()
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [isAssistantActive, setIsAssistantActive] = useState(false)
  const router = useRouter()

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "welcome10") {
      setDiscount(getCartTotal() * 0.1)
      setPromoApplied(true)
      speak("Promo code applied successfully. You got 10% off your order.")
    } else {
      speak("Sorry, that promo code is invalid.")
    }
  }

  const handleRemoveItem = (itemId, itemName) => {
    removeFromCart(itemId)
    speak(`Removed ${itemName} from your cart.`)
  }

  const handleUpdateQuantity = (itemId, newQuantity, itemName) => {
    updateQuantity(itemId, newQuantity)
    speak(`Updated ${itemName} quantity to ${newQuantity}.`)
  }

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Cart</h1>
            <Link href="/" className="flex items-center text-teal-600 hover:text-teal-700">
              <ArrowLeft size={16} className="mr-1" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
              <Link
                href="/"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold">
                      Cart Items ({cart.reduce((total, item) => total + item.quantity, 0)})
                    </h2>
                  </div>

                  <ul className="divide-y">
                    {cart.map((item) => (
                      <li key={item.id} className="p-4">
                        <div className="flex items-center">
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>

                          <div className="ml-4 flex-grow">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="font-medium">
                                $
                                {(
                                  (item.discount ? item.price * (1 - item.discount / 100) : item.price) * item.quantity
                                ).toFixed(2)}
                              </p>
                            </div>

                            <p className="text-sm text-gray-500">{item.category}</p>

                            {item.discount > 0 && <p className="text-sm text-red-500">{item.discount}% OFF</p>}

                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center border rounded-md">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.name)}
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="px-2 py-1">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.name)}
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveItem(item.id, item.name)}
                                className="text-red-500 hover:text-red-700"
                                aria-label="Remove item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="p-4 border-t">
                    <button
                      onClick={() => {
                        clearCart()
                        speak("Your cart has been cleared.")
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="font-semibold mb-4">Order Summary</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>$5.99</span>
                    </div>

                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${(getCartTotal() + 5.99 - discount).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Including VAT</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-4">
                      <label htmlFor="promo" className="block text-sm font-medium text-gray-700 mb-1">
                        Promo Code
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          id="promo"
                          className="flex-grow border rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="bg-gray-200 text-gray-800 px-3 py-2 rounded-r-md hover:bg-gray-300 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {promoApplied && <p className="text-xs text-green-600 mt-1">Promo code applied successfully!</p>}
                    </div>

                    <Link
                      href="/checkout"
                      className="block w-full bg-teal-600 text-white text-center py-3 rounded-md hover:bg-teal-700 transition-colors"
                    >
                      <div className="flex items-center justify-center">
                        <CreditCard size={18} className="mr-2" />
                        <span>Proceed to Checkout</span>
                      </div>
                    </Link>

                    <div className="mt-4 text-xs text-gray-500 text-center">
                      <p>We accept Credit Card, PayPal, and Apple Pay</p>
                      <p className="mt-1">Secure payment processing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
