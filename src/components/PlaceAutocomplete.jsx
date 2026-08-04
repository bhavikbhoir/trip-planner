import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

// Free, no-key place search via Photon (photon.komoot.io) — an autocomplete-
// tuned geocoder built on OpenStreetMap data, same free ecosystem as the
// itinerary map view. Plain Nominatim /search is a general geocoder, not an
// autocomplete index — it ranks a random hamlet over "Lisbon" for the query
// "Lisb" — Photon's prefix/edge-ngram matching is built for exactly this.
const SEARCH_URL = 'https://photon.komoot.io/api/'
const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 3

function formatPlace(props) {
  const parts = [props.name]
  if (props.state && props.state !== props.name) parts.push(props.state)
  if (props.country && props.country !== props.name) parts.push(props.country)
  return parts.filter(Boolean).join(', ')
}

export default function PlaceAutocomplete({ id, value, onChange, placeholder, required }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => setQuery(value || ''), [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function search(q) {
    clearTimeout(debounceRef.current)
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&limit=5`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('search failed')
        const data = await res.json()
        const places = (data.features || [])
          .map((f) => ({
            id: f.properties.osm_id,
            label: formatPlace(f.properties),
            lat: f.geometry?.coordinates?.[1],
            lng: f.geometry?.coordinates?.[0],
          }))
          .filter((p) => p.label)
        setSuggestions(places)
        setIsOpen(true)
        setActiveIndex(-1)
      } catch {
        // Network hiccup or rate limit — fail quietly, it's still a free-text field
      }
    }, DEBOUNCE_MS)
  }

  function handleInputChange(e) {
    const next = e.target.value
    setQuery(next)
    onChange(next)
    search(next)
  }

  function selectPlace(place) {
    setQuery(place.label)
    onChange(place.label)
    setSuggestions([])
    setIsOpen(false)
  }

  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectPlace(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="autocomplete-wrap" ref={wrapRef}>
      <div className="field-input">
        <Icon name="pin" />
        <input
          id={id}
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-list" id={`${id}-listbox`} role="listbox">
          {suggestions.map((place, i) => (
            <li
              key={place.id}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`autocomplete-item${i === activeIndex ? ' active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                selectPlace(place)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <Icon name="pin" />
              <span>{place.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
