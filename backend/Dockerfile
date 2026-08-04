FROM node:18-alpine

WORKDIR /app

# Sao chép file cấu hình package
COPY package*.json ./

# Cài đặt dependencies (bỏ qua devDependencies để giảm dung lượng image)
RUN npm install --production

# Sao chép mã nguồn
COPY . .

# Đảm bảo thư mục uploads tồn tại để không bị lỗi khi upload file
RUN mkdir -p uploads

EXPOSE 3001

ENV NODE_ENV=production

# Chạy server
CMD ["node", "src/app.js"]