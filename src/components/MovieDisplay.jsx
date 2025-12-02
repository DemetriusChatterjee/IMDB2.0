import { useState } from 'react'
import { CloseIcon } from './CustomIcons'
import './MovieDisplay.css'

function MovieDisplay({ movie, onClose }) {
    const [showTrailer, setShowTrailer] = useState(false)

    const getYouTubeThumbnail = (url) => {
        if (!url) return null

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)

        if (match && match[2].length === 11) {
            const videoId = match[2]
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }

        return null
    }

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)

        if (match && match[2].length === 11) {
            const videoId = match[2]
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
        }

        return null
    }

    const handleCoverClick = () => {
        if (movie.youtube_link || movie.trailer) {
            setShowTrailer(true)
        }
    }

    return (
        <div className="movie-display-overlay" onClick={onClose}>
            <div className="movie-display-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    <CloseIcon size={24} />
                </button>

                {showTrailer && (movie.youtube_link || movie.trailer) ? (
                    <div className="trailer-container">
                        <iframe
                            src={getYouTubeEmbedUrl(movie.youtube_link || movie.trailer)}
                            title={`${movie.title} Trailer`}
                            className="trailer-iframe"
                            frameBorder="0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                        <button
                            className="back-to-cover"
                            onClick={() => setShowTrailer(false)}
                        >
                            ← Back to Cover
                        </button>
                    </div>
                ) : (
                    <div className="movie-info">
                        <div className="movie-cover" onClick={handleCoverClick}>
                            {getYouTubeThumbnail(movie.youtube_link || movie.trailer) ? (
                                <>
                                    <img
                                        src={getYouTubeThumbnail(movie.youtube_link || movie.trailer)}
                                        alt={movie.title}
                                        className="cover-image"
                                    />
                                    {(movie.youtube_link || movie.trailer) && (
                                        <div className="play-overlay">
                                            <div className="play-button">
                                                ▶
                                            </div>
                                            <p>Click to watch trailer</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="cover-placeholder">
                                    <div className="placeholder-icon">🎬</div>
                                    <p>{movie.title}</p>
                                    <p className="no-trailer">No trailer available</p>
                                </div>
                            )}
                        </div>

                        <div className="movie-details">
                            <h1 className="movie-title">{movie.title}</h1>

                            {movie.year && (
                                <div className="movie-year">
                                    📅 {movie.year}
                                </div>
                            )}

                            {movie.genres && movie.genres.length > 0 && (
                                <div className="movie-genres">
                                    <span className="genre-label">🎭 Genres:</span>
                                    <div className="genre-tags">
                                        {movie.genres.map((genre, index) => (
                                            <span key={index} className="genre-tag">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {movie.description && (
                                <div className="movie-description">
                                    <h3>📖 Description</h3>
                                    <p>{movie.description}</p>
                                </div>
                            )}

                            <div className="movie-actions">
                                {(movie.youtube_link || movie.trailer) && (
                                    <button
                                        className="watch-trailer-btn"
                                        onClick={() => setShowTrailer(true)}
                                    >
                                        🎬 Watch Trailer
                                    </button>
                                )}

                                {(movie.youtube_link || movie.trailer) && (
                                    <a
                                        href={movie.youtube_link || movie.trailer}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="external-link-btn"
                                    >
                                        🔗 Open in YouTube
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MovieDisplay