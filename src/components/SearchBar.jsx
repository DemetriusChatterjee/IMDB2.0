import { useState, useEffect, useRef } from 'react'
import Fuse from 'fuse.js'
import { SearchIcon, CloseIcon } from './CustomIcons'
import '../styles/SearchBar.css'

function SearchBar({ movies, onMovieSelect, onReset }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  const getYouTubeThumbnail = (url) => {
    if (!url) return null

    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    if (match && match[2].length === 11) {
      const videoId = match[2]
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }

    return null
  }

  // Configure Fuse.js for fuzzy searching
  const fuse = new Fuse(movies, {
    keys: [
      { name: 'title', weight: 0.8 },
      { name: 'description', weight: 0.2 }
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2
  })

  useEffect(() => {
    if (query.length >= 2) {
      // First try local fuzzy search for immediate feedback
      const localResults = fuse.search(query).map(result => result.item)
      setResults(localResults)
      setIsOpen(true)
      setSelectedIndex(-1)

      // Then search using the API for more relevant results
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(apiResults => {
          if (apiResults && apiResults.length > 0) {
            // Use API results directly since they're more relevant
            setResults(apiResults.slice(0, 10))
          } else {
            // Fallback to local results if API returns nothing
            setResults(localResults.slice(0, 10))
          }
        })
        .catch(error => {
          console.error('API search failed, using local results:', error)
          // Keep local results if API fails
          setResults(localResults.slice(0, 10))
        })
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query, movies])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        } else if (results[0]) {
          handleSelect(results[0])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (movie) => {
    onMovieSelect(movie)
    setQuery(movie.title)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
    if (onReset) {
      onReset()
    }
  }

  const highlightMatch = (text, query) => {
    if (!query) return text

    const parts = []
    const regex = new RegExp(`(${query.split('').join('|')})`, 'gi')
    const matches = text.match(regex) || []

    let lastIndex = 0
    text.split(regex).forEach((part, i) => {
      if (part) {
        const isMatch = matches.includes(part)
        parts.push(
          isMatch ? (
            <mark key={i}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )
      }
    })

    return parts.length > 0 ? parts : text
  }

  return (
    <div className="search-bar" ref={searchRef}>
      <div className="search-input-wrapper">
        <SearchIcon className="search-icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search for movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {query && (
          <button
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          <div className="search-results-header">
            Found {results.length} {results.length === 1 ? 'movie' : 'movies'}
          </div>
          <ul className="search-results-list">
            {results.map((movie, index) => (
              <li
                key={movie.id}
                className={`search-result-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleSelect(movie)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="result-thumbnail">
                  {getYouTubeThumbnail(movie.youtube_link || movie.trailer) ? (
                    <img
                      src={getYouTubeThumbnail(movie.youtube_link || movie.trailer)}
                      alt={movie.title}
                      className="thumbnail-image"
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      🎬
                    </div>
                  )}
                </div>
                <div className="result-content">
                  <div className="result-title">
                    {highlightMatch(movie.title, query)}
                  </div>
                  <div className="result-meta">
                    {movie.year && <span className="result-year">{movie.year}</span>}
                    {movie.genres && movie.genres.length > 0 && (
                      <span className="result-genres">
                        {movie.genres.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="search-results">
          <div className="no-results">
            No movies found for "{query}"
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
