# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci --workspace=apps/backend

# Copy backend source and shared packages
COPY apps/backend ./apps/backend
COPY packages ./packages

# Build backend
RUN npm run build --workspace=apps/backend

# Production stage
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 4000

CMD ["node", "dist/index.js"]
