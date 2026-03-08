import httpx
import time
from typing import Optional, Tuple

# Cache voor geocoding resultaten
geocode_cache = {}
GEOCODE_CACHE_DURATION = 86400  # 24 uur (in seconden)

async def get_coordinates_from_location(location_name: str) -> Optional[Tuple[float, float]]:
    """
    Converteert een plaatsnaam naar coördinaten via OpenStreetMap Nominatim API.
    Resultaten worden 24 uur gecached om rate limiting te voorkomen.
    
    Args:
        location_name: Bijv. "Brussel" of "Genk, België"
    
    Returns:
        Tuple (latitude, longitude) of None als de locatie niet gevonden is
    """
    # Controleer cache
    if location_name in geocode_cache:
        cached = geocode_cache[location_name]
        if time.time() - cached["timestamp"] < GEOCODE_CACHE_DURATION:
            print(f"✅ Cache hit voor {location_name}")
            return cached["coords"]
        else:
            # Verwijder verlopen entry
            del geocode_cache[location_name]

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location_name,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
        "accept-language": "nl"  # Vraag Nederlandse resultaten
    }
    
    # BELANGRIJK: Vervang dit door een herkenbare User-Agent met jouw e-mailadres!
    headers = {
        "User-Agent": "HengelsportWedstrijdmanager/1.0 (alessandro_simone@hotmail.com)"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    lat = float(data[0]['lat'])
                    lon = float(data[0]['lon'])
                    # Sla in cache
                    geocode_cache[location_name] = {
                        "coords": (lat, lon),
                        "timestamp": time.time()
                    }
                    print(f"📍 Gevonden en gecached: {location_name} → {lat}, {lon}")
                    return (lat, lon)
                else:
                    print(f"❌ Locatie niet gevonden: {location_name}")
            elif response.status_code == 429:
                print(f"⚠️ Rate limited (429) voor {location_name}. Gebruik cache of wacht.")
            else:
                print(f"❌ Nominatim error: {response.status_code}")
        except Exception as e:
            print(f"❌ Fout bij geocoding: {e}")
    
    return None
