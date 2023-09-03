# Use an official Node.js runtime as a parent image
FROM node:16

# Create and set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
COPY . .

# Expose port 3101
EXPOSE 3101

# Define the command to start your Express.js application
CMD ["node", "index.js"]
