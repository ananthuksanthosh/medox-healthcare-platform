# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install openSSL and other dependencies needed for Prisma/Bcrypt
RUN apk add --no-cache openssl python3 make g++

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for Prisma client generation)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Clean up devDependencies to shrink production image size
# RUN npm prune --production

# -------------------------------------------------------------
# Production Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install runtime dependencies (OpenSSL is required by Prisma engine)
RUN apk add --no-cache openssl

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy generated Prisma Client and node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy application source code
COPY src ./src
COPY server.js ./

# Create uploads directory and ensure it has correct permissions
RUN mkdir -p uploads && chown -R node:node /usr/src/app

# Use non-root node user for container safety
USER node

# Expose backend port
EXPOSE 5000

# Start application server
CMD ["node", "server.js"]
