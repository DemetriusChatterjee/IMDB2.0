import { useState, useEffect } from 'react'
import MovieCard from './MovieCard'
import './MovieList.css'

function MovieList({ movies, selectedMovie, weights, onMovieSelect }) {
  const [similarityScores, setSimilarityScores] = useState([])
  const [loading, setLoading] = useState(false)

  // Get similarity scores when movie or weights change
  useEffect(() => {
    if (!selectedMovie) {
      setSimilarityScores([])
      return
    }

    const fetchSimilarityScores = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/similarity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movie_title: selectedMovie.title,
            weights: weights
          })
        })

        if (response.ok) {
          const scores = await response.json()
          setSimilarityScores(scores)
        }
      } catch (error) {
        console.error('Error fetching similarity scores:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarityScores()
  }, [selectedMovie, weights])

  // Merge movie data with similarity scores
  const moviesWithScores = movies.map(movie => {
    const scoreData = similarityScores.find(s => s.title === movie.title)
    return {
      ...movie,
      similarity: scoreData?.similarity || 0,
      similarities: scoreData?.similarities || { narrative: 0, visual: 0, audio: 0 }
    }
  }).filter(movie => movie.title !== selectedMovie?.title) // Exclude selected movie
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity

  if (!selectedMovie) {
    return (
      <div className="movie-list-empty">
        <h3>Select a movie to see similarity scores</h3>
        <p>Choose any movie from the search results above to see how similar other movies are with real-time AI analysis.</p>
      </div>
    )
  }

  return (
    <div className="movie-list">
      <div className="movie-list-header">
        <h3>Movies Similar to "{selectedMovie.title.split(' ').length > 7 ? selectedMovie.title.split(' ').slice(0, 7).join(' ') + '...' : selectedMovie.title}"</h3>
        <h4 className="settings-label"></h4>
      </div>


      <div className="movie-grid">
        {moviesWithScores.slice(0, 12).map(movie => (
          <div key={movie.id} className="movie-with-score">
            <MovieCard
              movie={movie}
              onSelect={() => onMovieSelect(movie)}
              showSimilarity={true}
            />

            <div className="similarity-breakdown">
              <div className="component-scores">
                <div className="component-score narrative">
                  <div className="score-bar-container">
                    <div
                      className="score-bar"
                      style={{ width: `${Math.max(movie.similarities.narrative * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="score-percentage">{Math.round(movie.similarities.narrative * 100)}%</span>
                </div>
                <div className="component-score visual">
                  <div className="score-bar-container">
                    <div
                      className="score-bar"
                      style={{ width: `${Math.max(movie.similarities.visual * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="score-percentage">{Math.round(movie.similarities.visual * 100)}%</span>
                </div>
                <div className="component-score audio">
                  <div className="score-bar-container">
                    <div
                      className="score-bar"
                      style={{ width: `${Math.max(movie.similarities.audio * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="score-percentage">{Math.round(movie.similarities.audio * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieList