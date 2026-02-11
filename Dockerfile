FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    xz-utils \
    ca-certificates \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install PostgREST
ARG POSTGREST_VERSION=12.2.3
RUN wget -O /tmp/postgrest.tar.xz \
    https://github.com/PostgREST/postgrest/releases/download/v${POSTGREST_VERSION}/postgrest-v${POSTGREST_VERSION}-linux-static-x64.tar.xz \
    && tar -xJf /tmp/postgrest.tar.xz -C /usr/local/bin/ \
    && rm /tmp/postgrest.tar.xz \
    && chmod +x /usr/local/bin/postgrest

# Create app directory for config files
WORKDIR /app

# Copy configuration files and data
COPY config/ /app/config/
COPY h1b.csv /app/h1b.csv

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
