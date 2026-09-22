import { createRoot, type Root } from "react-dom/client"
import { SwipeableCardStack, type SwipePlace } from "@/components/ui/tinder-like-swipe"
import "./index.css"

declare global {
  interface Window {
    AngraCardWidget?: {
      render: (places: SwipePlace[]) => void
    }
    AngraCardBridge?: {
      swipe: (id: string, direction: "left" | "right") => void
      open: (id: string) => void
      ready?: () => void
    }
  }
}

function mount(rootEl: HTMLElement) {
  const root: Root = createRoot(rootEl)

  function render(places: SwipePlace[]) {
    root.render(
      <SwipeableCardStack
        places={places}
        onSwipe={(place, dir) => window.AngraCardBridge?.swipe(place.id, dir)}
        onOpen={(place) => window.AngraCardBridge?.open(place.id)}
      />
    )
  }

  window.AngraCardWidget = { render }
  window.AngraCardBridge?.ready?.()
}

const el = document.getElementById("card-root")
if (el) mount(el)
