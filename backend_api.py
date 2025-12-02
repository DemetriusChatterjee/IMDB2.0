"""
Flask API for Movie Recommender Backend
Integrates with ChromaDB vector database
"""

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import chromadb
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import json
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Configuration
TRAILERS_DIR = "Data/trailers"
THUMBNAILS_DIR = "thumbnails"
DATABASE_PATH = "Data/trailer_db"
CSV_FILE = "Data/movie_trailers.csv"

# Initialize database and models
print("Connecting to ChromaDB database...")
try:
    chroma_client = chromadb.PersistentClient(path=DATABASE_PATH)
    nar_collection = chroma_client.get_collection("db_narrative")
    vis_collection = chroma_client.get_collection("db_visuals")
    aud_collection = chroma_client.get_collection("db_audio")
    print(f"✓ Connected! Found {nar_collection.count()} movies in database")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    nar_collection = None
    vis_collection = None
    aud_collection = None

# Load text model for search queries
print("Loading text model...")
try:
    text_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✓ Models loaded successfully")
except Exception as e:
    print(f"❌ Error loading text model: {e}")
    text_model = None

# Load CSV data for movie metadata
movies_data = {}
try:
    df_trailers = pd.read_csv(CSV_FILE)
    print(f"✓ Loaded {len(df_trailers)} movies from CSV")
    for _, row in df_trailers.iterrows():
        movies_data[row['Movie Title']] = {
            'title': row['Movie Title'],
            'youtube_link': row.get('YouTube Link', ''),
        }
except Exception as e:
    print(f"❌ Error loading CSV: {e}")


def get_all_movies_from_db():
    """
    Get all movies from the ChromaDB collections
    """
    if not nar_collection:
        return []

    try:
        # Get all data from narrative collection
        data = nar_collection.get(include=['metadatas', 'documents'])
        movies = []

        for i, metadata in enumerate(data['metadatas']):
            title = metadata.get('title', 'Unknown')
            movie_data = movies_data.get(title, {})

            movies.append({
                'id': title,  # Use title as ID for simplicity
                'title': title,
                'description': data['documents'][i][:200] + "..." if len(data['documents'][i]) > 200 else data['documents'][i],
                'youtube_link': movie_data.get('youtube_link', ''),
                'genres': [],  # Could be extracted from the narrative text
                'year': None,   # Could be extracted from metadata if available
                'poster': None  # Could be added if available
            })

        return movies
    except Exception as e:
        print(f"Error getting movies from database: {e}")
        return []


def generate_tags_from_analysis(source_analysis, target_analysis, similarity_score):
    """
    Generate explanation tags based on Gemini analysis (legacy function)
    """
    tags = []

    # Visual similarity based on the CLIP/visual vectors
    if similarity_score > 0.8:
        tags.append({
            "type": "visual",
            "label": "Very similar visual style and cinematography",
            "strength": float(similarity_score)
        })
    elif similarity_score > 0.6:
        tags.append({
            "type": "visual",
            "label": "Similar cinematography and visual elements",
            "strength": float(similarity_score)
        })

    # Narrative similarity based on content analysis
    if similarity_score > 0.7:
        tags.append({
            "type": "narrative",
            "label": "Similar storytelling and narrative themes",
            "strength": float(similarity_score * 0.9)
        })

    # Genre matching from analysis text
    common_keywords = []
    if source_analysis and target_analysis:
        source_words = set(source_analysis.lower().split())
        target_words = set(target_analysis.lower().split())
        common_keywords = list(source_words & target_words)

        if len(common_keywords) > 5:
            tags.append({
                "type": "theme",
                "label": f"Shared thematic elements",
                "strength": min(0.9, len(common_keywords) / 20)
            })

    # Sort by strength
    tags.sort(key=lambda x: x["strength"], reverse=True)
    return tags[:3]  # Return top 3 tags


