"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Send, Bot, Volume2, VolumeX } from "lucide-react"
import { useAssistant } from "@/context/assistant-context"
import { useShoppingCart } from "@/context/cart-context"
import { useUser } from "@/context/user-context"
import { products } from "@/lib/product-data"
import { websiteMap } from "@/lib/website-map"
import { usePathname } from "next/navigation"

export default function VoiceAssistant({ isActive, onNavigate, onSearch, onCategoryChange }) {
  const [isListening, setIsListening] = useState(false)
  const [input, setInput] = useState("")
  const [voiceError, setVoiceError] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const pathname = usePathname()

  const messagesEndRef = useRef(null)
  const { processCommand, speak, stopSpeaking, isSpeaking, context, messages, setMessages } = useAssistant()
  const { cart, addToCart, removeFromCart, getCartTotal } = useShoppingCart()
  const { user } = useUser()

  const recognitionRef = useRef(null)
  // Store the last found products for context
  const [lastFoundProducts, setLastFoundProducts] = useState([])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser")
        setVoiceError("Voice recognition is not supported in your browser.")
        return
      }

      try {
        // Create a new recognition instance
        recognitionRef.current = new SpeechRecognition()

        // Configure recognition
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = "en-US"

        // Set up event handlers
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          console.log("Speech recognized:", transcript)
          setInput(transcript)
          handleSendMessage(transcript)
        }

        recognitionRef.current.onstart = () => {
          console.log("Speech recognition started")
          setIsListening(true)
        }

        recognitionRef.current.onend = () => {
          console.log("Speech recognition ended")
          // Only try to restart if we're supposed to be listening
          if (isListening) {
            try {
              console.log("Attempting to restart speech recognition")
              recognitionRef.current.start()
            } catch (error) {
              console.error("Speech recognition error on restart:", error)
              setIsListening(false)
              setVoiceError("Voice recognition stopped unexpectedly. Please try again.")
            }
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setVoiceError(`Error: ${event.error}. Please try again.`)
          setIsListening(false)
        }
      } catch (error) {
        console.error("Error initializing speech recognition:", error)
        setVoiceError("Failed to initialize voice recognition. Please try again or use text input.")
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (error) {
          console.error("Error aborting speech recognition:", error)
        }
      }
    }
  }, [])

  // Stop listening when the assistant is speaking to avoid feedback loops
  useEffect(() => {
    if (isSpeaking && isListening) {
      try {
        recognitionRef.current?.stop()
        setIsListening(false)
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
      }
    }
  }, [isSpeaking, isListening])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleListening = () => {
    console.log("Toggle listening called, current state:", isListening)

    if (!recognitionRef.current) {
      console.error("Speech recognition not initialized")
      setVoiceError("Voice recognition is not available. Please try using text input instead.")
      return
    }

    // Don't start listening if the assistant is speaking
    if (isSpeaking && !isListening) {
      setVoiceError("Please wait until I finish speaking before giving a new command.")
      return
    }

    if (isListening) {
      console.log("Stopping speech recognition")
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
        setIsListening(false)
      }
    } else {
      console.log("Starting speech recognition")
      setVoiceError(null)
      try {
        // Request microphone permission explicitly
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => {
            recognitionRef.current.start()
            setIsListening(true)
            console.log("Speech recognition started successfully")
          })
          .catch((error) => {
            console.error("Microphone permission denied:", error)
            setVoiceError("Microphone access was denied. Please allow microphone access in your browser settings.")
          })
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        setVoiceError("Could not start voice recognition. Please try again or use text input.")
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      stopSpeaking()
    }
  }

  // Improve the handleSendMessage function to better handle context
  const handleSendMessage = async (text = input) => {
    if (!text.trim()) return

    // Clean the text by removing trailing punctuation
    const cleanText = text.replace(/[.,!?;:]+$/, "").trim()

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: cleanText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Process the command
    try {
      const response = await processUserCommand(cleanText)

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        products: response.products,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!isMuted) {
        speak(response.message)
      }

      // Handle actions if needed
      if (response.action) {
        executeAction(response.action)
      }
    } catch (error) {
      console.error("Error processing command:", error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      if (!isMuted) {
        speak(errorMessage.content)
      }
    }
  }

  // Get current page description
  const getCurrentPageDescription = () => {
    // Extract the page name from the pathname
    const pageName = pathname === "/" ? "Home" : pathname.split("/").filter(Boolean)[0]

    if (pageName === "product" && pathname.includes("/product/")) {
      // This is a product detail page
      const productId = Number.parseInt(pathname.split("/").pop())
      const product = products.find((p) => p.id === productId)

      if (product) {
        const price = product.discount
          ? (product.price * (1 - product.discount / 100)).toFixed(2)
          : product.price.toFixed(2)

        return `You're viewing the ${product.name} product page. This ${product.category.toLowerCase()} costs $${price}${product.discount ? ` (${product.discount}% off)` : ""}. ${product.description}`
      }
      return "You're viewing a product detail page."
    }

    // Check if it matches a known section in the website map
    for (const [key, value] of Object.entries(websiteMap)) {
      if (key.toLowerCase() === pageName.toLowerCase() || value.path === pathname) {
        return `You're on the ${key} page. ${value.description}`
      }
    }

    return `You're on the ${pageName} page.`
  }

  // Improve the processUserCommand function to better handle entity extraction and context
  const processUserCommand = async (command) => {
    // Clean the command by removing trailing punctuation
    const cleanCommand = command
      .replace(/[.,!?;:]+$/, "")
      .trim()
      .toLowerCase()

    // Check for page context questions
    if (
      cleanCommand === "where am i" ||
      cleanCommand === "what page is this" ||
      cleanCommand === "what is this page" ||
      cleanCommand === "what's on this page" ||
      cleanCommand === "explain this page" ||
      cleanCommand === "tell me about this page"
    ) {
      return {
        message: getCurrentPageDescription(),
      }
    }

    // Check for navigation intents
    if (
      cleanCommand.includes("go to") ||
      cleanCommand.includes("open") ||
      cleanCommand.includes("show me") ||
      cleanCommand.includes("navigate to") ||
      cleanCommand.includes("take me to")
    ) {
      return handleNavigationIntent(cleanCommand)
    }

    // Check for search intents
    if (
      cleanCommand.includes("find") ||
      cleanCommand.includes("search for") ||
      cleanCommand.includes("look for") ||
      cleanCommand.includes("search") ||
      cleanCommand.includes("show me products") ||
      cleanCommand.includes("do you have")
    ) {
      return handleSearchIntent(cleanCommand)
    }

    // Check for cart intents
    if (
      cleanCommand.includes("add to cart") ||
      cleanCommand.includes("buy") ||
      cleanCommand.includes("add") ||
      cleanCommand.includes("purchase") ||
      cleanCommand.includes("get")
    ) {
      // If the command is just "add to cart" and we have last found products, use the first one
      if ((cleanCommand === "add to cart" || cleanCommand === "add") && lastFoundProducts.length > 0) {
        const product = lastFoundProducts[0]
        addToCart(product)
        return {
          message: `I've added ${product.name} to your cart. Your cart total is now $${getCartTotal().toFixed(2)}.`,
          action: `addToCart:${product.id}`,
        }
      }
      return handleCartIntent(cleanCommand)
    }

    // Check for remove from cart intents
    if (
      cleanCommand.includes("remove from cart") ||
      cleanCommand.includes("delete from cart") ||
      cleanCommand.includes("take out of cart") ||
      (cleanCommand.includes("remove") && cleanCommand.includes("cart"))
    ) {
      return handleRemoveFromCartIntent(cleanCommand)
    }

    // Check for information intents
    if (
      cleanCommand.includes("what is") ||
      cleanCommand.includes("tell me about") ||
      cleanCommand.includes("how do i") ||
      cleanCommand.includes("where is") ||
      cleanCommand.includes("do you have") ||
      cleanCommand.includes("is there") ||
      cleanCommand.includes("information") ||
      cleanCommand.includes("details")
    ) {
      return handleInformationIntent(cleanCommand)
    }

    // Check for cart status
    if (
      cleanCommand.includes("what's in my cart") ||
      cleanCommand.includes("show my cart") ||
      cleanCommand.includes("cart contents") ||
      cleanCommand.includes("my cart") ||
      cleanCommand === "cart"
    ) {
      return handleCartStatusIntent()
    }

    // Check for greeting
    if (
      cleanCommand.includes("hello") ||
      cleanCommand.includes("hi") ||
      cleanCommand.includes("hey") ||
      cleanCommand.includes("good morning") ||
      cleanCommand.includes("good afternoon") ||
      cleanCommand.includes("good evening")
    ) {
      return {
        message: `Hello${user ? ` ${user.name}` : ""}! How can I help with your shopping today?`,
      }
    }

    // Check for thanks
    if (
      cleanCommand.includes("thank you") ||
      cleanCommand.includes("thanks") ||
      cleanCommand.includes("appreciate it")
    ) {
      return {
        message: "You're welcome! Is there anything else I can help you with?",
      }
    }

    // Check for help
    if (
      cleanCommand.includes("help") ||
      cleanCommand.includes("what can you do") ||
      cleanCommand.includes("how do you work") ||
      cleanCommand === "help me"
    ) {
      return {
        message:
          "I can help you find products, navigate the website, add items to your cart, and answer questions about our store. Try saying things like 'find headphones', 'show me clothing', 'add to cart', or 'what's in my cart?'",
      }
    }

    // Check for product references without explicit commands
    const productMatch = products.find(
      (p) =>
        cleanCommand.includes(p.name.toLowerCase()) ||
        cleanCommand.includes(p.category.toLowerCase()) ||
        p.description.toLowerCase().includes(cleanCommand),
    )

    if (productMatch) {
      return {
        message: `I found ${productMatch.name}. Would you like to add it to your cart or see more details?`,
        products: [productMatch],
        action: `showProduct:${productMatch.id}`,
      }
    }

    // Check for category references
    const categories = ["electronics", "clothing", "kitchen", "accessories", "footwear", "home"]
    const categoryMatch = categories.find((category) => cleanCommand.includes(category.toLowerCase()))

    if (categoryMatch) {
      return {
        message: `I can show you our ${categoryMatch} collection. Here are some products:`,
        action: `category:${categoryMatch}`,
      }
    }

    // Default response for unrecognized commands
    return {
      message:
        "I'm not sure how to help with that. You can ask me to find products, navigate to different sections, add items to your cart, or get information about the website.",
    }
  }

  // Improve the handleSearchIntent function to better handle search queries
  const handleSearchIntent = (command) => {
    // Extract the search term
    let searchTerm = ""

    if (command.includes("find")) {
      searchTerm = command.split("find")[1].trim()
    } else if (command.includes("search for")) {
      searchTerm = command.split("search for")[1].trim()
    } else if (command.includes("look for")) {
      searchTerm = command.split("look for")[1].trim()
    } else if (command.includes("search")) {
      searchTerm = command.split("search")[1].trim()
    } else if (command.includes("show me products")) {
      searchTerm = command.split("show me products")[1].trim()
    } else if (command.includes("do you have")) {
      searchTerm = command.split("do you have")[1].trim()
    } else if (command.includes("show me")) {
      searchTerm = command.split("show me")[1].trim()
    }

    // Remove any trailing punctuation
    searchTerm = searchTerm.replace(/[.,!?;:]+$/, "").trim()

    // If no search term is found, check if the command itself might be a product or category
    if (!searchTerm) {
      const categories = ["electronics", "clothing", "kitchen", "accessories", "footwear", "home"]
      const categoryMatch = categories.find((category) => command.includes(category.toLowerCase()))

      if (categoryMatch) {
        return {
          message: `Here are our ${categoryMatch} products:`,
          action: `category:${categoryMatch}`,
        }
      }

      return {
        message: "What would you like me to search for?",
      }
    }

    // Search for matching products
    const matchingProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (matchingProducts.length > 0) {
      // Store the found products for context
      setLastFoundProducts(matchingProducts.slice(0, 3))

      return {
        message: `I found ${matchingProducts.length} products matching "${searchTerm}". Here are some results:`,
        products: matchingProducts.slice(0, 3),
        action: `search:${searchTerm}`,
      }
    } else {
      return {
        message: `I couldn't find any products matching "${searchTerm}". Would you like to try a different search term?`,
      }
    }
  }

  // Improve the handleCartIntent function to better handle cart commands
  const handleCartIntent = (command) => {
    // Extract the product name
    let productName = ""

    if (command.includes("add to cart")) {
      productName = command.split("add to cart")[1].trim()
    } else if (command.includes("buy")) {
      productName = command.split("buy")[1].trim()
    } else if (command.includes("add") && !command.includes("add to cart")) {
      productName = command.split("add")[1].trim()
    } else if (command.includes("purchase")) {
      productName = command.split("purchase")[1].trim()
    } else if (command.includes("get")) {
      productName = command.split("get")[1].trim()
    }

    // Remove any trailing punctuation
    productName = productName.replace(/[.,!?;:]+$/, "").trim()

    if (!productName && lastFoundProducts.length > 0) {
      // If no product name is specified but we have recently found products, use the first one
      const product = lastFoundProducts[0]
      addToCart(product)
      return {
        message: `I've added ${product.name} to your cart. Your cart total is now $${getCartTotal().toFixed(2)}.`,
        action: `addToCart:${product.id}`,
      }
    }

    if (!productName) {
      return {
        message: "Which product would you like to add to your cart?",
      }
    }

    // Find the matching product
    const product = products.find(
      (p) =>
        p.name.toLowerCase().includes(productName.toLowerCase()) ||
        p.category.toLowerCase() === productName.toLowerCase(),
    )

    if (product) {
      addToCart(product)
      return {
        message: `I've added ${product.name} to your cart. Your cart total is now $${getCartTotal().toFixed(2)}.`,
        action: `addToCart:${product.id}`,
      }
    } else {
      return {
        message: `I couldn't find a product called "${productName}". Would you like me to search for it?`,
      }
    }
  }

  // Add a new function to handle removing items from cart
  const handleRemoveFromCartIntent = (command) => {
    // Extract the product name
    let productName = ""

    if (command.includes("remove from cart")) {
      productName = command.split("remove from cart")[1].trim()
    } else if (command.includes("delete from cart")) {
      productName = command.split("delete from cart")[1].trim()
    } else if (command.includes("take out of cart")) {
      productName = command.split("take out of cart")[1].trim()
    } else if (command.includes("remove") && command.includes("cart")) {
      const parts = command.split("remove")
      if (parts.length > 1) {
        productName = parts[1].replace("from cart", "").replace("from my cart", "").trim()
      }
    }

    // Remove any trailing punctuation
    productName = productName.replace(/[.,!?;:]+$/, "").trim()

    if (!productName) {
      // If no product specified, ask which one to remove
      if (cart.length === 0) {
        return {
          message: "Your cart is empty. There's nothing to remove.",
        }
      } else if (cart.length === 1) {
        // If only one item in cart, remove it
        const item = cart[0]
        removeFromCart(item.id)
        return {
          message: `I've removed ${item.name} from your cart. Your cart is now empty.`,
        }
      } else {
        // Multiple items, ask which one
        return {
          message: `Which product would you like to remove from your cart? You have ${cart.length} items in your cart.`,
        }
      }
    }

    // Find the matching product in the cart
    const cartItem = cart.find((item) => item.name.toLowerCase().includes(productName.toLowerCase()))

    if (cartItem) {
      removeFromCart(cartItem.id)
      return {
        message: `I've removed ${cartItem.name} from your cart. ${
          cart.length <= 1 ? "Your cart is now empty." : `Your cart total is now $${getCartTotal().toFixed(2)}.`
        }`,
      }
    } else {
      return {
        message: `I couldn't find "${productName}" in your cart. Please check your cart to see what items you have.`,
      }
    }
  }

  // Improve the handleNavigationIntent function to better handle navigation commands
  const handleNavigationIntent = (command) => {
    // Extract the destination from the command
    let destination = ""

    if (command.includes("go to")) {
      destination = command.split("go to")[1].trim()
    } else if (command.includes("open")) {
      destination = command.split("open")[1].trim()
    } else if (command.includes("show me") && !command.includes("show me products")) {
      destination = command.split("show me")[1].trim()
    } else if (command.includes("navigate to")) {
      destination = command.split("navigate to")[1].trim()
    } else if (command.includes("take me to")) {
      destination = command.split("take me to")[1].trim()
    }

    // Remove any trailing punctuation
    destination = destination.replace(/[.,!?;:]+$/, "").trim()

    // Direct navigation for common sections
    if (destination === "cart" || destination === "my cart" || destination === "shopping cart") {
      return {
        message: "Taking you to your cart.",
        action: "navigate:/cart",
      }
    }

    if (destination === "home" || destination === "homepage" || destination === "main page") {
      return {
        message: "Taking you to the home page.",
        action: "navigate:/",
      }
    }

    if (destination === "categories" || destination === "category page") {
      return {
        message: "Taking you to the categories page.",
        action: "navigate:/categories",
      }
    }

    if (destination === "orders" || destination === "my orders" || destination === "order history") {
      return {
        message: "Taking you to your orders.",
        action: "navigate:/orders",
      }
    }

    if (destination === "wishlist" || destination === "my wishlist" || destination === "saved items") {
      return {
        message: "Taking you to your wishlist.",
        action: "navigate:/wishlist",
      }
    }

    // Find the matching section in the website map
    const section = Object.entries(websiteMap).find(
      ([key, value]) =>
        destination.includes(key.toLowerCase()) ||
        value.aliases.some((alias) => destination.includes(alias.toLowerCase())),
    )

    if (section) {
      const [key, value] = section
      return {
        message: `Navigating to the ${key} section. ${value.description}`,
        action: `navigate:${value.path}`,
      }
    }

    // Check for category navigation
    const categories = ["electronics", "clothing", "kitchen", "accessories", "footwear", "home"]
    const categoryMatch = categories.find((category) => destination.includes(category.toLowerCase()))

    if (categoryMatch) {
      return {
        message: `Showing you our ${categoryMatch} collection.`,
        action: `category:${categoryMatch}`,
      }
    }

    // Check for product navigation
    const productMatch = products.find((p) => destination.toLowerCase().includes(p.name.toLowerCase()))
    if (productMatch) {
      return {
        message: `Taking you to the ${productMatch.name} product page.`,
        action: `navigate:/product/${productMatch.id}`,
      }
    }

    return {
      message: `I couldn't find a section called "${destination}". You can navigate to Home, Categories, Orders, Wishlist, Deals, or Account.`,
    }
  }

  const handleInformationIntent = (command) => {
    // Check if asking about current page
    if (command.includes("this page") || command.includes("current page")) {
      return {
        message: getCurrentPageDescription(),
      }
    }

    // Check for product information requests
    const productMatch = products.find(
      (p) => command.includes(p.name.toLowerCase()) || p.description.toLowerCase().includes(command),
    )

    if (productMatch) {
      // Calculate the correct price with discount if applicable
      const displayPrice = productMatch.discount
        ? (productMatch.price * (1 - productMatch.discount / 100)).toFixed(2)
        : productMatch.price.toFixed(2)

      return {
        message: `${productMatch.name}: ${productMatch.description} It costs $${displayPrice}${
          productMatch.discount
            ? ` (${productMatch.discount}% off the original price of $${productMatch.price.toFixed(2)})`
            : ""
        } and has a rating of ${productMatch.rating} out of 5 stars. Would you like to see more details or add it to your cart?`,
        products: [productMatch],
        action: `showProduct:${productMatch.id}`,
      }
    }

    // Check for website section information
    for (const [key, value] of Object.entries(websiteMap)) {
      if (command.includes(key.toLowerCase())) {
        return {
          message: value.description,
          action: `suggestNavigation:${value.path}`,
        }
      }

      for (const alias of value.aliases) {
        if (command.includes(alias.toLowerCase())) {
          return {
            message: value.description,
            action: `suggestNavigation:${value.path}`,
          }
        }
      }
    }

    // Check for specific questions about website sections
    if (
      command.includes("orders section") ||
      command.includes("order history") ||
      command.includes("do you have orders") ||
      command.includes("is there an orders section")
    ) {
      return {
        message:
          "Yes, we have an Orders section where you can view your order history. You can access it by clicking on the Orders link in the navigation menu, or I can take you there. Would you like me to open the Orders section?",
        action: "suggestNavigation:orders",
      }
    }

    if (
      command.includes("wishlist") ||
      command.includes("favorites") ||
      command.includes("do you have a wishlist") ||
      command.includes("is there a wishlist")
    ) {
      return {
        message:
          "Yes, we have a Wishlist section where you can save products you're interested in for later. You can add products to your wishlist by clicking the heart icon on any product card. To view your wishlist, click on the heart icon in the header or ask me to open your wishlist.",
        action: "suggestNavigation:wishlist",
      }
    }

    if (
      command.includes("cart") ||
      command.includes("shopping cart") ||
      command.includes("do you have a cart") ||
      command.includes("is there a cart")
    ) {
      return {
        message:
          "Yes, we have a Cart section where you can view and manage items before checkout. You can access it by clicking the cart icon in the header, or I can take you there. Would you like me to open your cart?",
        action: "suggestNavigation:cart",
      }
    }

    if (
      command.includes("categories") ||
      command.includes("product categories") ||
      command.includes("do you have categories") ||
      command.includes("is there a categories section")
    ) {
      return {
        message:
          "Yes, we have a Categories section where you can browse products by category. We have Electronics, Clothing, Kitchen, Accessories, Footwear, and Home categories. You can access it from the navigation menu, or I can take you there. Would you like me to open the Categories section?",
        action: "suggestNavigation:categories",
      }
    }

    // Check for specific questions
    if (command.includes("checkout") || command.includes("payment")) {
      return {
        message:
          "To checkout, you can add items to your cart and then click the Checkout button. We accept credit cards, PayPal, and Apple Pay. The checkout process is secure and only takes a few minutes to complete.",
      }
    }

    if (command.includes("shipping") || command.includes("delivery")) {
      return {
        message:
          "We offer free standard shipping on all orders over $50. Standard shipping takes 3-5 business days. Express shipping is available for an additional fee and delivers within 1-2 business days.",
      }
    }

    if (command.includes("return") || command.includes("refund")) {
      return {
        message:
          "Our return policy allows you to return items within 30 days of delivery for a full refund. Returns are free and can be initiated from the Orders section of your account.",
      }
    }

    if (command.includes("promo") || command.includes("discount") || command.includes("coupon")) {
      return {
        message:
          "You can apply promo codes during checkout. Try using the code 'WELCOME10' for 10% off your first order. We also have seasonal promotions and special offers in our Deals section.",
      }
    }

    // Default information response
    return {
      message:
        "I'm not sure about that specific information. You can ask me about our website sections, shipping, returns, payment methods, or how to use specific features.",
    }
  }

  const handleCartStatusIntent = () => {
    if (cart.length === 0) {
      return {
        message: "Your cart is currently empty. Would you like me to help you find some products?",
      }
    }

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
    const total = getCartTotal()

    // Create a more detailed cart description
    let cartDetails = ""
    if (cart.length > 0) {
      cartDetails = " Your cart contains: "
      cart.forEach((item, index) => {
        const itemPrice = item.discount ? (item.price * (1 - item.discount / 100)).toFixed(2) : item.price.toFixed(2)

        cartDetails += `${item.quantity} ${item.name} at $${itemPrice} each`
        if (index < cart.length - 1) {
          cartDetails += ", "
        }
      })
      cartDetails += "."
    }

    return {
      message: `You have ${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart with a total of $${total.toFixed(2)}.${cartDetails} Would you like to checkout or continue shopping?`,
      action: "suggestCheckout",
    }
  }

  // Improve the executeAction function to better handle actions
  const executeAction = (action) => {
    if (action.startsWith("navigate:")) {
      const path = action.split(":")[1]
      onNavigate(path)
    } else if (action === "navigate:/cart") {
      onNavigate("/cart")
    } else if (action === "navigate:/") {
      onNavigate("/")
    } else if (action === "navigate:/categories") {
      onNavigate("/categories")
    } else if (action === "navigate:/orders") {
      onNavigate("/orders")
    } else if (action === "navigate:/wishlist") {
      onNavigate("/wishlist")
    } else if (action.startsWith("search:")) {
      const term = action.split(":")[1]
      onSearch(term)
    } else if (action.startsWith("category:")) {
      const category = action.split(":")[1]
      onCategoryChange(category.charAt(0).toUpperCase() + category.slice(1))
    } else if (action.startsWith("addToCart:")) {
      // Already handled in the handleCartIntent function
    } else if (action === "suggestCheckout") {
      // Could show a checkout prompt
    } else if (action.startsWith("suggestNavigation:")) {
      // Could show a navigation prompt
    } else if (action.startsWith("showProduct:")) {
      const productId = action.split(":")[1]
      onNavigate(`/product/${productId}`)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-30 w-80 bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="bg-teal-600 text-white p-3 flex justify-between items-center">
        <div className="flex items-center">
          <Bot size={20} className="mr-2" />
          <h3 className="font-medium">Shopping Assistant</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleMute}
            className="p-1 rounded-full hover:bg-teal-700"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={toggleListening}
            className={`p-1 rounded-full ${isListening ? "bg-red-500" : "hover:bg-teal-700"}`}
            aria-label={isListening ? "Stop listening" : "Start listening"}
            title={isListening ? "Stop listening" : "Start listening"}
            disabled={!recognitionRef.current || isSpeaking}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>
      </div>

      <div className="h-80 overflow-y-auto p-3 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`mb-3 ${message.role === "user" ? "text-right" : ""}`}>
            <div
              className={`inline-block p-2 rounded-lg max-w-[80%] ${
                message.role === "user" ? "bg-teal-100 text-gray-800" : "bg-white text-gray-800 shadow-sm"
              }`}
            >
              <p>{message.content}</p>

              {message.products && message.products.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.products.map((product) => (
                    <div key={product.id} className="flex items-center bg-gray-50 rounded p-2">
                      <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden relative flex-shrink-0">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="ml-2 flex-grow">
                        <p className="text-xs font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          $
                          {product.discount
                            ? (product.price * (1 - product.discount / 100)).toFixed(2)
                            : product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                          onClick={() => onNavigate(`/product/${product.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="text-xs bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700"
                          onClick={() => {
                            addToCart(product)
                            if (!isMuted) {
                              speak(
                                `Added ${product.name} to your cart for $${
                                  product.discount
                                    ? (product.price * (1 - product.discount / 100)).toFixed(2)
                                    : product.price.toFixed(2)
                                }.`,
                              )
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {voiceError && (
        <div className="px-3 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100">{voiceError}</div>
      )}

      <div className="p-3 border-t">
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
        >
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Type a message..."}
            className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isListening}
          />
          <button
            type="submit"
            className="bg-teal-600 text-white p-2 rounded-r-md hover:bg-teal-700 disabled:bg-gray-300"
            disabled={!input.trim() && !isListening}
          >
            <Send size={18} />
          </button>
        </form>

        {isListening && (
          <div className="text-xs text-center text-teal-600 mt-2 animate-pulse">
            Listening... Say something like "Find headphones" or "What's in my cart?"
          </div>
        )}

        {isSpeaking && <div className="text-xs text-center text-teal-600 mt-2">Speaking...</div>}
      </div>
    </div>
  )
}
