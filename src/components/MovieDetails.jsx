import { useState, useEffect } from 'react'
import './MovieDetails.css'

function MovieDetails({ movie, onGetRecommendations, onBack, weights }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load movie analysis when component mounts
  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/analysis/${encodeURIComponent(movie.title)}`)
        if (response.ok) {
          const analysisData = await response.json()
          setAnalysis(analysisData)
        } else {
          console.error('Failed to fetch analysis:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [movie.title])

  const getYouTubeThumbnail = (url) => {
    if (!url) return null

    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    if (match && match[2].length === 11) {
      const videoId = match[2]
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }

    return null
  }

  const handleGetRecommendations = () => {
    onGetRecommendations(movie, weights)
  }

  return (
    <div className="movie-details">
      <div className="movie-details-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Search
        </button>
        <h1>Movie Analysis</h1>
      </div>

      <div className="movie-details-content">
        <div className="movie-info-section">
          <div className="movie-poster-large">
            {movie.youtube_link ? (
              <img
                src={getYouTubeThumbnail(movie.youtube_link)}
                alt={movie.title}
                className="poster-image"
              />
            ) : (
              <div className="poster-placeholder">
                <span>🎬</span>
              </div>
            )}
          </div>

          <div className="movie-metadata">
            <h2>{movie.title}</h2>
            <p className="movie-description">{movie.description}</p>

            {movie.youtube_link && (
              <a
                href={movie.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="trailer-link"
              >
                🎬 Watch Trailer
              </a>
            )}
          </div>
        </div>

        <div className="analysis-section">
          <h3>AI Analysis Results</h3>

          {loading ? (
            <div className="analysis-loading">
              <div className="spinner-small"></div>
              <p>Analyzing movie features...</p>
            </div>
          ) : analysis ? (
            <div className="feature-grid">
              {/* Narrative Analysis */}
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">🧠</div>
                  <h4>Narrative Analysis</h4>
                  <div className="weight-display">
                    Weight: {Math.round(weights.narrative * 100)}%
                  </div>
                </div>

                {analysis.narrative.features.length > 0 ? (
                  <div className="detected-features">
                    <p><strong>Detected themes:</strong></p>
                    <div className="feature-tags">
                      {analysis.narrative.features.map((feature, index) => (
                        <span key={index} className="feature-tag theme-tag">
                          {feature.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="no-features">No specific narrative themes detected</p>
                )}
              </div>

              {/* Visual Analysis */}
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">👁️</div>
                  <h4>Visual Analysis</h4>
                  <div className="weight-display">
                    Weight: {Math.round(weights.visual * 100)}%
                  </div>
                </div>

                {analysis.visual.available ? (
                  analysis.visual.features.length > 0 ? (
                    <div className="detected-features">
                      <p><strong>Visual style detected:</strong></p>
                      <div className="feature-tags">
                        {analysis.visual.features.map((feature, index) => (
                          <span
                            key={index}
                            className={`feature-tag ${feature.type === 'color' ? 'color-tag' : 'lighting-tag'}`}
                          >
                            {feature.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="no-features">Visual analysis available but no specific features detected</p>
                  )
                ) : (
                  <p className="not-available">Visual analysis not available for this movie</p>
                )}
              </div>

              {/* Audio Analysis */}
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">🎵</div>
                  <h4>Audio Analysis</h4>
                  <div className="weight-display">
                    Weight: {Math.round(weights.audio * 100)}%
                  </div>
                </div>

                {analysis.audio.available ? (
                  analysis.audio.features.length > 0 ? (
                    <div className="detected-features">
                      <p><strong>Audio style detected:</strong></p>
                      <div className="feature-tags">
                        {analysis.audio.features.map((feature, index) => (
                          <span key={index} className="feature-tag music-tag">
                            {feature.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="no-features">Audio analysis available but no specific features detected</p>
                  )
                ) : (
                  <p className="not-available">Audio analysis not available for this movie</p>
                )}
              </div>
            </div>
          ) : (
            <div className="analysis-error">
              <p>Unable to load analysis data</p>
            </div>
          )}
        </div>


        <div className="action-section">
          <button
            className="get-recommendations-btn"
            onClick={handleGetRecommendations}
          >
            Get AI Recommendations
          </button>
        </div>
      </div>
    </div>
  )
}

export default MovieDetails