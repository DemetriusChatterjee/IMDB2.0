from tqdm import tqdm
import sys

class PrettyPrinter:
    """Handles all pretty printing and progress bars for the application."""
    
    def __init__(self):
        self.colors = {
            'reset': '\033[0m',
            'bold': '\033[1m',
            'green': '\033[92m',
            'blue': '\033[94m',
            'yellow': '\033[93m',
            'red': '\033[91m',
            'cyan': '\033[96m',
            'magenta': '\033[95m',
        }
    
    def header(self, text: str, char: str = "=", width: int = 80):
        """Print a header with formatting."""
        print(f"\n{self.colors['bold']}{self.colors['cyan']}{char * width}{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}{text.center(width)}{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}{char * width}{self.colors['reset']}\n")
    
    def subheader(self, text: str):
        """Print a subheader."""
        print(f"\n{self.colors['bold']}{self.colors['blue']}[{text}]{self.colors['reset']}")
    
    def success(self, text: str):
        """Print success message."""
        print(f"{self.colors['green']}✓ {text}{self.colors['reset']}")
    
    def error(self, text: str):
        """Print error message."""
        print(f"{self.colors['red']}✗ {text}{self.colors['reset']}")
    
    def warning(self, text: str):
        """Print warning message."""
        print(f"{self.colors['yellow']}⚠ {text}{self.colors['reset']}")
    
    def info(self, text: str):
        """Print info message."""
        print(f"{self.colors['cyan']}ℹ {text}{self.colors['reset']}")
    
    def progress_bar(self, iterable, desc: str, unit: str = "item", **kwargs):
        """Create a progress bar."""
        return tqdm(
            iterable,
            desc=desc,
            unit=unit,
            bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}] {postfix}',
            colour='cyan',
            **kwargs
        )
    
    def scanning_bar(self, total: int, desc: str = "Scanning"):
        """Create a scanning progress bar."""
        return tqdm(
            total=total,
            desc=desc,
            unit="video",
            bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}] {postfix}',
            colour='green'
        )
    
    def download_bar(self, total: int, desc: str = "Downloading"):
        """Create a download progress bar."""
        return tqdm(
            total=total,
            desc=desc,
            unit="trailer",
            bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}] {postfix}',
            colour='magenta'
        )
    
    def summary_box(self, title: str, data: dict):
        """Print a summary box with data."""
        print(f"\n{self.colors['bold']}{self.colors['cyan']}{'─' * 60}{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}│ {title.center(56)} │{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}{'─' * 60}{self.colors['reset']}")
        
        for key, value in data.items():
            print(f"{self.colors['cyan']}│{self.colors['reset']} {key:<30} {self.colors['bold']}{value:>26}{self.colors['reset']} {self.colors['cyan']}│{self.colors['reset']}")
        
        print(f"{self.colors['bold']}{self.colors['cyan']}{'─' * 60}{self.colors['reset']}\n")
    
    def list_item(self, number: int, title: str, subtitle: str = None):
        """Print a list item."""
        print(f"{self.colors['bold']}{number}.{self.colors['reset']} {self.colors['green']}{title}{self.colors['reset']}")
        if subtitle:
            print(f"   {self.colors['cyan']}{subtitle}{self.colors['reset']}")

# Create a global instance
pp = PrettyPrinter()