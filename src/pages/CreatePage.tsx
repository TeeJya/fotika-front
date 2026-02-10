import React from 'react'
import { getIdToken } from '../firebase'
import Dashboard from '../components/Dashboard'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AuthForm from '../components/AuthForm'

export default function CreatePage(){
  const [showAuthModal, setShowAuthModal] = React.useState(false)

  React.useEffect(() => {
    // Check if user is authenticated
    const token = getIdToken()
    if (!token) {
      setShowAuthModal(true)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 max-w-7xl">
        <div className="py-8 space-y-6 mt-5">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Create your gallery</h1>
            <p className="text-lg text-muted-foreground">Connect your Google Drive and select a folder to generate a beautiful shareable gallery link.</p>
          </div>
          <Dashboard />
        </div>
      </main>
      <Footer />

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <AuthForm 
              view="modal" 
              onSuccess={() => setShowAuthModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}
