import { useState } from 'react'
import { Play, Pause, Info } from 'lucide-react'
import TagDisplay from './TagDisplay'
import '../styles/MovieCard.css'

function MovieCard({ movie, isSelected = false, onSelect }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const handlePlayPause = (e) => {
    e.stopPropagation()
    const video = e.currentTarget.previousElementSibling
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoPlay = () => setIsPlaying(true)
  const handleVideoPause = () => setIsPlaying(false)

  const similarityPercentage = movie.similarity
    ? Math.round(movie.similarity * 100)
    : null

  return (
    <div
      className={`movie-card ${isSelected ? 'selected' : ''} ${onSelect ? 'clickable' : ''}`}
      onClick={onSelect}
    >
      <div className="movie-card-trailer">
        {movie.poster ? (
          <div className="trailer-thumbnail">
            <img
              src={movie.poster}
              alt={`${movie.title} poster`}
              className="trailer-image"
              onError={(e) => {
                // Fallback if poster fails to load
                e.target.style.display = 'none';
              }}
            />
            {movie.trailer && (
              <a
                href={movie.trailer}
                target="_blank"
                rel="noopener noreferrer"
                className="play-button"
                onClick={(e) => e.stopPropagation()}
                aria-label="Watch trailer on YouTube"
              >
                <Play size={24} />
              </a>
            )}
          </div>
        ) : (
          <div className="trailer-placeholder">
            <span>No poster available</span>
          </div>
        )}

        {similarityPercentage && (
          <div className="similarity-badge">
            <div className="similarity-score">{similarityPercentage}%</div>
            <div className="similarity-label">match</div>
          </div>
        )}
      </div>

      <div className="movie-card-content">
        <div className="movie-header">
          <h3 className="movie-title">{movie.title}</h3>
          <button
            className="info-button"
            onClick={(e) => {
              e.stopPropagation()
              setShowInfo(!showInfo)
            }}
            aria-label="Toggle movie info"
          >
            <Info size={18} />
          </button>
        </div>

        <div className="movie-meta">
          {movie.year && <span className="movie-year">{movie.year}</span>}
          {movie.rated && movie.rated !== 'N/A' && (
            <span className="movie-rated">{movie.rated}</span>
          )}
          {movie.runtime && movie.runtime !== 'N/A' && (
            <span className="movie-runtime">{movie.runtime}</span>
          )}
          {movie.imdbRating && movie.imdbRating !== 'N/A' && (
            <span className="movie-rating">⭐ {movie.imdbRating}</span>
          )}
        </div>

        <div className="genre-pills">
          {movie.genres && movie.genres.map(genre => (
            <span key={genre} className="genre-pill">{genre}</span>
          ))}
        </div>

        {movie.director && movie.director !== 'N/A' && (
          <div className="movie-detail">
            <span className="detail-label">Director:</span>
            <span className="detail-value">{movie.director}</span>
          </div>
        )}

        {movie.actors && movie.actors !== 'N/A' && (
          <div className="movie-detail">
            <span className="detail-label">Cast:</span>
            <span className="detail-value">{movie.actors}</span>
          </div>
        )}

        {movie.language && movie.language !== 'N/A' && (
          <div className="movie-detail">
            <span className="detail-label">Language:</span>
            <span className="detail-value">{movie.language}</span>
          </div>
        )}

        {movie.country && movie.country !== 'N/A' && (
          <div className="movie-detail">
            <span className="detail-label">Country:</span>
            <span className="detail-value">{movie.country}</span>
          </div>
        )}

        {showInfo && movie.description && (
          <p className="movie-description">{movie.description}</p>
        )}

        {movie.tags && movie.tags.length > 0 && (
          <div className="movie-tags">
            <h4 className="tags-header">Why this movie?</h4>
            <TagDisplay tags={movie.tags} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MovieCard
