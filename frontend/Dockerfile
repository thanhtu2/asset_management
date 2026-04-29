# Bước 1: Build ứng dụng React/Vite
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Bước 2: Sử dụng Nginx để phục vụ file tĩnh
FROM nginx:stable-alpine

# Sao chép file build từ stage 1
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Lưu ý: Bạn nên cấu hình thêm file nginx.conf để hỗ trợ React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]