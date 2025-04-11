"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react"
import { useShoppingCart } from "@/context/cart-context"
import Image from "next/image"
import Link from "next/link"
import { useAssistant } from "@/context/assistant-context"

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false)
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartCount } = useShoppingCart()
  const { speak } = useAssistant()

  const handleRemoveItem = (itemId, itemName) => {
    removeFromCart(itemId)
    speak(`Removed ${itemName} from your cart.`)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-20 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition-colors"
        aria-label="Open cart"
      >
        <ShoppingBag size={24} />
        {getCartCount() > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {getCartCount()}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}></div>

      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Cart</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8">
            <div className="text-gray-400 mb-4">
              <ShoppingBag size={64} />
            </div>
            <p className="text-gray-500 text-center mb-4">Your cart is empty</p>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4">
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li key={item.id} className="flex border-b pb-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div className="ml-4 flex-grow">
                      <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        ${item.discount ? (item.price * (1 - item.discount / 100)).toFixed(2) : item.price.toFixed(2)}
                      </p>

                      <div className="mt-2 flex items-center">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="mx-2 w-6 text-center">{item.quantity}</span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="ml-auto p-1 rounded-full text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t p-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">$5.99</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${(getCartTotal() + 5.99).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    clearCart()
                    speak("Your cart has been cleared.")
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Cart
                </button>
                <Link
                  href="/checkout"
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors text-center"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
