import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import SearchBar from './components/SearchBar'
import MovieCard from './components/MovieCard'
import './styles/App.css'

function App() {
  const [movies, setMovies] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load movies from CSV file
  useEffect(() => {
    fetch('/movie_trailers_enriched.csv')
      .then(response => response.text())
      .then(csvData => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Transform CSV data to movie objects
            const moviesData = results.data
              .filter(row => row['Movie Title'] && row['Movie Title'] !== 'N/A')
              .map((row, index) => {
                // Parse genres
                const genres = row['Genre'] && row['Genre'] !== 'N/A'
                  ? row['Genre'].split(',').map(g => g.trim())
                  : [];

                return {
                  id: row['imdbID'] || `movie-${index}`,
                  title: row['Movie Title'],
                  year: row['Year'] !== 'N/A' ? parseInt(row['Year']) : null,
                  rated: row['Rated'],
                  trailer: row['YouTube Link'],
                  genres: genres,
                  description: row['Plot'] !== 'N/A' ? row['Plot'] : '',
                  director: row['Director'],
                  actors: row['Actors'],
                  poster: row['Poster'] !== 'N/A' ? row['Poster'] : null,
                  imdbRating: row['imdbRating'],
                  imdbID: row['imdbID'],
                  runtime: row['Runtime'],
                  language: row['Language'],
                  country: row['Country']
                };
              });

            console.log(`Loaded ${moviesData.length} movies from CSV`);
            setMovies(moviesData);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      })
      .catch(error => {
        console.error('Error loading CSV file:', error);
      });
  }, [])

  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie)
    setLoading(true)

    // This would be an API call to get recommendations based on the selected movie
    // For now, using mock data with similarity scores and tags
    try {
      // Mock API call - replace with actual endpoint
      // const response = await fetch(`/api/recommend/${movie.id}`)
      // const data = await response.json()

      // Mock recommendations with tags showing why they were recommended
      const mockRecommendations = movies
        .filter(m => m.id !== movie.id)
        .map(m => ({
          ...m,
          similarity: Math.random() * 0.3 + 0.7, // Random similarity between 0.7-1.0
          tags: generateTags(movie, m)
        }))
        .sort((a, b) => b.similarity - a.similarity)

      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTags = (sourceMovie, targetMovie) => {
    const tags = []

    // Genre matching
    const commonGenres = sourceMovie.genres.filter(g => targetMovie.genres.includes(g))
    if (commonGenres.length > 0) {
      tags.push({
        type: 'genre',
        label: `Shared genre: ${commonGenres.join(', ')}`,
        strength: commonGenres.length / Math.max(sourceMovie.genres.length, targetMovie.genres.length)
      })
    }

    // Visual similarity (this would come from the CLIP model)
    tags.push({
      type: 'visual',
      label: 'Similar cinematography',
      strength: Math.random() * 0.4 + 0.6
    })

    // Temporal similarity
    if (Math.abs(sourceMovie.year - targetMovie.year) <= 5) {
      tags.push({
        type: 'temporal',
        label: `Released around same time (${targetMovie.year})`,
        strength: 1 - Math.abs(sourceMovie.year - targetMovie.year) / 5
      })
    }

    // Theme matching (would come from AI analysis)
    tags.push({
      type: 'theme',
      label: 'Similar storytelling themes',
      strength: Math.random() * 0.3 + 0.5
    })

    return tags.sort((a, b) => b.strength - a.strength)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Movie Recommender</h1>
        <p className="subtitle">Discover movies through trailer analysis</p>
      </header>

      <main className="app-main">
        <SearchBar
          movies={movies}
          onMovieSelect={handleMovieSelect}
        />

        {selectedMovie && (
          <div className="selected-movie-section">
            <h2>Selected Movie</h2>
            <MovieCard
              movie={selectedMovie}
              isSelected={true}
            />
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing trailer and finding recommendations...</p>
          </div>
        )}

        {!loading && recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>Recommended Movies</h2>
            <p className="recommendations-subtitle">
              Based on trailer analysis of "{selectedMovie?.title}"
            </p>
            <div className="movie-grid">
              {recommendations.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={() => handleMovieSelect(movie)}
                />
              ))}
            </div>
          </div>
        )}

        {!selectedMovie && !loading && (
          <div className="empty-state">
            <p>Search for a movie to get started</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
