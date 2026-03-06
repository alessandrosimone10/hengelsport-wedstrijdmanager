FROM python:3.11-slim

WORKDIR /app

COPY competitie-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY competitie-backend/ .

CMD ["uvicorn", "competitie-backend.main:app", "--host", "0.0.0.0", "--port", "10000"]
