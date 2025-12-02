import { useState } from 'react'
import './MovieTester.css'

function MovieTester() {
  const [selectedMovie, setSelectedMovie] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [similarities, setSimilarities] = useState([])
  const [loading, setLoading] = useState(false)
  const [weights, setWeights] = useState({
    narrative: 0.4,
    visual: 0.35,
    audio: 0.25
  })

  const testMovies = [
    "The First Omen",
    "Scream",
    "Smile",
    "The Devil Inside- Official Trailer",
    "Psycho Killer",
    "Miss Peregrine's Home for Peculiar Children"
  ]

  const handleMovieTest = async (movieTitle) => {
    setSelectedMovie(movieTitle)
    setLoading(true)

    try {
      // Get analysis
      const analysisRes = await fetch(`/api/analysis/${encodeURIComponent(movieTitle)}`)
      const analysisData = await analysisRes.json()
      setAnalysis(analysisData)

      // Get similarities
      const simRes = await fetch('/api/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_title: movieTitle,
          weights: weights
        })
      })
      const simData = await simRes.json()
      setSimilarities(simData.slice(0, 8))

    } catch (error) {
      console.error('Error testing movie:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWeightChange = async (newWeights) => {
    setWeights(newWeights)

    if (selectedMovie && !loading) {
      setLoading(true)
      try {
        const simRes = await fetch('/api/similarity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movie_title: selectedMovie,
            weights: newWeights
          })
        })
        const simData = await simRes.json()
        setSimilarities(simData.slice(0, 8))
      } catch (error) {
        console.error('Error updating similarities:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="movie-tester">
      <div className="tester-header">
        <h2>🧪 Movie Vector Similarity Tester</h2>
        <p>Test how AI weights affect movie similarity scores in real-time</p>
      </div>

      {/* Movie Selection */}
      <div className="movie-selection">
        <h3>Choose a Movie to Analyze:</h3>
        <div className="movie-buttons">
          {testMovies.map(movie => (
            <button
              key={movie}
              onClick={() => handleMovieTest(movie)}
              className={`movie-btn ${selectedMovie === movie ? 'active' : ''}`}
              disabled={loading}
            >
              {movie}
            </button>
          ))}
        </div>
      </div>

      {/* Weight Controls */}
      <div className="weight-controls">
        <h3>AI Analysis Weights:</h3>
        <div className="weight-sliders">
          {Object.entries(weights).map(([type, value]) => (
            <div key={type} className="weight-control">
              <label>
                {type === 'narrative' ? '🧠' : type === 'visual' ? '👁️' : '🎵'} {type.charAt(0).toUpperCase() + type.slice(1)} ({Math.round(value * 100)}%)
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={value}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value)
                    const remaining = 1 - newValue
                    const otherTypes = Object.keys(weights).filter(t => t !== type)
                    const otherSum = otherTypes.reduce((sum, t) => sum + weights[t], 0)

                    const newWeights = { ...weights, [type]: newValue }
                    if (otherSum > 0) {
                      otherTypes.forEach(t => {
                        newWeights[t] = (weights[t] / otherSum) * remaining
                      })
                    } else {
                      const equalShare = remaining / otherTypes.length
                      otherTypes.forEach(t => {
                        newWeights[t] = equalShare
                      })
                    }
                    handleWeightChange(newWeights)
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Analyzing vectors...</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <h3>🔍 AI Analysis for "{selectedMovie}"</h3>

          {/* Narrative Analysis */}
          <div className="analysis-section">
            <h4>🧠 Narrative Analysis (Gemini AI)</h4>
            <div className="gemini-analysis">
              {analysis.narrative.features.slice(0, 6).map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-type">{feature.type}:</span>
                  <span className="feature-value">{feature.value}</span>
                </div>
              ))}
              {analysis.narrative.features.length > 6 && (
                <p className="feature-more">...and {analysis.narrative.features.length - 6} more features</p>
              )}
            </div>
          </div>

          {/* Technical Features */}
          <div className="tech-analysis">
            <div className="tech-section">
              <h4>👁️ Visual Features</h4>
              <p>✓ 512 CLIP semantic embeddings</p>
              <p>✓ 96 RGB color histogram features</p>
              <p>Available: {analysis.visual.available ? 'Yes' : 'No'}</p>
            </div>
            <div className="tech-section">
              <h4>🎵 Audio Features</h4>
              <p>✓ Tempo detection (BPM)</p>
              <p>✓ 7 spectral contrast bands</p>
              <p>Available: {analysis.audio.available ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Similarity Results */}
      {similarities.length > 0 && (
        <div className="similarity-results">
          <h3>📊 Vector Similarity Scores</h3>
          <div className="similarity-grid">
            {similarities.map((movie, index) => (
              <div key={index} className="similarity-card">
                <h4>{movie.title}</h4>
                <div className="overall-score">
                  <span className="score-label">Overall:</span>
                  <span className="score-value">{(movie.similarity * 100).toFixed(1)}%</span>
                </div>
                <div className="component-scores">
                  <div className="component-score">
                    <span className="component-label">🧠 Narrative:</span>
                    <div className="score-bar">
                      <div
                        className="score-fill narrative-fill"
                        style={{ width: `${movie.similarities.narrative * 100}%` }}
                      ></div>
                      <span className="score-text">{(movie.similarities.narrative * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="component-score">
                    <span className="component-label">👁️ Visual:</span>
                    <div className="score-bar">
                      <div
                        className="score-fill visual-fill"
                        style={{ width: `${movie.similarities.visual * 100}%` }}
                      ></div>
                      <span className="score-text">{(movie.similarities.visual * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="component-score">
                    <span className="component-label">🎵 Audio:</span>
                    <div className="score-bar">
                      <div
                        className="score-fill audio-fill"
                        style={{ width: `${movie.similarities.audio * 100}%` }}
                      ></div>
                      <span className="score-text">{(movie.similarities.audio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MovieTester