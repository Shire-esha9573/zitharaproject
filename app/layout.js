import { Inter } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/context/user-context"
import { AssistantProvider } from "@/context/assistant-context"
import { ShoppingCartProvider } from "@/context/cart-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ShopSmart - Your AI-Powered Shopping Assistant",
  description:
    "Shop smarter with our AI-powered voice assistant that helps you find products, compare prices, and make purchases efficiently.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <ShoppingCartProvider>
            <AssistantProvider>{children}</AssistantProvider>
          </ShoppingCartProvider>
        </UserProvider>
      </body>
    </html>
  )
}
