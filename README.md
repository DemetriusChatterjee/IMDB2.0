# IMDB 2.0 - Trailer Based Movie Recommender

An intelligent movie recommendation system that analyzes movie trailers using OpenAI's CLIP model to find visually and thematically similar films. Features a modern React UI with fuzzy search and explainable AI recommendations.

## Features

### Backend (Python)
- **CLIP-based Trailer Analysis**: Uses OpenAI's CLIP model to vectorize movie trailers
- **Similarity Matching**: Cosine similarity for finding related movies
- **REST API**: Flask-based API for frontend integration
- **Efficient Processing**: Frame sampling for fast trailer analysis

### Frontend (React)
- **Fuzzy Search**: Advanced search using Fuse.js
- **Trailer Display**: Integrated video player with playback controls
- **Explainable AI**: Visual tags showing why each movie was recommended:
  - Genre similarity
  - Visual/cinematography matching
  - Release year proximity
  - Thematic similarity
- **Similarity Scores**: Percentage-based match scores
- **Modern UI**: Responsive design with dark theme

## Project Structure

```
IMDB2.0/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   └── styles/          # CSS stylesheets
│   ├── package.json
│   └── README.md
├── backend_api.py           # Flask API server
├── initial.ipynb            # CLIP model exploration
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create directories for trailers:
   ```bash
   mkdir -p trailers thumbnails
   ```

4. Add your movie trailers to the `trailers/` directory

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Start Backend Server

```bash
python backend_api.py
```

The API will be available at `http://localhost:5000`

### Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The UI will be available at `http://localhost:3000`

## API Endpoints

### GET `/api/movies`
Returns all available movies

### GET `/api/recommend/:movieId`
Returns recommendations for a specific movie with similarity scores and explanation tags

### GET `/api/trailers/:filename`
Serves trailer video files

### GET `/api/thumbnails/:filename`
Serves thumbnail images

### GET `/api/health`
Health check endpoint

## How It Works

1. **Trailer Vectorization**: Each movie trailer is processed frame-by-frame using the CLIP model
2. **Feature Extraction**: Frames are sampled (one per second) and converted to embedding vectors
3. **Vector Pooling**: Frame embeddings are averaged to create a single vector per movie
4. **Similarity Calculation**: Cosine similarity is computed between movie vectors
5. **Tag Generation**: Recommendations are explained through multiple factors:
   - Genre overlap
   - Visual similarity from CLIP
   - Temporal proximity
   - Thematic matching

## Adding New Movies

1. Add the trailer video file (.mp4) to the trailers/ directory.
2. Update movie_trailers.csv with the Title and YouTube Link.
3. Run the Update Script (or the pipeline notebook). The system will:
   - Detect the new file.
   - Send it to Gemini for narrative extraction.
   - Process visuals and audio locally.
   - Add it to the ChromaDB trailer_db folder without re-processing existing movies.

```python
{
    "id": 4,
    "title": "Movie Title",
    "year": 2023,
    "trailer": "movie_title.mp4",
    "genres": ["Action", "Thriller"],
    "description": "Movie description here"
}
```

4. Restart the backend server to vectorize the new trailer

## Technology Stack

### Backend
- **Flask**: Web framework
- **ChromaDB**: Vector Database
- **Google Gemini 2.5 Flash**: google-generativeai to analyze videos
- **PyTorch**: Deep learning framework
- **Transformers (Hugging Face)**: CLIP model
- **OpenCV**: Video processing
- **scikit-learn**: Similarity calculations
- **Flask-CORS**: Cross-origin resource sharing
- **librosa**: DSP Analysis
- **moviepy**: Decoding

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **Fuse.js**: Fuzzy search
- **Lucide React**: Icons
- **CSS3**: Styling

## Performance Optimization

- Trailers are vectorized once at startup and cached in memory
- Frame sampling reduces processing time (1 frame per second)
- Frontend uses efficient fuzzy search with configurable thresholds
- Video playback is optimized with native HTML5 video

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User accounts and personalized recommendations
- [ ] Movie ratings and reviews
- [ ] Advanced filtering (year, genre, rating)
- [ ] Recommendation history
- [ ] Social features (share recommendations)
- [ ] Audio analysis for soundtrack similarity
- [ ] NLP-based plot analysis for better theme matching
- [ ] Thumbnail generation from trailers

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
