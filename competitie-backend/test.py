import requests
try:
    r = requests.get("http://localhost:8000")
    print("Status:", r.status_code)
except Exception as e:
    print("Fout:", e)