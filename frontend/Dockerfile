# --- Build Stage ---
# Xây dựng ứng dụng React
FROM node:18-alpine AS build

WORKDIR /app

# Sao chép các file package
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép phần còn lại của mã nguồn
COPY . .

# Tạo bản build cho production
RUN npm run build

# --- Production Stage ---
# Phục vụ ứng dụng bằng Nginx
FROM nginx:stable-alpine

# Sao chép bản build từ tầng trên vào thư mục web root của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép file cấu hình Nginx tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở cổng 80
EXPOSE 80

# Khởi chạy Nginx
CMD ["nginx", "-g", "daemon off;"]