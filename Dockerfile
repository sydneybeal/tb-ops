# Select a base image that includes Python
FROM --platform=linux/amd64 python:3.11-bullseye

# Set up a working directory in the container for your application
WORKDIR /app

# Copy the backend code into the container
COPY . /app

# Install any Python dependencies listed in 'requirements.txt'
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 9900

# Set the command to run your application
CMD ["python", "./api/cmd/api/main.py"]