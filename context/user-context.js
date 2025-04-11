"use client"

import { createContext, useContext, useState, useEffect } from "react"

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading user data
  useEffect(() => {
    const loadUser = async () => {
      // In a real app, this would be an API call to get the user data
      // For now, we'll simulate a logged in user

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if we have a saved user in localStorage
      const savedUser = localStorage.getItem("user")

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error("Error parsing user from localStorage:", error)
          setUser(null)
        }
      } else {
        // Default demo user
        const demoUser = {
          id: "1",
          name: "Demo User",
          email: "demo@example.com",
          preferences: {
            theme: "light",
            notifications: true,
          },
          orderHistory: [
            { id: "ORD-1001", date: "2023-04-15", total: 129.99, status: "Delivered" },
            { id: "ORD-982", date: "2023-03-02", total: 79.95, status: "Delivered" },
          ],
          wishlist: [2, 7, 11],
        }

        setUser(demoUser)
        localStorage.setItem("user", JSON.stringify(demoUser))
      }

      setIsLoading(false)
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    // In a real app, this would be an API call to authenticate the user
    setIsLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Demo login - in a real app, this would validate credentials
    const demoUser = {
      id: "1",
      name: "Demo User",
      email: email,
      preferences: {
        theme: "light",
        notifications: true,
      },
      orderHistory: [
        { id: "ORD-1001", date: "2023-04-15", total: 129.99, status: "Delivered" },
        { id: "ORD-982", date: "2023-03-02", total: 79.95, status: "Delivered" },
      ],
      wishlist: [2, 7, 11],
    }

    setUser(demoUser)
    localStorage.setItem("user", JSON.stringify(demoUser))
    setIsLoading(false)

    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const updatePreferences = (preferences) => {
    if (!user) return

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences,
      },
    }

    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const addToWishlist = (productId) => {
    if (!user) return

    if (!user.wishlist.includes(productId)) {
      const updatedUser = {
        ...user,
        wishlist: [...user.wishlist, productId],
      }

      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const removeFromWishlist = (productId) => {
    if (!user) return

    const updatedUser = {
      ...user,
      wishlist: user.wishlist.filter((id) => id !== productId),
    }

    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updatePreferences,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
