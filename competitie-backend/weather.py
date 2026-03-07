import httpx

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
        ]
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

    fishing_score = calculate_fishing_score(temp, wind, rain, cloud)

    return {
        "temperature": temp,
        "wind_speed": wind,
        "rain": rain,
        "cloud_cover": cloud,
        "fishing_score": fishing_score
    }
