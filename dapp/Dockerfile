# Use an official Node.js runtime as a parent image
FROM node:16

# Create and set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install application dependencies using Yarn
RUN yarn install

# Copy the rest of the application source code to the working directory
COPY . .

# Expose port 3000
EXPOSE 3000

# Define the command to start your React application
CMD ["yarn", "start"]
