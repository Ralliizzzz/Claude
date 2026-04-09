import { h, render } from "preact"
import App from "./App"
import { setApiBase } from "./api"

// Fanges med det samme — document.currentScript er null i event handlers
const script = document.currentScript as HTMLScriptElement | null
const apiBase = script?.src ? new URL(script.src).origin : window.location.origin

function mount() {
  setApiBase(apiBase)

  const container = document.getElementById("lead-widget")
  if (!container) {
    console.warn("[Estimato] Fandt ikke <div id='lead-widget'> på siden.")
    return
  }

  // companyId kan sidde på script-tagget ELLER på selve div'en
  const companyId =
    script?.dataset?.company ??
    script?.getAttribute("data-company") ??
    container.dataset.company ??
    container.getAttribute("data-company") ??
    ""

  if (!companyId) {
    console.warn("[Estimato] Mangler data-company attribut.")
    return
  }

  // Shadow DOM for CSS-isolation
  const shadow = container.attachShadow({ mode: "open" })

  // Inject base styles i shadow root
  const style = document.createElement("style")
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    input, button, select { font-family: inherit; }
    input:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    a { color: #3b82f6; }
  `
  shadow.appendChild(style)

  // Mount Preact-app i shadow root
  const root = document.createElement("div")
  shadow.appendChild(root)

  render(h(App, { companyId }), root)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount)
} else {
  mount()
}
