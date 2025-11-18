import http.client
import json
import csv
import time
import os
from urllib.parse import quote

class IMDbAPIClient:
    def __init__(self):
        self.host = "imdb.iamidiotareyoutoo.com"
        self.base_url = ""

    def search_movie(self, query=None, imdb_id=None):
        """
        Search for a movie by title or IMDb ID
        """
        conn = http.client.HTTPSConnection(self.host)

        try:
            if imdb_id:
                # Search by IMDb ID to get detailed info
                url = f"/search?tt={imdb_id}"
            elif query:
                # Search by title
                url = f"/search?q={quote(query)}"
            else:
                return None

            conn.request("GET", url)
            res = conn.getresponse()
            data = res.read()

            if res.status == 200:
                result = json.loads(data.decode("utf-8"))
                return result
            else:
                print(f"Error searching for {query or imdb_id}: Status {res.status}")
                return None

        except Exception as e:
            print(f"Exception searching for {query or imdb_id}: {str(e)}")
            return None
        finally:
            conn.close()

    def get_poster_url(self, imdb_id):
        """
        Get poster URL for an IMDb ID
        """
        if not imdb_id or imdb_id == 'N/A':
            return None

        # The photo endpoint returns the image directly
        # We'll construct the URL that can be used in the frontend
        return f"https://{self.host}/photo/{imdb_id}"

    def get_trailer_url(self, imdb_id):
        """
        Get trailer URL for an IMDb ID
        """
        if not imdb_id or imdb_id == 'N/A':
            return None

        return f"https://{self.host}/media/{imdb_id}"


def enrich_csv_data(input_csv, output_csv):
    """
    Read the CSV, enrich data using IMDb API, and write back
    """
    client = IMDbAPIClient()

    # Read the CSV
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    print(f"Total movies to process: {len(rows)}")

    enriched_rows = []

    for idx, row in enumerate(rows):
        print(f"\nProcessing {idx + 1}/{len(rows)}: {row['Movie Title']}")

        # Check if we need to enrich this row
        needs_enrichment = (
            row.get('imdbID') == 'N/A' or
            not row.get('imdbID') or
            row.get('Year') == 'N/A' or
            row.get('Rated') == 'N/A' or
            row.get('Genre') == 'N/A'
        )

        if needs_enrichment:
            print(f"  Needs enrichment. Searching IMDb...")

            # First, try searching by IMDb ID if available
            if row.get('imdbID') and row['imdbID'] != 'N/A':
                api_result = client.search_movie(imdb_id=row['imdbID'])
            else:
                # Search by movie title
                api_result = client.search_movie(query=row['Movie Title'])

            if api_result and 'ok' in api_result and api_result['ok']:
                # For search results, take the first match
                if 'description' in api_result and api_result['description']:
                    results = api_result['description']

                    if isinstance(results, list) and len(results) > 0:
                        movie_data = results[0]
                        print(f"  Found match: {movie_data.get('#TITLE', 'Unknown')}")
                    elif isinstance(results, dict):
                        # Single result (when searching by ID)
                        movie_data = results
                        print(f"  Found details for IMDb ID")
                    else:
                        print(f"  No results found")
                        enriched_rows.append(row)
                        continue

                    # Update fields if they are N/A or missing
                    if row.get('imdbID') == 'N/A' or not row.get('imdbID'):
                        row['imdbID'] = movie_data.get('#IMDB_ID', 'N/A')

                    if row.get('Year') == 'N/A' or not row.get('Year'):
                        year = movie_data.get('#YEAR', 'N/A')
                        row['Year'] = str(year) if year != 'N/A' else 'N/A'

                    if row.get('Rated') == 'N/A' or not row.get('Rated'):
                        row['Rated'] = movie_data.get('#RANK', 'N/A')

                    if row.get('Genre') == 'N/A' or not row.get('Genre'):
                        # API might return genre differently, adjust as needed
                        row['Genre'] = movie_data.get('#GENRE', 'N/A')

                    if row.get('Plot') == 'N/A' or not row.get('Plot'):
                        row['Plot'] = movie_data.get('#STORYLINE', 'N/A')

                    if row.get('Actors') == 'N/A' or not row.get('Actors'):
                        actors = movie_data.get('#ACTORS', '')
                        if actors and isinstance(actors, str):
                            row['Actors'] = actors

                    if row.get('Director') == 'N/A' or not row.get('Director'):
                        row['Director'] = movie_data.get('#DIRECTORS', 'N/A')

                    if row.get('imdbRating') == 'N/A' or not row.get('imdbRating'):
                        rating = movie_data.get('#RATING', 'N/A')
                        row['imdbRating'] = str(rating) if rating != 'N/A' else 'N/A'

                    # Update poster URL if not present
                    if row.get('Poster') == 'N/A' or not row.get('Poster'):
                        poster = movie_data.get('#IMG_POSTER', '')
                        if poster:
                            row['Poster'] = poster
                        else:
                            # Use our API endpoint
                            if row['imdbID'] != 'N/A':
                                row['Poster'] = client.get_poster_url(row['imdbID'])

                    print(f"  ✓ Enriched with IMDb data")
                else:
                    print(f"  No description in API response")
            else:
                print(f"  API search failed or returned no results")

            # Rate limiting - be nice to the API
            time.sleep(0.5)
        else:
            print(f"  Already has data, skipping")

        # Ensure poster URL is set if we have an IMDb ID
        if row.get('imdbID') and row['imdbID'] != 'N/A':
            if row.get('Poster') == 'N/A' or not row.get('Poster'):
                row['Poster'] = client.get_poster_url(row['imdbID'])

        enriched_rows.append(row)

    # Write the enriched data back to CSV
    print(f"\n\nWriting enriched data to {output_csv}")
    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched_rows)

    print(f"✓ Done! Enriched {len(enriched_rows)} movies")


if __name__ == "__main__":
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_csv = os.path.join(script_dir, "frontend", "src", "movie_trailers_enriched.csv")
    output_csv = os.path.join(script_dir, "frontend", "src", "movie_trailers_enriched.csv")

    # You can also create a backup
    backup_csv = os.path.join(script_dir, "frontend", "src", "movie_trailers_enriched.backup.csv")

    # Create backup
    if os.path.exists(input_csv):
        import shutil
        shutil.copy(input_csv, backup_csv)
        print(f"Created backup at {backup_csv}")

    # Enrich the data
    enrich_csv_data(input_csv, output_csv)
