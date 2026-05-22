# Development Dockerfile for Asset Management Backend
FROM node:20-alpine

WORKDIR /app

# Trong môi trường Dev, chúng ta COPY package.json trước để tận dụng cache layer
COPY backend/package*.json ./
RUN npm install && npm cache clean --force

# Copy mã nguồn backend vào (mặc dù sẽ bị Volume đè lên khi chạy, 
# nhưng bước này giúp Image vẫn chạy được độc lập)
COPY backend/ .

EXPOSE 3001

# Các biến môi trường hỗ trợ File Watching trên Docker/Windows
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# Start with nodemon for development
CMD ["npm", "run", "dev"]
