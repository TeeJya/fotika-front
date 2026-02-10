import React from 'react'
import { finishSignIn } from '../firebase'
import { Camera, Image, Sparkles } from 'lucide-react'
import AuthForm from './AuthForm'

export default function Auth() {
  const [status, setStatus] = React.useState('')

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await finishSignIn()
        if (res) {
          setStatus('signed')
          window.location.hash = '/create'
        }
      } catch (err) {
        // ignore
      }
    })()
  }, [])

  return (
    <div className="min-h-screen flex relative">
      {/* Absolute Logo Top-Left */}
      <div className="absolute top-8 left-8 z-20 animate-in fade-in duration-700">
         <a href="#/" className="block group">
           <img src="/logo-light.svg" alt="Fotika" className="h-6 w-auto dark:hidden transition-transform group-hover:scale-105" />
           <img src="/logo-dark.svg" alt="Fotika" className="h-6 w-auto hidden dark:block transition-transform group-hover:scale-105" />
         </a>
      </div>

      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-background pt-20 lg:pt-0">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 animate-in slide-in-from-left-4 duration-700">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to manage your photo galleries</p>
          </div>

          <div className="animate-in slide-in-from-left-6 duration-700 delay-100">
            {status === 'signed' ? (
               <div className="p-6 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 rounded-lg text-green-800 dark:text-green-200 text-center">
                <h2 className="text-xl font-semibold mb-2">Successfully Verified!</h2>
                <p>Redirecting to dashboard...</p>
               </div>
            ) : (
              <AuthForm onSuccess={() => window.location.hash = '/create'} view="page" />
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground animate-in fade-in duration-700 delay-200">
            By continuing, you agree to Fotika's <a href="#/terms" className="underline hover:text-primary">Terms of Service</a> and <a href="#/privacy" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Right Side - Animated Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Icons */}
          <div className="absolute top-1/4 left-1/4 animate-float-slow">
            <Camera className="w-16 h-16 text-primary/20" />
          </div>
          <div className="absolute top-1/3 right-1/3 animate-float-medium" style={{ animationDelay: '0.5s' }}>
            <Image className="w-20 h-20 text-primary/15" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-float-fast" style={{ animationDelay: '1s' }}>
            <Sparkles className="w-12 h-12 text-primary/25" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-float-medium" style={{ animationDelay: '1.5s' }}>
            <Camera className="w-14 h-14 text-primary/20" />
          </div>
          
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center space-y-6">
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <h2 className="text-4xl font-bold tracking-tight">Turn Moments Into Memories</h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Create stunning photo galleries, share with ease, and monetize your photography.
            </p>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center animate-in slide-in-from-bottom-4 duration-1000 delay-500">
            <div className="px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border text-sm font-medium">
              🚀 Instant Galleries
            </div>
            <div className="px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border text-sm font-medium">
              💰 Built-in Payments
            </div>
            <div className="px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border text-sm font-medium">
              📱 Mobile Friendly
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add to your global CSS (styles.css)
const style = document.createElement('style')
style.textContent = `
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-30px) rotate(-5deg); }
  }
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-40px) rotate(8deg); }
  }
  .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
  .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
  .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
`
document.head.appendChild(style)
