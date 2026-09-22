import * as React from "react"
import { Heart, X } from "lucide-react"
import { SwipeableCardStack, type SwipePlace } from "@/components/ui/tinder-like-swipe"
import { places } from "@/places"

const STORAGE_KEY = "angra-cards-favorites"

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const [deck, setDeck] = React.useState(places)
  const [favorites, setFavorites] = React.useState<string[]>(readFavorites)
  const [seen, setSeen] = React.useState(0)
  const [detail, setDetail] = React.useState<SwipePlace | null>(null)

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      /* localStorage indisponível: favoritos ficam só nesta sessão */
    }
  }, [favorites])

  function handleSwipe(place: SwipePlace, direction: "left" | "right") {
    setSeen((n) => n + 1)
    if (direction === "right") setFavorites((prev) => [...new Set([...prev, place.id])])
  }

  function act(direction: "left" | "right") {
    const top = deck[0]
    if (!top) return
    handleSwipe(top, direction)
    setDeck((prev) => prev.slice(1))
  }

  const favoritePlaces = places.filter((p) => favorites.includes(p.id))

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col gap-4 p-4">
      <header className="pt-2 text-center">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Deu Match em Angra</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Descubra seu próximo destino</h1>
      </header>

      <div className="relative h-[520px] w-full">
        <SwipeableCardStack
          places={deck}
          onSwipe={(place, dir) => {
            handleSwipe(place, dir)
            setDeck((prev) => prev.filter((p) => p.id !== place.id))
          }}
          onOpen={setDetail}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => act("left")}
          disabled={!deck.length}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-destructive shadow-sm transition hover:bg-destructive/10 disabled:opacity-40"
          aria-label="Passar"
        >
          <X className="size-6" />
        </button>
        <button
          onClick={() => act("right")}
          disabled={!deck.length}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-40"
          aria-label="Quero conhecer"
        >
          <Heart className="size-6" />
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {seen} de {places.length} lugares vistos · {favorites.length} favoritos
      </p>

      {favoritePlaces.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-base font-semibold text-foreground">Seus favoritos</h2>
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {favoritePlaces.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </section>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-card p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detail.photoUrl && (
              <img
                src={detail.photoUrl}
                alt={detail.name}
                className="mb-3 max-h-56 w-full rounded-xl object-cover"
              />
            )}
            {detail.photoCredit && (
              <p className="mb-2 text-xs text-muted-foreground">{detail.photoCredit}</p>
            )}
            <h2 className="text-xl font-bold text-foreground">{detail.name}</h2>
            {detail.description && <p className="mt-2 text-sm text-foreground">{detail.description}</p>}
            <button
              onClick={() => setDetail(null)}
              className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
