// GA4 is entirely opt-in via build-time env var — if VITE_GA_MEASUREMENT_ID
// isn't set (local dev, PR previews, any build that doesn't pass it) this
// is a no-op, so dev traffic never pollutes real analytics. GA4's default
// Enhanced Measurement already tracks SPA route changes via the History
// API, so react-router navigations get picked up without any extra code
// here — nothing to wire into the router.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function initAnalytics() {
  if (!GA_ID) return

  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  script.async = true
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID)
}