def parse_gemini_analysis(analysis_text):
    """
    Parse the structured Gemini analysis to extract specific features
    """
    if not analysis_text:
        return {}

    features = {
        'visual_style': [],
        'narrative_arc': [],
        'audio_landscape': [],
        'emotional_vibe': []
    }

    # Parse the structured sections
    sections = {
        '[VISUAL_STYLE]': 'visual_style',
        '[NARRATIVE_ARC]': 'narrative_arc',
        '[AUDIO_LANDSCAPE]': 'audio_landscape',
        '[EMOTIONAL_VIBE]': 'emotional_vibe'
    }

    for section_marker, key in sections.items():
        if section_marker in analysis_text:
            # Find the section content
            start_idx = analysis_text.find(section_marker) + len(section_marker)
            end_idx = analysis_text.find('[', start_idx)
            if end_idx == -1:
                end_idx = len(analysis_text)

            section_content = analysis_text[start_idx:end_idx].strip()
            if section_content.startswith(':'):
                section_content = section_content[1:].strip()

            # Split by common delimiters and clean up
            items = []
            for delimiter in [',', ';']:
                if delimiter in section_content:
                    items = [item.strip() for item in section_content.split(delimiter)]
                    break

            if not items and section_content:
                items = [section_content]

            # Clean and filter items
            for item in items:
                if item and len(item.strip()) > 3:  # Filter out very short items
                    clean_item = item.strip().rstrip('.')
                    if clean_item:
                        features[key].append({
                            'type': key.replace('_', ' '),
                            'value': clean_item
                        })

    return features

def parse_analysis_features(analysis_text, analysis_type):
    """
    Parse AI analysis text to extract specific features
    """
    if not analysis_text:
        return []

    if analysis_type == 'narrative':
        # For narrative, parse the Gemini structured analysis
        parsed = parse_gemini_analysis(analysis_text)
        features = []
        for category, items in parsed.items():
            features.extend(items)
        return features

    elif analysis_type == 'visual':
        # For visual analysis, we don't have detailed text usually, so return generic info
        return [{'type': 'feature', 'value': 'CLIP visual embeddings + Color histograms'}]

    elif analysis_type == 'audio':
        # For audio analysis, we don't have detailed text usually, so return generic info
        return [{'type': 'feature', 'value': 'Tempo detection + Spectral contrast analysis'}]

    return []


def generate_multimodal_tags(similarities, weights):
    """
    Generate explanation tags based on multimodal similarity scores
    """
    tags = []

    # Narrative similarity
    if similarities['narrative'] > 0.7:
        tags.append({
            "type": "narrative",
            "label": f"Strong narrative similarity ({similarities['narrative']*100:.0f}%)",
            "strength": float(similarities['narrative'] * weights['narrative'])
        })
    elif similarities['narrative'] > 0.5:
        tags.append({
            "type": "narrative",
            "label": f"Similar storytelling themes ({similarities['narrative']*100:.0f}%)",
            "strength": float(similarities['narrative'] * weights['narrative'])
        })

    # Visual similarity
    if similarities['visual'] > 0.7:
        tags.append({
            "type": "visual",
            "label": f"Very similar visual style ({similarities['visual']*100:.0f}%)",
            "strength": float(similarities['visual'] * weights['visual'])
        })
    elif similarities['visual'] > 0.5:
        tags.append({
            "type": "visual",
            "label": f"Similar cinematography ({similarities['visual']*100:.0f}%)",
            "strength": float(similarities['visual'] * weights['visual'])
        })

    # Audio similarity
    if similarities['audio'] > 0.7:
        tags.append({
            "type": "audio",
            "label": f"Very similar audio style ({similarities['audio']*100:.0f}%)",
            "strength": float(similarities['audio'] * weights['audio'])
        })
    elif similarities['audio'] > 0.5:
        tags.append({
            "type": "audio",
            "label": f"Similar sound design ({similarities['audio']*100:.0f}%)",
            "strength": float(similarities['audio'] * weights['audio'])
        })

    # Combined weighted score
    total_weighted = sum(similarities[feature] * weights[feature] for feature in similarities.keys())
    if total_weighted > 0.8:
        tags.append({
            "type": "combined",
            "label": f"Highly recommended match ({total_weighted*100:.0f}%)",
            "strength": float(total_weighted)
        })

    # Sort by strength and return top 3
    tags.sort(key=lambda x: x["strength"], reverse=True)
    return tags[:3]


