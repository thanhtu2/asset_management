# --- Build Stage ---
# Sử dụng một phiên bản Node.js cụ thể để đảm bảo tính nhất quán
FROM node:18-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies cho production
RUN npm install --only=production

# Sao chép toàn bộ mã nguồn của backend
COPY . .

# --- Production Stage ---
FROM node:18-alpine

WORKDIR /app

# Sao chép các dependencies đã được cài đặt từ tầng build
COPY --from=builder /app/node_modules ./node_modules
# Sao chép mã nguồn ứng dụng
COPY --from=builder /app/src ./src

# Backend lắng nghe trên cổng 3001
EXPOSE 3001

# Lệnh để khởi chạy server
CMD ["node", "src/app.js"]