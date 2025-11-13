import csv
import yt_dlp
import os
import logging
import time
import signal
import random
from contextlib import contextmanager
from pretty_print import pp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class TimeoutException(Exception):
    pass

@contextmanager
def timeout(seconds):
    def signal_handler(signum, frame):
        raise TimeoutException(f"Timeout after {seconds} seconds")

    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

def get_random_user_agent():
    """Return a random user agent to avoid detection."""
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ]
    return random.choice(user_agents)

def download_trailers_from_csv(csv_filename: str = "movie_trailers.csv", output_folder: str = "trailers", use_cookies: bool = False):
    """Read CSV file and download all trailers to specified folder."""
    
    pp.header("TRAILER DOWNLOADER", "═")
    
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        pp.success(f"Created output folder: {output_folder}")
        logger.info(f"Created output folder: {output_folder}")
    
    # Read CSV file
    try:
        with open(csv_filename, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            trailers = list(reader)
        
        pp.info(f"Found {len(trailers)} trailers in CSV file")
        logger.info(f"Found {len(trailers)} trailers in CSV file")
        
    except FileNotFoundError:
        pp.error(f"CSV file '{csv_filename}' not found!")
        logger.error(f"CSV file '{csv_filename}' not found!")
        return
    except Exception as e:
        pp.error(f"Error reading CSV file: {e}")
        logger.error(f"Error reading CSV file: {e}")
        return
    
    # Download each trailer
    successful = 0
    failed = 0
    
    with pp.download_bar(total=len(trailers), desc="Downloading trailers") as pbar:
        for trailer in trailers:
            movie_title = trailer.get('Movie Title', 'Unknown')
            youtube_link = trailer.get('YouTube Link', '')
            
            if not youtube_link:
                logger.warning(f"Skipping '{movie_title}' - no URL found")
                failed += 1
                pbar.update(1)
                continue
            
            # Configure yt-dlp options with anti-detection measures
            ydl_opts = {
                "outtmpl": os.path.join(output_folder, f"{movie_title}.%(ext)s"),
                "format": "95/94/93/92/91/best",
                "merge_output_format": "mp4",
                "ignoreerrors": True,
                "quiet": True,
                "no_warnings": True,
                "socket_timeout": 30,
                "fragment_retries": 3,
                "retries": 3,
                "http_headers": {
                    'User-Agent': get_random_user_agent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-us,en;q=0.5',
                    'Accept-Encoding': 'gzip,deflate',
                    'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                "extractor_args": {
                    "youtube": {
                        "player_client": ["android", "web"]
                    }
                },
                "geo_bypass": True,
                "age_limit": 99
            }

            # Add cookies if available
            if use_cookies:
                if os.path.exists('cookies.txt'):
                    ydl_opts['cookiefile'] = 'cookies.txt'
                    logger.info("Using cookies.txt file")
                else:
                    # Try to extract cookies from Firefox browser
                    try:
                        ydl_opts['cookiesfrombrowser'] = ('firefox',)
                        logger.info("Using Firefox cookies")
                    except Exception as e:
                        logger.warning(f"Could not load Firefox cookies: {e}")

            max_retries = 2
            retry_delay = 1

            for attempt in range(max_retries + 1):
                try:
                    with timeout(60):  # 60 second timeout per video
                        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                            ydl.download([youtube_link])
                    logger.info(f"✓ Successfully downloaded: {movie_title}")
                    successful += 1
                    pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})

                    # Add random delay between downloads to appear more human
                    delay = random.uniform(2, 5)
                    time.sleep(delay)
                    break

                except TimeoutException:
                    if attempt < max_retries:
                        logger.warning(f"Timeout downloading '{movie_title}', retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        logger.error(f"Failed to download '{movie_title}': Timeout after {max_retries + 1} attempts")
                        failed += 1
                        pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})

                except yt_dlp.utils.DownloadError as e:
                    error_msg = str(e).lower()
                    if "403" in error_msg or "forbidden" in error_msg:
                        # Try fallback strategy for 403 errors
                        if attempt == 0:  # Only try fallback on first attempt
                            logger.info(f"403 error for '{movie_title}', trying fallback strategy...")
                            fallback_opts = ydl_opts.copy()
                            fallback_opts.update({
                                "format": "worst/best",  # Try worst quality first
                                "extractor_args": {
                                    "youtube": {
                                        "player_client": ["android"]
                                    }
                                }
                            })
                            try:
                                with timeout(30):
                                    with yt_dlp.YoutubeDL(fallback_opts) as ydl:
                                        ydl.download([youtube_link])
                                logger.info(f"✓ Successfully downloaded (fallback): {movie_title}")
                                successful += 1
                                pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})
                                delay = random.uniform(2, 5)
                                time.sleep(delay)
                                break
                            except:
                                pass  # Continue to normal error handling

                        logger.warning(f"Skipping '{movie_title}': Video is restricted/private (403 Forbidden)")
                        failed += 1
                        pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})
                        break
                    elif "unavailable" in error_msg or "private" in error_msg:
                        logger.warning(f"Skipping '{movie_title}': Video unavailable/private")
                        failed += 1
                        pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})
                        break
                    elif attempt < max_retries:
                        logger.warning(f"Download error for '{movie_title}': {e}, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        logger.error(f"Failed to download '{movie_title}' after {max_retries + 1} attempts: {e}")
                        failed += 1
                        pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})

                except Exception as e:
                    if attempt < max_retries:
                        logger.warning(f"Unexpected error for '{movie_title}': {e}, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        logger.error(f"Failed to download '{movie_title}' after {max_retries + 1} attempts: {e}")
                        failed += 1
                        pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})
            
            pbar.update(1)
    
    # Print summary at the end
    pp.summary_box("DOWNLOAD SUMMARY", {
        "Total Trailers": len(trailers),
        "Successfully Downloaded": successful,
        "Failed": failed,
        "Success Rate": f"{(successful/len(trailers)*100):.1f}%" if len(trailers) > 0 else "0%",
        "Output Folder": output_folder
    })

if __name__ == "__main__":
    # Download all trailers from the CSV to the 'trailers' folder
    # Try with cookies for better success rate
    download_trailers_from_csv(csv_filename="movie_trailers.csv", output_folder="trailers", use_cookies=True)