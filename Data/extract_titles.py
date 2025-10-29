import yt_dlp
import csv
import logging
from pretty_print import pp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def get_official_trailers(channel_url: str, seen_movies: set, limit: int = 100):
    """Get official trailers from a channel, excluding already seen movies."""
    
    # Add /videos to get the videos tab directly
    if not channel_url.endswith('/videos'):
        channel_url = channel_url.rstrip('/') + '/videos'
    
    ydl_opts = {
        "extract_flat": "in_playlist",
        "quiet": True,
        "no_warnings": True,
        "ignoreerrors": True,
    }
    
    trailers = []
    
    try:
        logger.info(f"Fetching videos from: {channel_url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)
            
            entries = info.get("entries", [])
            
            if not entries:
                pp.warning("No videos found.")
                return trailers
            
            pp.info(f"Processing {len(entries)} videos from channel")
            
            # Filter for official trailers with progress bar
            with pp.scanning_bar(total=len(entries), desc="Scanning for trailers") as pbar:
                for video in entries:
                    if video:
                        title = video.get('title', '').lower()
                        
                        # Check if it's an official trailer
                        if 'official trailer' in title:
                            # Extract movie name (before the "|")
                            full_title = video.get('title', 'Unknown title')
                            movie_name = full_title.split('|')[0].strip()
                            
                            # Only add if we haven't seen this movie yet
                            if movie_name not in seen_movies:
                                seen_movies.add(movie_name)
                                trailers.append({
                                    'title': full_title,
                                    'id': video.get('id', 'Unknown ID'),
                                    'movie': movie_name
                                })
                                pbar.set_postfix({"Found": len(trailers)})
                                
                                # Stop if we have enough trailers
                                if len(trailers) >= limit:
                                    pbar.update(len(entries) - pbar.n)
                                    break
                    
                    pbar.update(1)
                    
    except Exception as e:
        pp.error(f"Error fetching trailers: {e}")
        logger.error(f"Error fetching trailers: {e}")
    
    return trailers

def save_to_csv(trailers: list, filename: str = "movie_trailers.csv"):
    """Save trailers to a CSV file."""
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Movie Title', 'YouTube Link']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for trailer in trailers:
                url = f"https://www.youtube.com/watch?v={trailer['id']}"
                
                writer.writerow({
                    'Movie Title': trailer['movie'],
                    'YouTube Link': url
                })
        
        pp.success(f"Successfully saved {len(trailers)} trailers to '{filename}'")
        logger.info(f"Successfully saved {len(trailers)} trailers to '{filename}'")
        
    except Exception as e:
        pp.error(f"Error saving to CSV: {e}")
        logger.error(f"Error saving to CSV: {e}")

def list_latest_videos_multiple_channels(channels: list, limit_per_channel: int = 100, save_csv: bool = True):
    """List official trailers from multiple channels, avoiding duplicates."""
    
    seen_movies = set()
    all_trailers = []
    
    pp.header("TRAILER COLLECTOR", "═")
    pp.info(f"Starting to fetch trailers from {len(channels)} channels")
    
    for i, channel in enumerate(channels, 1):
        pp.subheader(f"Channel {i}/{len(channels)}")
        trailers = get_official_trailers(channel, seen_movies, limit_per_channel)
        all_trailers.extend(trailers)
        pp.success(f"Found {len(trailers)} new trailers from this channel")
        pp.info(f"Total trailers collected so far: {len(all_trailers)}")
    
    if not all_trailers:
        pp.warning("No official trailers found.")
        return
    
    pp.success(f"Completed fetching. Found {len(all_trailers)} unique official trailers")
    
    # Save to CSV if requested
    if save_csv:
        pp.info("Saving to CSV...")
        save_to_csv(all_trailers)
    
    # Print summary
    pp.summary_box("SUMMARY", {
        "Total Channels": len(channels),
        "Unique Trailers Found": len(all_trailers),
        "Output File": "movie_trailers.csv"
    })
    
    pp.header("TRAILER LIST", "─")
    
    for i, trailer in enumerate(all_trailers, start=1):
        url = f"https://www.youtube.com/watch?v={trailer['id']}"
        pp.list_item(i, trailer['movie'], url)

if __name__ == "__main__":
    channels = [
        "https://www.youtube.com/@20thcenturystudios",
        "https://www.youtube.com/@paramountpictures"
    ]
    
    # Fetch ALL trailers from each channel (no artificial limit)
    list_latest_videos_multiple_channels(channels, limit_per_channel=10000, save_csv=True)