import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Camera, Zap, Shield, ChevronRight, Share2, Globe } from 'lucide-react'

export default function Landing(){
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden px-4 lg:px-[180px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Text */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-foreground leading-tight">
                  Turn your Google Drive<br className="hidden sm:inline" />
                  <span className="text-primary"> into a stunning gallery.</span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Create professional photo galleries directly from your Drive folders. 
                  Zero storage limits, zero upload time, 100% privacy control.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center lg:justify-start">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold rounded-full w-full sm:w-auto" asChild>
                    <a href="#/create">
                      Create Gallery
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold rounded-full w-full sm:w-auto" asChild>
                    <a href="#/auth">Sign In</a>
                  </Button>
                </div>
              </div>

              {/* Right Column: Video */}
              <div className="relative mx-auto w-full max-w-[100%] sm:max-w-[450px] flex justify-center items-center">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-auto rounded-[2rem] shadow-2xl z-10"
                >
                  <source src="/phone-dark.webm" type="video/webm" />
                </video>
                
                {/* Decorative Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-primary/20 blur-3xl -z-0 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-card border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
