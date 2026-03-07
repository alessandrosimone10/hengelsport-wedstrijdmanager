import httpx
from typing import Optional, Dict

async def get_weather_for_location(lat: float, lon: float) -> Optional[Dict]:
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,wind_speed_10m,wind_direction_10m"
        )

        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()

        current = data["current"]

        return {
            "temperature": round(current["temperature_2m"]),
            "wind_speed": round(current["wind_speed_10m"]),
            "wind_direction": current["wind_direction_10m"],
        }

    except Exception as e:
        print(f"Weer fout: {e}")
        return None
