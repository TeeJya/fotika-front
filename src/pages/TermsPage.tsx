import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-4 text-sm text-gray-500">Last updated: February 5, 2026</p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="mb-2">
              By accessing and using Fotika, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="mb-2">
              Fotika provides a platform for photographers and event organizers to share, sell, and distribute digital photos.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
            <p className="mb-2">You agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Provide accurate account information</li>
              <li>Maintain the security of your account</li>
              <li>Only upload content you have the right to distribute</li>
              <li>Not use the service for any illegal purposes</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
            <p className="mb-2">
              You retain all rights to the content you upload to Fotika. By uploading content, you grant us 
              license to display and distribute it according to your settings (e.g., selling photos).
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Termination</h2>
            <p className="mb-2">
              We reserve the right to terminate or suspend access to our service immediately, without prior notice 
              or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of the service 
              after changes are posted constitutes your acceptance of the new terms.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
