FROM python:3.11-slim

WORKDIR /app

# Kopieer en installeer dependencies
COPY competitie-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopieer de volledige backend-code naar de werkdirectory
COPY competitie-backend/ .

# Debug: toon de inhoud van /app (verwijder later)
RUN ls -la /app

# Start de applicatie
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
