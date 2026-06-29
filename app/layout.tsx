import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'
import Navbar from './components/Navbar'// <-- Navbar yahan import kiya hai

export const metadata = {
  title: 'STUDIO.AI',
  description: 'AI Product Image Generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#eab308', // Yellow
          colorBackground: '#ffffff', // Background White
          colorText: '#000000', // Text Black for clear readability
        },
        elements: {
          card: 'bg-white border border-yellow-500/20 shadow-xl rounded-2xl',
          headerTitle: '!text-yellow-600 text-2xl font-black',
          headerSubtitle: '!text-gray-600 font-medium',
          socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50 rounded-xl',
          socialButtonsBlockButtonText: '!text-black font-bold',
          formFieldLabel: '!text-gray-700 font-bold',
          formFieldInput: 'bg-white border border-gray-300 text-black rounded-xl',
          formButtonPrimary: 'bg-yellow-500 hover:bg-yellow-600 !text-black font-black uppercase rounded-xl',
          footerActionText: '!text-gray-600',
          footerActionLink: '!text-yellow-600 font-bold',
        }
      }}
    >
      <html lang="en">
        <body className="bg-neutral-950 text-white overflow-x-hidden">
          <Navbar /> {/* <-- Navbar poori site ke liye yahan add kar diya */}
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}