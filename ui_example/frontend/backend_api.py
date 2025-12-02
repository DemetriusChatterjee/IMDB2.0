"""
Flask API for Movie Recommender Backend
Integrates with the CLIP-based trailer vectorization system
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import torch
from transformers import CLIPProcessor, CLIPModel
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
import json

app = Flask(__name__)
CORS(app)

# Load CLIP model
print("Loading CLIP model...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("Model loaded successfully")

# Configuration
TRAILERS_DIR = "trailers"
THUMBNAILS_DIR = "thumbnails"
DATA_DIR = "Data"

# Cache for movie vectors
movie_vectors = {}
movies_database = []


def vectorize_trailer(video_path):
    """
    Vectorize a movie trailer using CLIP model
    """
    cap = cv2.VideoCapture(video_path)
    frame_vectors = []
    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(frame_rate) if frame_rate > 0 else 1

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            inputs = processor(images=rgb, return_tensors="pt")
            with torch.no_grad():
                embedding = model.get_image_features(**inputs)
            frame_vectors.append(embedding.squeeze().cpu().numpy())

        frame_idx += 1

    cap.release()

    if len(frame_vectors) == 0:
        return None

    # Mean pooling across all frames
    video_vector = np.mean(np.stack(frame_vectors), axis=0)
    return video_vector


def load_movies_database():
    """
    Load movies from database file or scan trailer directory
    """
    global movies_database, movie_vectors

    # Example movies database - replace with actual database
    movies_database = [
        {
            "id": 1,
            "title": "The Fellowship of the Ring",
            "year": 2001,
            "trailer": "fellowship_of_the_ring.mp4",
            "genres": ["Fantasy", "Adventure", "Drama"],
            "description": "A meek Hobbit and eight companions set out on a journey to destroy the One Ring and save Middle-earth from the Dark Lord Sauron."
        },
        {
            "id": 2,
            "title": "The Two Towers",
            "year": 2002,
            "trailer": "the_two_towers.mp4",
            "genres": ["Fantasy", "Adventure", "Drama"],
            "description": "While Frodo and Sam edge closer to Mordor with the help of Gollum, the divided fellowship stands against Sauron's new ally, Saruman."
        },
        {
            "id": 3,
            "title": "Manchester by the Sea",
            "year": 2016,
            "trailer": "manchester_by_the_sea.mp4",
            "genres": ["Drama"],
            "description": "A depressed uncle is asked to take care of his teenage nephew after the boy's father dies."
        }
    ]

    # Precompute vectors for all movies
    print("Precomputing movie vectors...")
    for movie in movies_database:
        trailer_path = os.path.join(TRAILERS_DIR, movie["trailer"])
        if os.path.exists(trailer_path):
            vector = vectorize_trailer(trailer_path)
            if vector is not None:
                movie_vectors[movie["id"]] = vector
                print(f"Vectorized: {movie['title']}")
        else:
            print(f"Warning: Trailer not found for {movie['title']}")

    print(f"Loaded {len(movies_database)} movies with {len(movie_vectors)} vectors")


def generate_tags(source_movie, target_movie, similarity_score):
    """
    Generate explanation tags for why a movie was recommended
    """
    tags = []

    # Genre matching
    common_genres = set(source_movie["genres"]) & set(target_movie["genres"])
    if common_genres:
        genre_strength = len(common_genres) / max(len(source_movie["genres"]), len(target_movie["genres"]))
        tags.append({
            "type": "genre",
            "label": f"Shared genre: {', '.join(common_genres)}",
            "strength": genre_strength
        })

    # Visual similarity from CLIP model
    tags.append({
        "type": "visual",
        "label": "Similar cinematography and visual style",
        "strength": float(similarity_score)
    })

    # Temporal similarity
    year_diff = abs(source_movie["year"] - target_movie["year"])
    if year_diff <= 5:
        temporal_strength = 1 - (year_diff / 5)
        tags.append({
            "type": "temporal",
            "label": f"Released around same time ({target_movie['year']})",
            "strength": temporal_strength
        })

    # Theme matching (based on similarity score - could be enhanced with NLP)
    if similarity_score > 0.75:
        tags.append({
            "type": "theme",
            "label": "Similar storytelling and narrative themes",
            "strength": float(similarity_score * 0.9)
        })

    # Sort by strength
    tags.sort(key=lambda x: x["strength"], reverse=True)
    return tags


@app.route('/api/movies', methods=['GET'])
def get_movies():
    """
    Get all available movies
    """
    return jsonify(movies_database)


@app.route('/api/recommend/<int:movie_id>', methods=['GET'])
def get_recommendations(movie_id):
    """
    Get recommendations for a specific movie based on trailer similarity
    """
    # Find the source movie
    source_movie = next((m for m in movies_database if m["id"] == movie_id), None)
    if not source_movie:
        return jsonify({"error": "Movie not found"}), 404

    if movie_id not in movie_vectors:
        return jsonify({"error": "Movie vector not available"}), 404

    source_vector = movie_vectors[movie_id]
    recommendations = []

    # Calculate similarities with all other movies
    for movie in movies_database:
        if movie["id"] == movie_id or movie["id"] not in movie_vectors:
            continue

        target_vector = movie_vectors[movie["id"]]
        similarity = cosine_similarity([source_vector], [target_vector])[0][0]

        # Generate explanation tags
        tags = generate_tags(source_movie, movie, similarity)

        recommendations.append({
            **movie,
            "similarity": float(similarity),
            "tags": tags
        })

    # Sort by similarity
    recommendations.sort(key=lambda x: x["similarity"], reverse=True)

    return jsonify(recommendations)


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
    return jsonify({
        "status": "healthy",
        "movies_count": len(movies_database),
        "vectors_count": len(movie_vectors)
    })


if __name__ == '__main__':
    # Create directories if they don't exist
    os.makedirs(TRAILERS_DIR, exist_ok=True)
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)

    # Load movies database and precompute vectors
    load_movies_database()

    # Run the Flask app
    print("\nStarting Flask server...")
    print("API will be available at http://localhost:5000")
    app.run(debug=True, port=5000)
