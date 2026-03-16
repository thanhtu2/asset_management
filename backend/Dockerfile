# Development Dockerfile for Backend
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start with nodemon for development
CMD ["npm", "run", "dev"]
