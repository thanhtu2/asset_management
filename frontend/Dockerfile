# Bước 1: Build ứng dụng React/Vite
FROM node:20-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Bước 2: Sử dụng Nginx để phục vụ file tĩnh
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Lưu ý: Bạn nên cấu hình thêm file nginx.conf để hỗ trợ React Router (SPA)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]