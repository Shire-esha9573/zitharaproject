"use client"

import { useState, useEffect } from "react"
import ProductList from "@/components/product-list"
import VoiceAssistant from "@/components/voice-assistant"
import Header from "@/components/header"
import { products } from "@/lib/product-data"
import Sidebar from "@/components/sidebar"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAssistantActive, setIsAssistantActive] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentCategory, setCurrentCategory] = useState("All")
  const router = useRouter()

  // Check if this is the first visit to show assistant automatically
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited")
    if (!hasVisited) {
      setIsAssistantActive(true)
      localStorage.setItem("hasVisited", "true")
    }
  }, [])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query) {
      setFilteredProducts(
        currentCategory === "All" ? products : products.filter((product) => product.category === currentCategory),
      )
      return
    }

    const filtered = products.filter(
      (product) =>
        (currentCategory === "All" || product.category === currentCategory) &&
        (product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())),
    )

    setFilteredProducts(filtered)
  }

  const handleCategoryChange = (category) => {
    setCurrentCategory(category)
    if (category === "All") {
      setFilteredProducts(
        searchQuery
          ? products.filter(
              (p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase()),
            )
          : products,
      )
    } else {
      setFilteredProducts(
        products.filter(
          (product) =>
            product.category === category &&
            (searchQuery
              ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase())
              : true),
        ),
      )
    }
  }

  const handleNavigate = (path) => {
    console.log("Navigating to:", path)
    router.push(path)

    // Close the sidebar if it's open (on mobile)
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header
        onSearch={handleSearch}
        searchQuery={searchQuery}
        toggleAssistant={() => setIsAssistantActive(!isAssistantActive)}
        isAssistantActive={isAssistantActive}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCategorySelect={handleCategoryChange}
          currentCategory={currentCategory}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              {currentCategory === "All" ? "Featured Products" : currentCategory}
            </h1>

            <div className="flex space-x-2">
              <select
                className="border rounded-md px-3 py-2 text-sm"
                onChange={(e) => handleCategoryChange(e.target.value)}
                value={currentCategory}
              >
                <option value="All">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Accessories">Accessories</option>
                <option value="Footwear">Footwear</option>
                <option value="Home">Home</option>
              </select>

              <select className="border rounded-md px-3 py-2 text-sm">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">No products found matching your criteria.</p>
              <button
                className="mt-4 text-teal-600 hover:underline"
                onClick={() => {
                  setSearchQuery("")
                  setCurrentCategory("All")
                  setFilteredProducts(products)
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ProductList products={filteredProducts} />
          )}
        </main>
      </div>

      {isAssistantActive && (
        <VoiceAssistant
          isActive={isAssistantActive}
          onNavigate={handleNavigate}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </div>
  )
}
