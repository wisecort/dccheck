FROM python:3.11-alpine

# Create a non-root system user/group for running the application.
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Install dependencies first (layer cached separately from source code).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source.
COPY . .

# Create the photo storage directory and hand ownership to the app user.
RUN mkdir -p /app/storage/fotos && chown -R app:app /app

# Switch to the non-root user before starting the process.
USER app

EXPOSE 8000

# Lightweight health check using wget (available in Alpine by default).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
