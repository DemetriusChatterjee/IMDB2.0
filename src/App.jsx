import { useState, useEffect } from "react"
import SearchBar from "./components/SearchBar"
import MovieList from "./components/MovieList"
import MovieDisplay from "./components/MovieDisplay"
import { BrainIcon, EyeIcon, AudioIcon, PopcornIcon } from "./components/CustomIcons"
import "./styles/App.css"

function App() {
  const [movies, setMovies] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [showMovieDisplay, setShowMovieDisplay] = useState(false)
  const [analysisMode, setAnalysisMode] = useState(false) // Two-stage layout
  const [weights, setWeights] = useState({
    narrative: 0.4,
    visual: 0.35,
    audio: 0.25,
  })
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load movies from API
  useEffect(() => {
    fetch("/api/movies")
      .then(res => res.json())
      .then(data => {
        console.log(`✓ Loaded ${data.length} movies`)
        setMovies(data)
      })
      .catch(err => console.error("Movie load error:", err))
  }, [])

  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie)
    setAnalysisMode(true)
    setLoading(true)

    try {
      // Fetch movie analysis
      const analysisRes = await fetch(`/api/analysis/${encodeURIComponent(movie.title)}`)
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json()
        setAnalysis(analysisData)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenMovieDisplay = () => {
    setShowMovieDisplay(true)
  }

  const handleCloseMovieDisplay = () => {
    setShowMovieDisplay(false)
  }

  const handleBackToSearch = () => {
    setAnalysisMode(false)
    setSelectedMovie(null)
    setAnalysis(null)
  }

  const handleWeightChange = (newWeights) => {
    setWeights(newWeights)
  }

  const getYouTubeThumbnail = (url) => {
    if (!url) return null

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    if (match && match[2].length === 11) {
      const videoId = match[2]
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }

    return null
  }

  return (
    <div className={`app ${analysisMode ? 'analysis-mode' : 'search-mode'}`}>
      {!analysisMode ? (
        // Stage 1: Centered search mode
        <div key="search-stage" className="search-stage">
          <main className="centered-search">
            <header className="app-header">
              <h1>CineAI</h1>
              <p className="subtitle">Discover movies with AI-powered similarity analysis</p>
            </header>
            <SearchBar movies={movies} onMovieSelect={handleMovieSelect} />
          </main>
          <div className="popcorn-decorations">
            <PopcornIcon className="popcorn-left" size={64} />
            <PopcornIcon className="popcorn-right" size={64} />
          </div>
        </div>
      ) : (
        // Stage 2: Analysis mode with left/right layout
        <div key="analysis-stage" className="analysis-stage">
          <header className="analysis-header">
            <div className="header-search">
              <SearchBar movies={movies} onMovieSelect={handleMovieSelect} onReset={handleBackToSearch} />
            </div>
          </header>

          <main className="analysis-main">
            {/* Left Panel - Controls and Movie Preview */}
            <div className="left-panel">
              <div className="selected-movie-preview">
                {selectedMovie && (
                  <div className="movie-preview-card">
                    <div className="movie-thumbnail">
                      {getYouTubeThumbnail(selectedMovie.youtube_link || selectedMovie.trailer) ? (
                        <img
                          src={getYouTubeThumbnail(selectedMovie.youtube_link || selectedMovie.trailer)}
                          alt={selectedMovie.title}
                          className="thumbnail-image"
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <span className="placeholder-icon">🎬</span>
                        </div>
                      )}
                    </div>
                    <h3>{selectedMovie.title}</h3>
                    <div className="preview-actions">
                      <button
                        className="view-details-btn"
                        onClick={handleOpenMovieDisplay}
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Weight Controls */}
              <div className="weight-controls-section">
                <h3>AI Analysis Weights</h3>
                <div className="weight-sliders">
                  <div className="weight-slider narrative">
                    <label>
                      <span className="weight-icon"><BrainIcon size={20} /></span> Narrative ({Math.round(weights.narrative * 100)}%)
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights.narrative}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value)
                          const remaining = 1 - newValue
                          const visualRatio = weights.visual / (weights.visual + weights.audio)
                          handleWeightChange({
                            narrative: newValue,
                            visual: remaining * visualRatio,
                            audio: remaining * (1 - visualRatio)
                          })
                        }}
                      />
                    </label>
                  </div>

                  <div className="weight-slider visual">
                    <label>
                      <span className="weight-icon"><EyeIcon size={20} /></span> Visual ({Math.round(weights.visual * 100)}%)
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights.visual}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value)
                          const remaining = 1 - newValue
                          const narrativeRatio = weights.narrative / (weights.narrative + weights.audio)
                          handleWeightChange({
                            visual: newValue,
                            narrative: remaining * narrativeRatio,
                            audio: remaining * (1 - narrativeRatio)
                          })
                        }}
                      />
                    </label>
                  </div>

                  <div className="weight-slider audio">
                    <label>
                      <span className="weight-icon"><AudioIcon size={20} /></span> Audio ({Math.round(weights.audio * 100)}%)
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights.audio}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value)
                          const remaining = 1 - newValue
                          const narrativeRatio = weights.narrative / (weights.narrative + weights.visual)
                          handleWeightChange({
                            audio: newValue,
                            narrative: remaining * narrativeRatio,
                            visual: remaining * (1 - narrativeRatio)
                          })
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Analysis Display */}
              {analysis && (
                <div className="analysis-display">
                  <h3>AI Analysis</h3>
                  {loading ? (
                    <div className="analysis-loading">Analyzing...</div>
                  ) : (
                    <div className="analysis-content">
                      {analysis.visual_style && (
                        <div className="analysis-section">
                          <h4>Visual Style</h4>
                          <p>{analysis.visual_style}</p>
                        </div>
                      )}
                      {analysis.narrative_arc && (
                        <div className="analysis-section">
                          <h4>Narrative Arc</h4>
                          <p>{analysis.narrative_arc}</p>
                        </div>
                      )}
                      {analysis.audio_landscape && (
                        <div className="analysis-section">
                          <h4>Audio Landscape</h4>
                          <p>{analysis.audio_landscape}</p>
                        </div>
                      )}
                      {analysis.emotional_vibe && (
                        <div className="analysis-section">
                          <h4>Emotional Vibe</h4>
                          <p>{analysis.emotional_vibe}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Recommendations */}
            <div className="right-panel">
              <MovieList
                movies={movies}
                selectedMovie={selectedMovie}
                weights={weights}
                onMovieSelect={handleMovieSelect}
              />
            </div>
          </main>
          <div className="popcorn-decorations">
            <PopcornIcon className="popcorn-left" size={48} />
            <PopcornIcon className="popcorn-right" size={48} />
          </div>
        </div>
      )}

      {/* Movie Display Modal */}
      {showMovieDisplay && selectedMovie && (
        <MovieDisplay
          movie={selectedMovie}
          onClose={handleCloseMovieDisplay}
        />
      )}
    </div>
  )
}

export default App
