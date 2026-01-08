# ===================================
# Base Stage
# ===================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# ===================================
# Dependencies Stage
# ===================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# ===================================
# Development Stage
# ===================================
FROM base AS development

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default command (puede ser sobreescrito en docker-compose)
CMD ["npm", "run", "dev"]

# ===================================
# Builder Stage (Production Build)
# ===================================
FROM base AS builder

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===================================
# Production Stage
# ===================================
FROM base AS production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files (needed for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/src/db ./src/db
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
