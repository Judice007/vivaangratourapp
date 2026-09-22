import * as React from "react"
import { AnimatePresence, motion, type PanInfo } from "framer-motion"
import { Heart, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SwipePlace {
  id: string
  name: string
  kind?: string
  description?: string
  photoUrl?: string
  photoCredit?: string
}

export interface SwipeableCardStackProps {
  places: SwipePlace[]
  onSwipe?: (place: SwipePlace, direction: "left" | "right") => void
  onOpen?: (place: SwipePlace) => void
  className?: string
}

const SWIPE_THRESHOLD = 100

export function SwipeableCardStack({
  places,
  onSwipe,
  onOpen,
  className,
}: SwipeableCardStackProps) {
  const [deck, setDeck] = React.useState(places)
  const [direction, setDirection] = React.useState<"left" | "right" | null>(null)
  const dragXRef = React.useRef(0)

  React.useEffect(() => setDeck(places), [places])

  const visible = deck.slice(0, 3)

  function commitSwipe(place: SwipePlace, dir: "left" | "right") {
    setDirection(null)
    setDeck((prev) => prev.filter((p) => p.id !== place.id))
    onSwipe?.(place, dir)
  }

  function handleDrag(_: unknown, info: PanInfo) {
    dragXRef.current = info.offset.x
    setDirection(info.offset.x > 40 ? "right" : info.offset.x < -40 ? "left" : null)
  }

  function handleDragEnd(place: SwipePlace, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      commitSwipe(place, info.offset.x > 0 ? "right" : "left")
    } else {
      setDirection(null)
    }
  }

  if (!visible.length) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-center",
          className
        )}
      >
        <p className="text-lg font-semibold text-foreground">Você viu todos os lugares</p>
        <p className="text-sm text-muted-foreground">Confira seus favoritos ou reabra o catálogo.</p>
      </div>
    )
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <AnimatePresence>
        {visible.map((place, i) => {
            const isTop = i === 0
            const stackDir = isTop ? direction : null
            return (
              <motion.div
                key={place.id}
                className="absolute inset-0"
                style={{ zIndex: visible.length - i }}
                initial={{ scale: 1 - i * 0.04, y: i * 10, opacity: i === 2 ? 0 : 1 }}
                animate={{ scale: 1 - i * 0.04, y: i * 10, opacity: 1 }}
                exit={{
                  x: stackDir === "right" ? 320 : -320,
                  rotate: stackDir === "right" ? 18 : -18,
                  opacity: 0,
                  transition: { duration: 0.25, ease: "easeIn" },
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDrag={isTop ? handleDrag : undefined}
                onDragEnd={isTop ? (_, info) => handleDragEnd(place, info) : undefined}
                onClick={() => {
                  if (isTop && Math.abs(dragXRef.current) < 4) onOpen?.(place)
                }}
              >
                <div
                  className="relative h-full w-full overflow-hidden rounded-3xl border border-border bg-cover bg-center shadow-[0_12px_32px_rgba(8,43,65,0.35)]"
                  style={{
                    backgroundImage: place.photoUrl
                      ? `url(${place.photoUrl})`
                      : "linear-gradient(145deg,#184a5d,#338a94)",
                    cursor: isTop ? "grab" : "default",
                  }}
                >
                  {isTop && stackDir && (
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0 flex items-start justify-center pt-8 transition-opacity",
                        stackDir === "right" ? "bg-primary/30" : "bg-destructive/30"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wide",
                          stackDir === "right"
                            ? "border-primary bg-primary/90 text-primary-foreground"
                            : "border-destructive bg-destructive/90 text-white"
                        )}
                      >
                        {stackDir === "right" ? <Heart className="size-4" /> : <X className="size-4" />}
                        {stackDir === "right" ? "Quero conhecer" : "Passar"}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b2a2ee6] via-[#0b2a2e30] to-transparent p-5 pt-14 text-left text-white">
                    {place.kind && (
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a5d6cd]">
                        {place.kind}
                      </span>
                    )}
                    <h2 className="mt-1 text-2xl font-bold">{place.name}</h2>
                    {place.description && (
                      <p className="mt-1 text-sm text-[#d2e8e3]">{place.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
        })}
      </AnimatePresence>
    </div>
  )
}
