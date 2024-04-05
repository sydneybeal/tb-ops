# Select a base image that includes Python
FROM --platform=linux/amd64 python:3.11-bullseye

# Set up a working directory in the container for your application
WORKDIR /app

# Include the requirements layer first to speed up builds
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY . /app

# Set the PYTHONPATH environment variable to include the project root
ENV PYTHONPATH=/app

# Arguments for Postgres
ARG POSTGRES_USER
ENV POSTGRES_USER=${POSTGRES_USER}
ARG POSTGRES_PASSWORD
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ARG POSTGRES_DB
ENV POSTGRES_DB=${POSTGRES_DB}
ARG POSTGRES_HOST
ENV POSTGRES_HOST=${POSTGRES_HOST}
ARG SECRET_KEY
ENV SECRET_KEY=${SECRET_KEY}
ARG ALGORITHM
ENV ALGORITHM=${ALGORITHM}

# Expose the port the app runs on
EXPOSE 9900

# Set the command to run your application
CMD ["python", "./api/cmd/api/main.py"]