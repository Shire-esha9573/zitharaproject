"use client"

import { useState } from "react"
import { useUser } from "@/context/user-context"
import { Package, ChevronDown, ChevronUp, Search } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import VoiceAssistant from "@/components/voice-assistant"

export default function OrdersPage() {
  const { user, isLoading } = useUser()
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAssistantActive, setIsAssistantActive] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  // Sample order data - in a real app, this would come from an API
  const orders = [
    {
      id: "ORD-1001",
      date: "2023-04-15",
      total: 129.99,
      status: "Delivered",
      items: [{ id: 3, name: "Smart Fitness Watch", price: 129.99, quantity: 1 }],
      shippingAddress: "123 Main St, Anytown, CA 12345",
      trackingNumber: "TRK-987654321",
    },
    {
      id: "ORD-982",
      date: "2023-03-02",
      total: 79.95,
      status: "Delivered",
      items: [
        { id: 4, name: "Organic Cotton T-Shirt", price: 24.99, quantity: 2 },
        { id: 9, name: "Stainless Steel Water Bottle", price: 29.99, quantity: 1 },
      ],
      shippingAddress: "123 Main St, Anytown, CA 12345",
      trackingNumber: "TRK-123456789",
    },
  ]

  const filteredOrders = searchQuery
    ? orders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : orders

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Your Orders</h1>

          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Search orders by ID or product name..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>

          {!user ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h1>
              <p className="text-gray-600 mb-6">Please sign in to view your order history.</p>
              <Link
                href="/login"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">No orders found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div
                    className="p-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-center">
                      <Package className="text-teal-600 mr-3" size={24} />
                      <div>
                        <h3 className="font-medium">{order.id}</h3>
                        <p className="text-sm text-gray-500">Placed on {new Date(order.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p
                          className={`text-sm ${
                            order.status === "Delivered"
                              ? "text-green-600"
                              : order.status === "Shipped"
                                ? "text-blue-600"
                                : "text-orange-600"
                          }`}
                        >
                          {order.status}
                        </p>
                      </div>
                      {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-medium mb-2">Order Details</h4>

                      <div className="space-y-3 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <p>${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-3 mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-1">Shipping Address</h5>
                            <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-1">Tracking Number</h5>
                            <p className="text-sm text-gray-600">{order.trackingNumber}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end space-x-2">
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                          Track Package
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                          Return Items
                        </button>
                        <button className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">
                          Buy Again
                        </button>
                      </div>
                    </div>
                  )}
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
