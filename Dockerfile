FROM postgrest/postgrest:v12.2.3

# Install curl for health checks (base image already runs as root during build)
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create app directory for config files
WORKDIR /app

# Copy configuration files
COPY config/ /app/config/
COPY config/postgrest.conf /config/postgrest.conf

# Create a startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose PostgREST port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start PostgREST with config file
CMD ["/start.sh"]
