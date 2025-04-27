# Deploying BooksSpace to Google Cloud Platform

This guide explains how to deploy BooksSpace to Google Cloud Platform using continuous deployment with Cloud Build, Artifact Registry, and Cloud Run.

## Prerequisites

1. A Google Cloud Platform account with billing enabled
2. Google Cloud CLI installed and configured locally (optional for manual deployment)
3. GitHub repository connected to Google Cloud Build

## Deployment Architecture

BooksSpace is deployed as a containerized application with:
- **Flask Backend**: Serves the API and static files
- **React Frontend**: Compiled into static files and served by Flask
- **Cloud Run**: Hosts the containerized application
- **Cloud Build**: Handles continuous deployment from GitHub
- **Artifact Registry**: Stores container images

## Files for Deployment

We've created several files to facilitate deployment:

1. **Dockerfile**: Multi-stage build that:
   - Builds the React frontend
   - Sets up the Python environment
   - Configures the application to listen on the specified port

2. **cloudbuild.yaml**: Configures Cloud Build to:
   - Build the Docker image
   - Push it to Artifact Registry
   - Deploy it to Cloud Run

3. **.dockerignore**: Excludes unnecessary files from the Docker build context

4. **Modified app.py**: Updated to:
   - Listen on the port specified by the `PORT` environment variable
   - Serve the React static files

## Deployment Steps

### 1. Connect Your GitHub Repository to Cloud Build

1. Go to [Cloud Build](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Connect Repository"
3. Select GitHub as the source and authenticate
4. Select your BooksSpace repository
5. Create a trigger that uses the cloudbuild.yaml configuration

### 2. Enable Required APIs

Make sure the following APIs are enabled for your GCP project:
- Cloud Build API
- Cloud Run API
- Artifact Registry API

### 3. Create an Artifact Registry Repository

1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Create a new repository named "booksspace" of type "Docker"
3. Select a region (must match the region in cloudbuild.yaml, e.g., us-central1)

### 4. Deploy Manually (First Time)

For the first deployment, you may want to build and deploy manually:

```bash
# Build the Docker image
docker build -t gcr.io/[PROJECT_ID]/booksspace:latest .

# Push to Artifact Registry
docker push gcr.io/[PROJECT_ID]/booksspace:latest

# Deploy to Cloud Run
gcloud run deploy booksspace \
  --image=gcr.io/[PROJECT_ID]/booksspace:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated
```

### 5. Verify Continuous Deployment

After setting up:
1. Make a change to your repository
2. Push to the connected branch
3. Cloud Build should automatically trigger a build and deployment
4. Check Cloud Build logs for any issues

## Troubleshooting

- **Build Failures**: Check Cloud Build logs for detailed error information
- **Runtime Issues**: Check Cloud Run logs
- **Container Issues**: Test the container locally before deployment:
  ```bash
  docker build -t booksspace-local .
  docker run -p 8080:8080 booksspace-local
  ```

## Additional Configurations

For a production deployment, consider adding:

- Custom domain name for your Cloud Run service
- Cloud SQL database for persistent storage
- Secret Manager for API keys and credentials
- IAM settings for proper access control 