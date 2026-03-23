# ============================================================
# BlogForge — Frontend Dockerfile
# Multi-stage: Node builder + Nginx static server
# ============================================================

# ── Stage 1: Build React/Vite app ────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=optional

# Copy source code
COPY index.html ./
COPY vite.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Build arguments for environment variables baked into bundle
ARG VITE_API_URL=/api
ARG VITE_APP_NAME=BlogForge
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build for production
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/blogforge.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
