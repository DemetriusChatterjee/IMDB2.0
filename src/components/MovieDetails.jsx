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
                    <div className="analysis-content">
                      <p><strong>🧠 Gemini AI analyzed this trailer:</strong></p>

                      <div className="analysis-sections">
                        {/* Group features by type */}
                        {['visual style', 'narrative arc', 'audio landscape', 'emotional vibe'].map(type => {
                          const typeFeatures = analysis.narrative.features.filter(f => f.type === type)
                          if (typeFeatures.length === 0) return null

                          const typeIcons = {
                            'visual style': '🎨',
                            'narrative arc': '📚',
                            'audio landscape': '🎵',
                            'emotional vibe': '💭'
                          }

                          return (
                            <div key={type} className="analysis-section">
                              <h5>{typeIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                              <div className="feature-pills">
                                {typeFeatures.slice(0, 3).map((feature, index) => ( // Limit to 3 per section
                                  <span key={index} className={`feature-pill ${type.replace(' ', '-')}`}>
                                    {feature.value}
                                  </span>
                                ))}
                                {typeFeatures.length > 3 && (
                                  <span className="feature-pill-more">+{typeFeatures.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-features">No narrative analysis available</p>
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
                  <div className="detected-features">
                    <p><strong>👁️ CLIP + Computer Vision extracted:</strong></p>
                    <div className="technical-features">
                      <div className="tech-feature">
                        <span className="tech-label">CLIP Embeddings:</span>
                        <span className="tech-value">512 semantic visual features</span>
                      </div>
                      <div className="tech-feature">
                        <span className="tech-label">Color Histograms:</span>
                        <span className="tech-value">RGB channel analysis (96 features)</span>
                      </div>
                      <div className="tech-feature">
                        <span className="tech-label">Frame Analysis:</span>
                        <span className="tech-value">Sampled at 1 FPS for full trailer</span>
                      </div>
                    </div>
                  </div>
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
                  <div className="detected-features">
                    <p><strong>🎵 Librosa Audio Analysis extracted:</strong></p>
                    <div className="technical-features">
                      <div className="tech-feature">
                        <span className="tech-label">Tempo Detection:</span>
                        <span className="tech-value">BPM analysis using onset detection</span>
                      </div>
                      <div className="tech-feature">
                        <span className="tech-label">Spectral Contrast:</span>
                        <span className="tech-value">7 frequency band contrasts</span>
                      </div>
                      <div className="tech-feature">
                        <span className="tech-label">Audio Processing:</span>
                        <span className="tech-value">Full trailer audio analysis</span>
                      </div>
                    </div>
                  </div>
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