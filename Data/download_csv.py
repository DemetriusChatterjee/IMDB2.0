import csv
import yt_dlp
import os
import logging
from pretty_print import pp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def download_trailers_from_csv(csv_filename: str = "movie_trailers.csv", output_folder: str = "trailers"):
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
            
            # Configure yt-dlp options
            ydl_opts = {
                "outtmpl": os.path.join(output_folder, f"{movie_title}.%(ext)s"),
                "format": "bestvideo+bestaudio/best",
                "merge_output_format": "mp4",
                "ignoreerrors": True,
                "quiet": True,
                "no_warnings": True,
            }
            
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([youtube_link])
                logger.info(f"✓ Successfully downloaded: {movie_title}")
                successful += 1
                pbar.set_postfix({"DONE YAY": successful, "FAILED NOT YAY": failed})
                
            except Exception as e:
                logger.error(f"Failed to download '{movie_title}': {e}")
                failed += 1
                pbar.set_postfix({"DONE": successful, "FAILED": failed})
            
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
    download_trailers_from_csv(csv_filename="movie_trailers.csv", output_folder="trailers")