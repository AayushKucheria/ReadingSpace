FROM node:18 AS client-builder

# Set working directory for client
WORKDIR /app/client

# Copy client package files and install dependencies
COPY client/package*.json ./
RUN npm install

# Copy client source files
COPY client/ ./

# Build client
RUN npm run build

# Python stage for the backend - using latest stable version
FROM python:latest

# Set working directory
WORKDIR /app

# Copy server requirements and install dependencies
COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server/ ./

# Copy built client from the previous stage
COPY --from=client-builder /app/client/build ./static

# Expose the port specified by the PORT environment variable
ENV PORT=8080

# Add environment variable for static files path
ENV STATIC_FOLDER=./static

# Run the application
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 app:app 