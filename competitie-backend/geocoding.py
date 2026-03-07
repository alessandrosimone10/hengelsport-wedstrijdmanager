import httpx
from typing import Tuple, Optional

async def get_coordinates_from_location(location_name: str) -> Optional[Tuple[float, float]]:
    """
    Converteert een plaatsnaam naar coördinaten via OpenStreetMap Nominatim API.
    
    Args:
        location_name: Bijv. "Amsterdam" of "Genk, België"
    
    Returns:
        Tuple (latitude, longitude) of None als de locatie niet gevonden is
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location_name,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
        "accept-language": "nl"  # Vraag Nederlandse resultaten
    }
    
    # BELANGRIJK: Vervang dit door een herkenbare User-Agent!
    headers = {
        "User-Agent": "HengelsportWedstrijdManager/1.0 (alessandro_simone@hotmail.com)"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    lat = float(data[0]['lat'])
                    lon = float(data[0]['lon'])
                    print(f"📍 Gevonden: {location_name} → {lat}, {lon}")  # Debug log
                    return (lat, lon)
                else:
                    print(f"❌ Locatie niet gevonden: {location_name}")
            else:
                print(f"❌ Nominatim error: {response.status_code}")
        except Exception as e:
            print(f"❌ Fout bij geocoding: {e}")
    
    return None