@app.route('/api/movies', methods=['GET'])
def get_movies():
    """
    Get all available movies
    """
    movies = get_all_movies_from_db()
    return jsonify(movies)


@app.route('/api/recommend/<path:movie_title>', methods=['GET', 'POST'])
def get_recommendations(movie_title):
    """
    Get recommendations for a specific movie based on multimodal similarity with custom weights
    """
    print(f"Getting recommendations for: {movie_title}")

    if not nar_collection:
        return jsonify({"error": "Database not available"}), 500

    # Get custom weights from request (POST) or use defaults (GET)
    if request.method == 'POST':
        weights = request.json.get('weights', {})
    else:
        # Parse weights from query parameters
        weights = {
            'narrative': float(request.args.get('narrative', 0.4)),
            'visual': float(request.args.get('visual', 0.35)),
            'audio': float(request.args.get('audio', 0.25))
        }

    print(f"Using weights: {weights}")

    try:
        # Get the source movie data from all collections
        source_nar = nar_collection.get(where={"title": movie_title}, include=['embeddings', 'metadatas', 'documents'])
        source_vis = vis_collection.get(where={"title": movie_title}, include=['embeddings']) if vis_collection else None
        source_aud = aud_collection.get(where={"title": movie_title}, include=['embeddings']) if aud_collection else None

        print(f"Source data found - Narrative: {len(source_nar['ids'])}, Visual: {len(source_vis['ids']) if source_vis else 0}, Audio: {len(source_aud['ids']) if source_aud else 0}")

        if not source_nar['ids']:
            print(f"Movie '{movie_title}' not found in database")
            return jsonify({"error": f"Movie '{movie_title}' not found"}), 404

        source_nar_embedding = source_nar['embeddings'][0]
        source_analysis = source_nar['documents'][0]

        # Query similar movies using narrative embeddings
        narrative_results = nar_collection.query(
            query_embeddings=[source_nar_embedding],
            n_results=20,
            include=['embeddings', 'metadatas', 'documents', 'distances']
        )

        recommendations = []

        for i, movie_id in enumerate(narrative_results['ids'][0]):
            target_title = narrative_results['metadatas'][0][i]['title']

            # Skip the source movie itself
            if target_title == movie_title:
                continue

            # Calculate multimodal similarity
            similarities = {}

            # 1. Narrative similarity
            nar_distance = narrative_results['distances'][0][i]
            similarities['narrative'] = max(0, 1 - nar_distance)

            # 2. Visual similarity
            if source_vis and len(source_vis['embeddings']) > 0 and vis_collection:
                try:
                    target_vis = vis_collection.get(where={"title": target_title}, include=['embeddings'])
                    if len(target_vis['embeddings']) > 0:
                        vis_sim = cosine_similarity([source_vis['embeddings'][0]], [target_vis['embeddings'][0]])[0][0]
                        similarities['visual'] = max(0, float(vis_sim))
                    else:
                        similarities['visual'] = 0.5
                except:
                    similarities['visual'] = 0.5
            else:
                similarities['visual'] = 0.5

            # 3. Audio similarity
            if source_aud and len(source_aud['embeddings']) > 0 and aud_collection:
                try:
                    target_aud = aud_collection.get(where={"title": target_title}, include=['embeddings'])
                    if len(target_aud['embeddings']) > 0:
                        aud_sim = cosine_similarity([source_aud['embeddings'][0]], [target_aud['embeddings'][0]])[0][0]
                        similarities['audio'] = max(0, float(aud_sim))
                    else:
                        similarities['audio'] = 0.5
                except:
                    similarities['audio'] = 0.5
            else:
                similarities['audio'] = 0.5

            # Calculate weighted similarity
            combined_similarity = (
                similarities['narrative'] * weights['narrative'] +
                similarities['visual'] * weights['visual'] +
                similarities['audio'] * weights['audio']
            )

            # Generate tags with individual similarity scores
            target_analysis = narrative_results['documents'][0][i]
            tags = generate_multimodal_tags(similarities, weights)

            # Get movie metadata
            movie_data = movies_data.get(target_title, {})

            recommendations.append({
                'id': target_title,
                'title': target_title,
                'description': target_analysis[:200] + "..." if len(target_analysis) > 200 else target_analysis,
                'youtube_link': movie_data.get('youtube_link', ''),
                'similarity': float(combined_similarity),
                'similarities': similarities,  # Individual feature similarities
                'tags': tags,
                'genres': [],
                'year': None,
                'poster': None
            })

        # Sort by similarity and return top 8
        recommendations.sort(key=lambda x: x['similarity'], reverse=True)
        result = recommendations[:8]

        print(f"Returning {len(result)} recommendations")
        return jsonify(result)

    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/analysis/<path:movie_title>', methods=['GET'])
