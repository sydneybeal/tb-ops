# Use the slim version of the node 14 image as our base
FROM node:14-slim

# Create a directory for our application in the container 
RUN mkdir -p /usr/src/app

# Set this new directory as our working directory for subsequent instructions
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) into the container
COPY package*.json ./

# Install 'serve', a static file serving package, globally in the container
RUN npm install -g serve

# Install all the node modules required by the React app
RUN npm install

# Copy all files in the current directory into the container
COPY . .

# Set the PYTHONPATH environment variable, which is occasionally necessary for certain node packages
# 'PWD' is an environment variable that stores the path of the current working directory
ENV PYTHONPATH=${PYTHONPATH}:${PWD}

# Argument to pass environment variable
ARG REACT_APP_API

# Set the environment variable
ENV REACT_APP_API=${REACT_APP_API}

# Environment variable for the application's port
ENV PORT 4200

# Build the React app
RUN npm run build

# Serve the 'build' directory on port 4200 using 'serve'
CMD ["serve", "-s", "-l", "4200", "./build"]