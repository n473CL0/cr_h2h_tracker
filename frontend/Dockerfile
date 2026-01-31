# Stage 1: Build the React Application
FROM node:18-alpine as build

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Use 'npm ci' for a clean, deterministic install
RUN run build

# Copy the rest of the source code
COPY . .

# Build the static files (Output will be in /app/build)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from Stage 1 to Nginx's html directory
COPY --from=build /app/build /usr/share/nginx/html

# Remove default Nginx config and replace with our SPA-friendly config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard for web traffic)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]