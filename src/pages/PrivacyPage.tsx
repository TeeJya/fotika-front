import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-4 text-sm text-gray-500">Last updated: February 5, 2026</p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect information you provide directly to us when using Fotika, including:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Account information (name, email via Google Sign-In)</li>
              <li>Content you create or upload (galleries, photos)</li>
              <li>Payment information (processed via our secure payment partners)</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. Data Storage & Security</h2>
            <p className="mb-2">
              Your photos are stored securely using Google Drive integration. We implement appropriate technical 
              and organizational measures to protect your personal data against unauthorized access.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Cookies</h2>
            <p className="mb-2">
              We use cookies to improve your experience. By using our website, you agree to the use of cookies 
              in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@fotika.app.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