def get_movie_analysis(movie_title):
    """
    Get detailed AI analysis for a specific movie
    """
    print(f"Getting analysis for: {movie_title}")

    if not nar_collection:
        return jsonify({"error": "Database not available"}), 500

    try:
        # Get the source movie data from all collections
        source_nar = nar_collection.get(where={"title": movie_title}, include=['embeddings', 'metadatas', 'documents'])
        source_vis = vis_collection.get(where={"title": movie_title}, include=['embeddings', 'documents']) if vis_collection else None
        source_aud = aud_collection.get(where={"title": movie_title}, include=['embeddings', 'documents']) if aud_collection else None

        if not source_nar['ids']:
            return jsonify({"error": f"Movie '{movie_title}' not found"}), 404

        # Parse features from analysis content
        narrative_content = source_nar['documents'][0] if source_nar['documents'] else None
        visual_content = source_vis['documents'][0] if source_vis and source_vis.get('documents') else None
        audio_content = source_aud['documents'][0] if source_aud and source_aud.get('documents') else None

        analysis = {
            'title': movie_title,
            'narrative': {
                'available': True,
                'content': narrative_content,
                'features': parse_analysis_features(narrative_content, 'narrative')
            },
            'visual': {
                'available': source_vis is not None and len(source_vis['ids']) > 0,
                'content': visual_content,
                'features': parse_analysis_features(visual_content, 'visual')
            },
            'audio': {
                'available': source_aud is not None and len(source_aud['ids']) > 0,
                'content': audio_content,
                'features': parse_analysis_features(audio_content, 'audio')
            }
        }

        return jsonify(analysis)

    except Exception as e:
        print(f"Error getting analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/similarity', methods=['POST'])
def get_similarity_scores():
    """
    Get similarity scores for all movies based on custom weights
    """
    data = request.json
    target_movie = data.get('movie_title')
    weights = data.get('weights', {'narrative': 0.4, 'visual': 0.35, 'audio': 0.25})

    if not target_movie or not nar_collection:
        return jsonify([])

    try:
        # Get the source movie data
        source_nar = nar_collection.get(where={"title": target_movie}, include=['embeddings'])
        source_vis = vis_collection.get(where={"title": target_movie}, include=['embeddings']) if vis_collection else None
        source_aud = aud_collection.get(where={"title": target_movie}, include=['embeddings']) if aud_collection else None

        if not source_nar['ids']:
            return jsonify([])

        # Get all movies for comparison
        all_movies = get_all_movies_from_db()
        similarity_scores = []

        for movie in all_movies:
            if movie['title'] == target_movie:
                continue

            # Calculate multimodal similarity
            similarities = {}

            # Narrative similarity
            try:
                target_nar = nar_collection.get(where={"title": movie['title']}, include=['embeddings'])
                if len(target_nar['embeddings']) > 0:
                    nar_sim = cosine_similarity([source_nar['embeddings'][0]], [target_nar['embeddings'][0]])[0][0]
                    similarities['narrative'] = max(0, float(nar_sim))
                else:
                    similarities['narrative'] = 0.5
            except:
                similarities['narrative'] = 0.5

            # Visual similarity
            if source_vis and len(source_vis['embeddings']) > 0 and vis_collection:
                try:
                    target_vis = vis_collection.get(where={"title": movie['title']}, include=['embeddings'])
                    if len(target_vis['embeddings']) > 0:
                        vis_sim = cosine_similarity([source_vis['embeddings'][0]], [target_vis['embeddings'][0]])[0][0]
                        similarities['visual'] = max(0, float(vis_sim))
                    else:
                        similarities['visual'] = 0.5
                except:
                    similarities['visual'] = 0.5
            else:
                similarities['visual'] = 0.5

            # Audio similarity
            if source_aud and len(source_aud['embeddings']) > 0 and aud_collection:
                try:
                    target_aud = aud_collection.get(where={"title": movie['title']}, include=['embeddings'])
                    if len(target_aud['embeddings']) > 0:
                        aud_sim = cosine_similarity([source_aud['embeddings'][0]], [target_aud['embeddings'][0]])[0][0]
                        similarities['audio'] = max(0, float(aud_sim))
                    else:
                        similarities['audio'] = 0.5
                except:
                    similarities['audio'] = 0.5
            else:
                similarities['audio'] = 0.5

            # Ensure all similarities have valid values
            similarities['narrative'] = similarities.get('narrative', 0.5) or 0.5
            similarities['visual'] = similarities.get('visual', 0.5) or 0.5
            similarities['audio'] = similarities.get('audio', 0.5) or 0.5

            # Calculate weighted similarity
            combined_similarity = (
                float(similarities['narrative']) * float(weights['narrative']) +
                float(similarities['visual']) * float(weights['visual']) +
                float(similarities['audio']) * float(weights['audio'])
            )

            similarity_scores.append({
                'title': movie['title'],
                'similarity': float(combined_similarity),
                'similarities': similarities
            })

        # Sort by similarity
        similarity_scores.sort(key=lambda x: x['similarity'], reverse=True)
        return jsonify(similarity_scores[:20])  # Return top 20

    except Exception as e:
        print(f"Error calculating similarities: {str(e)}")
        return jsonify([])


@app.route('/api/search', methods=['GET'])
def search_movies():
    """
    Search movies by text query
    """
    query = request.args.get('q', '')
    if not query or not text_model or not nar_collection:
        return jsonify([])

    try:
        # Encode the search query
        query_embedding = text_model.encode(query)

        # Search in the narrative collection
        results = nar_collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=10,
            include=['metadatas', 'documents', 'distances']
        )

        search_results = []
        for i, movie_id in enumerate(results['ids'][0]):
            title = results['metadatas'][0][i]['title']
            movie_data = movies_data.get(title, {})

            search_results.append({
                'id': title,
                'title': title,
                'description': results['documents'][0][i][:200] + "..." if len(results['documents'][0][i]) > 200 else results['documents'][0][i],
                'youtube_link': movie_data.get('youtube_link', ''),
                'relevance': 1 - results['distances'][0][i]  # Convert distance to relevance
            })

        return jsonify(search_results)

    except Exception as e:
        print(f"Error searching movies: {e}")
        return jsonify([])


@app.route('/api/trailers/<path:filename>', methods=['GET'])
def serve_trailer(filename):
    """
    Serve trailer video files
    """
    return send_from_directory(TRAILERS_DIR, filename)


@app.route('/api/thumbnails/<path:filename>', methods=['GET'])
def serve_thumbnail(filename):
    """
    Serve thumbnail images
    """
    return send_from_directory(THUMBNAILS_DIR, filename)


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    movie_count = nar_collection.count() if nar_collection else 0
    return jsonify({
        "status": "healthy",
        "movies_count": movie_count,
        "database_connected": nar_collection is not None,
        "text_model_loaded": text_model is not None
    })


@app.route('/', methods=['GET'])
def serve_frontend():
    """
    Serve the React frontend
    """
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>', methods=['GET'])
def serve_static_files(path):
    """
    Serve static files
    """
    return send_from_directory('.', path)


if __name__ == '__main__':
    # Create directories if they don't exist
    os.makedirs(TRAILERS_DIR, exist_ok=True)
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)

    # Run the Flask app
    print("\nStarting Flask server...")
    print("API will be available at http://localhost:5000")
    print("Frontend will be available at http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')