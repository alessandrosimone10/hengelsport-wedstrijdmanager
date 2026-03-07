from irm_kmi_api import IrmKmiApi
import aiohttp
from zoneinfo import ZoneInfo
from typing import Optional, Dict

async def get_weather_for_location(lat: float, lon: float) -> Optional[Dict]:
    """
    Haalt actueel weer op voor gegeven coördinaten via de KMI API.
    """
    try:
        async with aiohttp.ClientSession() as session:
            client = IrmKmiApi(
                session=session, 
                user_agent="HengelsportWedstrijdmanager/1.0"
            )
            
            # Ververs de weersvoorspelling voor deze coördinaten
            await client.refresh_forecasts_coord({'lat': lat, 'long': lon})
            
            # Haal actueel weer op
            current = client.get_current_weather(tz=ZoneInfo('Europe/Brussels'))
            
            # Maak een mooi, gestructureerd antwoord
            weather_data = {
                'temperature': round(current['temperature']),
                'wind_speed': round(current['wind_speed']),
                'wind_direction': current.get('wind_direction', '?'),
                'humidity': current.get('humidity', 0),
                'condition': current['condition_text_nl'],
                'condition_code': current['condition_code'],
                'rain_chance': current.get('rain_chance', 0),
                'pressure': current.get('pressure', 0),
                'updated_at': current['update_time'].isoformat() if hasattr(current['update_time'], 'isoformat') else str(current['update_time'])
            }
            
            return weather_data
            
    except Exception as e:
        print(f"❌ Fout bij ophalen weer: {e}")
        return None
