import React from 'react'
import EventPage from './components/EventPage'
import Landing from './components/Landing'
import Auth from './components/Auth'
import CreatePage from './pages/CreatePage'
import SettingsPage from './pages/SettingsPage'
import AdminDashboard from './pages/AdminDashboard'
import SiteManager from './pages/SiteManager'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'

export default function App() {
  const [route, setRoute] = React.useState(location.hash.replace('#', '') || '/')
  
  React.useEffect(() => {
    // Handle system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      document.documentElement.classList.toggle('dark', mediaQuery.matches)
    }
    
    // Initial check
    handleChange()

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  React.useEffect(() => {
    const onHash = () => setRoute(location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.startsWith('/e/')) {
    const slug = route.replace('/e/', '')
    return <EventPage slug={slug} />
  }
  if (route === '/auth') return <Auth />
  if (route === '/create') return <CreatePage />
  if (route === '/settings') return <SettingsPage />
  if (route === '/dashboard') return <AdminDashboard />
  if (route === '/admin') return <SiteManager />
  if (route === '/privacy') return <PrivacyPage />
  if (route === '/terms') return <TermsPage />

  return <Landing />
}
