# syntax=docker/dockerfile:1
# Multi-stage production Dockerfile optimized for Google Cloud Run

# Stage 1: Build frontend and server bundles
FROM node:22-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Minimal, secure production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create writable data directory and configure permissions for non-root user
RUN mkdir -p /app/data && chown -R node:node /app

# Run container as non-root user (recommended for Google Cloud Run)
USER node

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start server
CMD ["node", "dist/server.cjs"]
