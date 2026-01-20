# -----------------------------------------------------------
# STAGE 1: BUILD (App Construction)
# -----------------------------------------------------------
# 1. Use Node 22 (Vite requires it)
FROM node:22-alpine as build

WORKDIR /app

# 2. IMPORTANT CHANGE: Only copy package.json (WITHOUT the lock)
# This forces npm to find versions compatible with Linux/Docker
# and avoids the error "@rollup/rollup-linux-x64-musl"
COPY package.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Run the Vite build
RUN npm run build

# -----------------------------------------------------------
# STAGE 2: PRODUCTION (Optimized Web Server)
# -----------------------------------------------------------
FROM nginx:alpine

# Copy the generated static files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]