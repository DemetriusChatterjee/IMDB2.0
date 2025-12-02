import csv
import requests
import time
from urllib.parse import quote

def fetch_movie_data(movie_title, api_key):
    """
    Fetch movie data from OMDB API
    """
    # URL encode the movie title
    encoded_title = quote(movie_title)
    url = f"https://www.omdbapi.com/?t={encoded_title}&apikey={api_key}"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Check if the response was successful
        if data.get('Response') == 'True':
            return data
        else:
            print(f"Movie not found: {movie_title} - {data.get('Error', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {movie_title}: {e}")
        return None

def extract_movie_details(data):
    """
    Extract relevant fields from OMDB API response
    """
    if not data:
        return {
            'Year': 'N/A',
            'Rated': 'N/A',
            'Released': 'N/A',
            'Runtime': 'N/A',
            'Genre': 'N/A',
            'Director': 'N/A',
            'Writer': 'N/A',
            'Actors': 'N/A',
            'Plot': 'N/A',
            'Language': 'N/A',
            'Country': 'N/A',
            'Awards': 'N/A',
            'Poster': 'N/A',
            'Metascore': 'N/A',
            'imdbRating': 'N/A',
            'imdbVotes': 'N/A',
            'imdbID': 'N/A',
            'Type': 'N/A',
            'totalSeasons': 'N/A'
        }

    return {
        'Year': data.get('Year', 'N/A'),
        'Rated': data.get('Rated', 'N/A'),
        'Released': data.get('Released', 'N/A'),
        'Runtime': data.get('Runtime', 'N/A'),
        'Genre': data.get('Genre', 'N/A'),
        'Director': data.get('Director', 'N/A'),
        'Writer': data.get('Writer', 'N/A'),
        'Actors': data.get('Actors', 'N/A'),
        'Plot': data.get('Plot', 'N/A'),
        'Language': data.get('Language', 'N/A'),
        'Country': data.get('Country', 'N/A'),
        'Awards': data.get('Awards', 'N/A'),
        'Poster': data.get('Poster', 'N/A'),
        'Metascore': data.get('Metascore', 'N/A'),
        'imdbRating': data.get('imdbRating', 'N/A'),
        'imdbVotes': data.get('imdbVotes', 'N/A'),
        'imdbID': data.get('imdbID', 'N/A'),
        'Type': data.get('Type', 'N/A'),
        'totalSeasons': data.get('totalSeasons', 'N/A')
    }

def process_csv(input_file, output_file, api_key):
    """
    Read the CSV, fetch movie data, and write enriched CSV
    """
    # Read the original CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Process each movie
    enriched_rows = []
    total_movies = len(rows)

    for idx, row in enumerate(rows, 1):
        movie_title = row['Movie Title']
        print(f"Processing {idx}/{total_movies}: {movie_title}")

        # Fetch movie data from OMDB API
        movie_data = fetch_movie_data(movie_title, api_key)
        details = extract_movie_details(movie_data)

        # Combine original row with new details
        enriched_row = {**row, **details}
        enriched_rows.append(enriched_row)

        # Add a small delay to avoid hitting API rate limits
        time.sleep(0.5)  # 500ms delay between requests

    # Write the enriched CSV
    if enriched_rows:
        fieldnames = list(enriched_rows[0].keys())

        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(enriched_rows)

        print(f"\n✓ Successfully processed {total_movies} movies!")
        print(f"✓ Enriched CSV saved to: {output_file}")
    else:
        print("No rows to write!")

if __name__ == "__main__":
    # Configuration
    API_KEY = "f0a2cf45"
    INPUT_FILE = "movie_trailers.csv"
    OUTPUT_FILE = "movie_trailers_enriched.csv"

    print("=" * 60)
    print("OMDB API Movie Data Crawler")
    print("=" * 60)
    print(f"Input file: {INPUT_FILE}")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"API Key: {API_KEY}")
    print("=" * 60)
    print()

    process_csv(INPUT_FILE, OUTPUT_FILE, API_KEY)
