FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=5000
ENV NODE_ENV=production
ENV DATABASE_URL="sqlite:///./fluxen.db"

EXPOSE 5000

CMD ["python", "run.py"]
