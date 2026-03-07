import httpx
from datetime import datetime

def calculate_fishing_score(temp, wind, rain, cloud):
    score = 50
    # temperatuur
    if 10 <= temp <= 20:
        score += 20
    elif temp < 5 or temp > 28:
        score -= 10
    # wind
    if wind < 10:
        score += 10
    elif wind > 25:
        score -= 10
    # regen
    if rain > 0:
        score += 5
    # bewolking
    if 40 <= cloud <= 80:
        score += 10
    return max(0, min(score, 100))

def get_condition(rain, cloud_cover):
    """Bepaalt een leesbare weersconditie en bijbehorend icoon op basis van regen en bewolking."""
    if rain > 0:
        return ("Regenachtig", "rain")
    elif cloud_cover > 70:
        return ("Bewolkt", "cloud")
    elif cloud_cover < 30:
        return ("Zonnig", "sun")
    else:
        return ("Half bewolkt", "cloud")

async def get_weather_for_location(lat: float, lon: float):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m",
            "wind_speed_10m",
            "precipitation",
            "cloud_cover"
        ],
        "timezone": "Europe/Brussels"  # zorgt voor lokale tijd
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        return None

    data = response.json()
    current = data.get("current")
    if not current:
        return None

    temp = current["temperature_2m"]
    wind = current["wind_speed_10m"]
    rain = current["precipitation"]
    cloud = current["cloud_cover"]
    updated_at = current.get("time")  # ISO 8601 timestamp

    fishing_score = calculate_fishing_score(temp, wind, rain, cloud)
    condition, code = get_condition(rain, cloud)

    return {
        "temperature": round(temp, 1),
        "wind_speed": round(wind, 1),
        "humidity": 0,  # Open-Meteo geeft geen luchtvochtigheid in deze gratis call, placeholder
        "condition": condition,
        "condition_code": code,
        "rain": rain,
        "cloud_cover": cloud,
        "fishing_score": fishing_score,
        "updated_at": updated_at
    }
