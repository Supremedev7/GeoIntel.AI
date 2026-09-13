"""Shared pytest fixtures for GeoIntel Core test suite."""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
