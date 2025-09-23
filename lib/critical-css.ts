// Critical CSS extraction and inlining utility
export const CRITICAL_CSS = `
/* Critical CSS for above-the-fold content */
:root{--background:0 0% 100%;--foreground:222.2 84% 4.9%;--primary:221.2 83.2% 53.3%;--primary-foreground:210 40% 98%;--radius:0.5rem}
*{box-sizing:border-box;border-width:0;border-style:solid;border-color:hsl(214.3 31.8% 91.4%)}
html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:var(--font-inter),system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
body{margin:0;line-height:inherit;background-color:hsl(var(--background));color:hsl(var(--foreground));-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;-webkit-tap-highlight-color:transparent}
.hero-section{width:100%;padding:1rem 0;background-color:#fff;contain:layout style paint}
.hero-title{font-size:1.5rem;line-height:1.2;font-weight:700;letter-spacing:-0.025em;color:#1f2937}
.hero-subtitle{font-size:0.875rem;line-height:1.4;color:#6b7280}
.hero-image{width:100%;height:200px;object-fit:cover;border-radius:0.5rem}
.btn-primary{display:inline-flex;align-items:center;justify-content:center;border-radius:0.375rem;font-size:0.875rem;font-weight:500;background-color:#2563eb;color:#fff;padding:0.5rem 1rem;border:none;cursor:pointer;transition:background-color 0.2s}
.btn-primary:hover{background-color:#1d4ed8}
.container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
@media(min-width:640px){.container{max-width:640px}}
@media(min-width:768px){.hero-section{padding:3rem 0}.hero-title{font-size:2.5rem}.hero-image{height:300px}.container{max-width:768px;padding-left:1.5rem;padding-right:1.5rem}}
@media(min-width:1024px){.container{max-width:1024px}}
@media(min-width:1280px){.container{max-width:1280px}}
.loading-skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:loading 1.5s infinite}
@keyframes loading{0%{background-position:200% 0}100%{background-position:-200% 0}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}
`

export function injectCriticalCSS() {
  if (typeof document === "undefined") return

  const existingStyle = document.getElementById("critical-css")
  if (existingStyle) return

  const style = document.createElement("style")
  style.id = "critical-css"
  style.textContent = CRITICAL_CSS
  document.head.insertBefore(style, document.head.firstChild)
}
