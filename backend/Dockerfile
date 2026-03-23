# ============================================================
# BlogForge — Backend Dockerfile
# Multi-stage: builder + lean production image
# ============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL deps (including devDependencies for any build steps)
RUN npm ci --omit=optional

# Copy source
COPY src/ ./src/

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S blogforge -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --omit=optional && \
    npm cache clean --force

# Copy built source from builder stage
COPY --from=builder /app/src ./src

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R blogforge:nodejs logs

# Switch to non-root user
USER blogforge

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

# Use dumb-init to handle PID 1 and signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
