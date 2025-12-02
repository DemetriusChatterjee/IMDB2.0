import { useState } from 'react'
import { Play, Pause, Info } from 'lucide-react'
import TagDisplay from './TagDisplay'
import StarRating from './StarRating'
import { formatGeminiAnalysis } from '../utils/textFormatting'
import '../styles/MovieCard.css'

// Function to extract YouTube video ID and generate thumbnail URL
const getYouTubeThumbnail = (url) => {
  if (!url) return null

  // Extract video ID from various YouTube URL formats
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)

  if (match) {
    const videoId = match[1]
    // Use high quality thumbnail (hqdefault) or maxresdefault for best quality
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }

  return null
}

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
        <div className="trailer-thumbnail">
          {(movie.trailer || movie.youtube_link) ? (
            <>
              <img
                src={getYouTubeThumbnail(movie.trailer || movie.youtube_link)}
                alt={`${movie.title} thumbnail`}
                className="trailer-image"
                onError={(e) => {
                  // Fallback if thumbnail fails to load
                  e.target.src = `https://via.placeholder.com/320x180/333/fff?text=${encodeURIComponent(movie.title.substring(0, 20))}`;
                }}
              />
              <a
                href={movie.trailer || movie.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="play-button"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('Opening trailer:', movie.trailer || movie.youtube_link)
                }}
                aria-label="Watch trailer on YouTube"
              >
                <Play size={24} />
              </a>
            </>
          ) : (
            <div className="movie-placeholder">
              <h3 className="placeholder-title">{movie.title}</h3>
              {movie.description && (
                <p className="placeholder-description">
                  {movie.description.substring(0, 120)}...
                </p>
              )}
            </div>
          )}
        </div>

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
          {(movie.imdb_rating || movie.imdbRating) && (movie.imdb_rating !== 'N/A' && movie.imdbRating !== 'N/A') && (
            <div className="movie-rating">
              <StarRating
                rating={movie.imdb_rating || movie.imdbRating}
                size={14}
                showNumber={true}
              />
            </div>
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
          <div
            className="movie-description"
            dangerouslySetInnerHTML={{
              __html: formatGeminiAnalysis(movie.description)
            }}
          />
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
