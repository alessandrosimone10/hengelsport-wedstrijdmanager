import httpx
import time
from typing import Optional, Tuple

geocode_cache = {}
GEOCODE_CACHE_DURATION = 86400  # 24 uur

async def get_coordinates_from_location(location_name: str) -> Optional[Tuple[float, float]]:
    # Cache check
    if location_name in geocode_cache:
        cached = geocode_cache[location_name]
        if time.time() - cached["timestamp"] < GEOCODE_CACHE_DURATION:
            return cached["coords"]

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location_name,
        "format": "json",
        "limit": 1,
        "accept-language": "nl"
    }
    headers = {
        "User-Agent": "HengelsportWedstrijdmanager/1.0 (jouw@email.com)"  # Vervang door jouw e-mail
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers, timeout=10.0)
        if response.status_code == 200:
            data = response.json()
            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                geocode_cache[location_name] = {"coords": (lat, lon), "timestamp": time.time()}
                return (lat, lon)
    return None
