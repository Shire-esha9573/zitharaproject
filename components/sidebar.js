"use client"

import { X, Home, Package, CreditCard, Heart, User, ShoppingBag, Tag, Gift } from "lucide-react"
import Link from "next/link"

export default function Sidebar({ isOpen, onClose, onCategorySelect, currentCategory, onNavigate }) {
  const categories = ["All", "Electronics", "Clothing", "Kitchen", "Accessories", "Footwear", "Home"]

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Categories", icon: Package, path: "/categories" },
    { name: "Orders", icon: ShoppingBag, path: "/orders" },
    { name: "Wishlist", icon: Heart, path: "/wishlist" },
    { name: "Deals", icon: Tag, path: "/deals" },
    { name: "Gift Cards", icon: Gift, path: "/gift-cards" },
    { name: "Payment Methods", icon: CreditCard, path: "/payment-methods" },
    { name: "Account", icon: User, path: "/account" },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClose}></div>}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:w-64 md:z-0
      `}
      >
        <div className="p-4 border-b flex justify-between items-center md:hidden">
          <h2 className="font-semibold text-lg">Menu</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-800 mb-2">Categories</h3>
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    currentCategory === category ? "bg-teal-100 text-teal-800" : "hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    onCategorySelect(category)
                    if (window.innerWidth < 768) onClose()
                  }}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t">
          <h3 className="font-medium text-gray-800 mb-2">Menu</h3>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (window.innerWidth < 768) onClose()
                  }}
                >
                  <item.icon size={18} className="mr-3 text-gray-500" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
