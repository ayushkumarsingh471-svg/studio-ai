import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'

export const metadata = {
  title: 'STUDIO.AI',
  description: 'AI Product Image Generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
  appearance={{
    variables: {
      colorPrimary: '#eab308',
      colorBackground: '#020617',
    },
        elements: {
          card: 'bg-[#020617] border border-yellow-500/20 shadow-[0_0_40px_-10px_rgba(234,179,8,0.15)] rounded-2xl',
          
          // 1. Sign in to Studio AI -> Jabardasti Yellow (! laga kar)
          headerTitle: '!text-yellow-400 text-2xl font-black tracking-widest',
          
          // 2. Welcome back! Please sign in to continue -> Light Yellow
          headerSubtitle: '!text-yellow-200 font-medium text-sm mt-1',
          
          // 3. Continue with Google
          socialButtonsBlockButton: 'bg-[#0f172a] border border-yellow-500/30 hover:bg-[#1e293b] rounded-xl',
          socialButtonsBlockButtonText: '!text-yellow-400 font-bold',
          
          // 4. "or"
          dividerLine: 'bg-slate-700',
          dividerText: '!text-yellow-500 font-bold',
          
          // 5. Email address & Password labels
          formFieldLabel: '!text-yellow-400 uppercase tracking-widest text-[12px] font-bold mb-1',
          
          // 6. Forgot password?
          formFieldAction: '!text-yellow-300 hover:text-yellow-100 font-bold',
          
          // Input Box
          formFieldInput: 'bg-[#0f172a] border border-slate-700 focus:border-yellow-500 text-white rounded-xl py-3',
          
          // Main Continue Button (Yellow box with Black text)
          formButtonPrimary: 'bg-yellow-500 hover:bg-yellow-400 !text-black font-black tracking-widest uppercase rounded-xl py-4 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-[1.02]',
          
          // 7. Don’t have an account?
          footerActionText: '!text-yellow-200 font-medium',
          
          // 8. Sign up
          footerActionLink: '!text-yellow-400 hover:text-yellow-200 font-black tracking-wide',
        }
      }}
    >
      <html lang="en">
        <body className="bg-neutral-950 text-white overflow-x-hidden">{children}</body>
      </html>
    </ClerkProvider>
  )
}