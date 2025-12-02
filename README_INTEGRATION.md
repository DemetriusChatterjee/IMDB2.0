# Movie Recommender - UI Integration

This project integrates a React frontend with a Flask backend that uses ChromaDB for AI-powered movie recommendations.

## Setup Instructions

### 1. Install Python Dependencies

First, install the required Python packages:

```bash
pip install flask flask-cors chromadb sentence-transformers pandas scikit-learn
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Verify Database

Make sure the ChromaDB database exists in `Data/trailer_db/` with the collections:
- `db_narrative` - Contains text analysis from Gemini
- `db_visuals` - Contains visual features from CLIP
- `db_audio` - Contains audio features

### 4. Run the Application

#### Option 1: Run Both Services Separately

Terminal 1 (Backend):
```bash
python backend_api.py
```

Terminal 2 (Frontend):
```bash
npm run dev
```

#### Option 2: Using the Package Scripts

Backend:
```bash
npm run backend
```

Frontend (in another terminal):
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Features Implemented

### Backend API (`backend_api.py`)

- **GET /api/movies** - Returns all movies from the ChromaDB
- **GET /api/recommend/{movie_title}** - Returns AI-powered recommendations
- **GET /api/search?q={query}** - Semantic search using sentence transformers
- **GET /api/health** - Health check endpoint

### Frontend Features

- **Movie Search** - Real-time search with both local fuzzy search and API-based semantic search
- **Movie Selection** - Click on any movie to see it highlighted
- **AI Recommendations** - Click a movie to get recommendations based on:
  - Narrative similarity (60% weight) from Gemini analysis
  - Visual similarity (40% weight) from CLIP features
- **Explanation Tags** - Shows why movies were recommended (visual, narrative, thematic similarity)
- **YouTube Integration** - Links to movie trailers on YouTube

### Data Flow

1. **Movie Data**: Loaded from `Data/movie_trailers.csv` for basic metadata
2. **AI Analysis**: Retrieved from ChromaDB collections containing:
   - Gemini-generated narrative analysis
   - CLIP visual feature vectors
   - Audio feature analysis
3. **Recommendations**: Generated using cosine similarity on multimodal embeddings

## Key Integration Changes

### Frontend Changes (`src/App.jsx`)
- Removed CSV parsing, now uses `/api/movies` endpoint
- Updated recommendation logic to call `/api/recommend/{title}`
- Removed mock data generation

### Search Enhancement (`src/components/SearchBar.jsx`)
- Hybrid search: immediate local fuzzy search + backend semantic search
- Merges results with API results prioritized

### Movie Display (`src/components/MovieCard.jsx`)
- Updated to handle both `trailer` and `youtube_link` properties
- Displays AI-generated tags explaining recommendations

### Backend Integration
- ChromaDB connection for accessing processed movie vectors
- Sentence transformer for query encoding
- Multimodal similarity scoring (narrative + visual + audio)
- Real-time tag generation based on similarity analysis

## Database Schema

The application expects ChromaDB collections with this structure:

```python
# Narrative Collection
{
    "ids": ["MovieTitle_full"],
    "embeddings": [sentence_transformer_vector],
    "metadatas": [{"title": "Movie Title", "desc": "Short description"}],
    "documents": ["Full Gemini analysis text"]
}

# Visual Collection
{
    "ids": ["MovieTitle_full"],
    "embeddings": [clip_visual_vector],
    "metadatas": [{"title": "Movie Title"}]
}

# Audio Collection
{
    "ids": ["MovieTitle_full"],
    "embeddings": [audio_feature_vector],
    "metadatas": [{"title": "Movie Title"}]
}
```

## Error Handling

- Graceful degradation if ChromaDB is unavailable
- Fallback to local search if API search fails
- Empty state handling for missing recommendations
- Console logging for debugging connection issues

## Performance Notes

- Frontend shows immediate local search results while API search loads
- Backend caches sentence transformer model on startup
- ChromaDB uses efficient vector similarity search
- Results limited to top 10 recommendations for performance