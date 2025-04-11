"use client"

import { useState } from "react"
import { products } from "@/lib/product-data"
import ProductList from "@/components/product-list"
import { Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useAssistant } from "@/context/assistant-context"
import Header from "@/components/header"
import VoiceAssistant from "@/components/voice-assistant"

export default function CategoriesPage() {
  const [currentCategory, setCurrentCategory] = useState("All")
  const [priceRange, setPriceRange] = useState([0, 200])
  const [sortBy, setSortBy] = useState("featured")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isAssistantActive, setIsAssistantActive] = useState(false)
  const { speak } = useAssistant()

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))]

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (currentCategory !== "All" && product.category !== currentCategory) {
      return false
    }

    // Price range filter
    const price = product.discount ? product.price * (1 - product.discount / 100) : product.price

    if (price < priceRange[0] || price > priceRange[1]) {
      return false
    }

    return true
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discount ? a.price * (1 - a.discount / 100) : a.price
    const priceB = b.discount ? b.price * (1 - b.discount / 100) : b.price

    switch (sortBy) {
      case "price-low-high":
        return priceA - priceB
      case "price-high-low":
        return priceB - priceA
      case "rating":
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0 // featured
    }
  })

  const handleCategoryChange = (category) => {
    setCurrentCategory(category)
    speak(`Showing ${category} products.`)
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Browse Categories</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm ${
                  currentCategory === category ? "bg-teal-600 text-white" : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {currentCategory === "All" ? "All Products" : currentCategory}
              <span className="text-gray-500 text-sm ml-2">({sortedProducts.length} items)</span>
            </h2>

            <div className="flex items-center space-x-2">
              <button
                className="md:hidden flex items-center space-x-1 px-3 py-2 bg-white rounded-md shadow-sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <Filter size={16} />
                <span>Filters</span>
                {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <select
                className="px-3 py-2 bg-white rounded-md shadow-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`md:block ${filtersOpen ? "block" : "hidden"}`}>
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold mb-4">Filters</h3>

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Price Range</h4>
                  <div className="flex items-center space-x-2">
                    <span>${priceRange[0]}</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                      className="flex-grow"
                    />
                    <span>${priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                    className="w-full mt-2"
                  />
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Categories</h4>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center">
                        <input
                          type="radio"
                          id={`category-${category}`}
                          name="category"
                          checked={currentCategory === category}
                          onChange={() => setCurrentCategory(category)}
                          className="mr-2"
                        />
                        <label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setCurrentCategory("All")
                    setPriceRange([0, 200])
                    setSortBy("featured")
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              {sortedProducts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600 mb-4">No products match your current filters.</p>
                  <button
                    className="text-teal-600 hover:underline"
                    onClick={() => {
                      setCurrentCategory("All")
                      setPriceRange([0, 200])
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <ProductList products={sortedProducts} />
              )}
            </div>
          </div>
        </div>
      </div>

      {isAssistantActive && (
        <VoiceAssistant
          isActive={isAssistantActive}
          onNavigate={(path) => (window.location.href = path)}
          onSearch={() => {}}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </div>
  )
}
