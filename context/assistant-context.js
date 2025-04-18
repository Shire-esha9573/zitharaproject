"use client"

import { createContext, useContext, useState, useRef, useEffect } from "react"

const AssistantContext = createContext()

export function AssistantProvider({ children }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [context, setContext] = useState({
    lastQuery: "",
    lastProducts: [],
    conversationHistory: [],
    currentPage: "/",
  })

  // Persist messages across page navigations
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem("assistant_messages")
      if (savedMessages) {
        try {
          return JSON.parse(savedMessages)
        } catch (e) {
          console.error("Error parsing saved messages:", e)
        }
      }
    }
    return [
      {
        id: "1",
        role: "assistant",
        content: "Hi there! I'm your shopping assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]
  })

  // Save messages to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem("assistant_messages", JSON.stringify(messages))
    }
  }, [messages])

  const synthRef = useRef(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis

      // Get available voices
      const populateVoices = () => {
        const voices = synthRef.current.getVoices()
        // Prefer a female English voice if available
        const preferredVoice =
          voices.find((voice) => voice.name.includes("Female") && voice.lang.includes("en-")) ||
          voices.find((voice) => voice.lang.includes("en-"))

        if (preferredVoice) {
          console.log("Using voice:", preferredVoice.name)
        }
      }

      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = populateVoices
      }

      populateVoices()
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Track current page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateCurrentPage = () => {
        setContext((prev) => ({
          ...prev,
          currentPage: window.location.pathname,
        }))
      }

      // Set initial page
      updateCurrentPage()

      // Listen for route changes
      window.addEventListener("popstate", updateCurrentPage)

      return () => {
        window.removeEventListener("popstate", updateCurrentPage)
      }
    }
  }, [])

  // Process a command and return a response
  const processCommand = async (command, products = [], cart = []) => {
    try {
      // Update context
      setContext((prev) => ({
        ...prev,
        lastQuery: command,
        conversationHistory: [...prev.conversationHistory, { role: "user", content: command }],
      }))

      // Call our local API endpoint, which will forward to the Python backend
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: command,
          products,
          cart,
          user_id: "anonymous", // You can replace this with actual user ID if available
        }),
        cache: "no-store", // Ensure we don't cache responses
      })

      if (!response.ok) {
        throw new Error(`Backend request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("Backend response:", data)

      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.error)
      }

      // Update context with response
      setContext((prev) => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, { role: "assistant", content: data.message }],
      }))

      return {
        message: data.message,
        action: data.action,
        products: data.products,
      }
    } catch (error) {
      console.error("Error processing command:", error)

      // Fallback response if backend is unavailable
      return {
        message: "I'm having trouble connecting to my backend. Please try again later or use the website navigation.",
        action: null,
      }
    }
  }

  // Improve the speak function to handle price formatting better
  const speak = (text) => {
    if (synthRef.current) {
      // Cancel any ongoing speech
      synthRef.current.cancel()

      // Format prices for better speech - replace $ followed by numbers with "dollar"
      const formattedText = text.replace(/\$(\d+(\.\d+)?)/g, (match, price) => {
        return `${price} dollars`
      })

      const utterance = new SpeechSynthesisUtterance(formattedText)

      // Get available voices
      const voices = synthRef.current.getVoices()

      // Prefer a female English voice if available
      const preferredVoice =
        voices.find((voice) => voice.name.includes("Female") && voice.lang.includes("en-")) ||
        voices.find((voice) => voice.lang.includes("en-"))

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <AssistantContext.Provider
      value={{
        processCommand,
        speak,
        stopSpeaking,
        isSpeaking,
        context,
        messages,
        setMessages,
      }}
    >
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error("useAssistant must be used within an AssistantProvider")
  }
  return context
}
