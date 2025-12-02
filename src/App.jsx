import { useState, useEffect } from "react"
import SearchBar from "./components/SearchBar"
import MovieCard from "./components/MovieCard"
import WeightPanel from "./components/WeightPanel"
import MovieList from "./components/MovieList"
import MovieDetails from "./components/MovieDetails"
import "./styles/App.css"

function App() {
  const [movies, setMovies] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [currentView, setCurrentView] = useState("search") // search | details
  const [loading, setLoading] = useState(false)

  // unified weighting
  const [weights, setWeights] = useState({
    narrative: 0.4,
    visual: 0.35,
    audio: 0.25,
  })

  // load movie dataset once
  useEffect(() => {
    fetch("/api/movies")
      .then(res => res.json())
      .then(data => {
        console.log(`Loaded ${data.length} movies`)
        setMovies(data)
      })
      .catch(err => console.error("Movie load error:", err))
  }, [])

  function handleMovieSelect(movie) {
    setSelectedMovie(movie)
    setCurrentView("details")
  }

  function handleBackToSearch() {
    setSelectedMovie(null)
    setCurrentView("search")
  }

  function handleWeightChange(newWeights) {
    setWeights(newWeights)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>CineAI</h1>
        <p className="subtitle">AI-powered movie similarity engine</p>
      </header>

      <main className="app-main">
        {/* SEARCH BAR visible only on search screen */}
        {currentView === "search" && (
          <SearchBar movies={movies} onMovieSelect={handleMovieSelect} />
        )}

        <div className="main-content">
          {/* LEFT COLUMN */}
          <div className="left-column">
            {/* SEARCH SCREEN */}
            {currentView === "search" && (
              <>
                {movies.length > 0 ? (
                  <MovieList
                    movies={movies}
                    weights={weights}
                    onMovieSelect={handleMovieSelect}
                  />
                ) : (
                  <div className="empty-state">
                    <h2>Loading movies...</h2>
                  </div>
                )}
              </>
            )}

            {/* DETAILS SCREEN */}
            {currentView === "details" && selectedMovie && (
              <MovieDetails
                movie={selectedMovie}
                onBack={handleBackToSearch}
                weights={weights}
              />
            )}
          </div>

          {/* RIGHT COLUMN – WEIGHT PANEL */}
          <div className="right-column">
            <WeightPanel
              onWeightChange={handleWeightChange}
              selectedMovie={selectedMovie}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
