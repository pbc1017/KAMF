# Use Node.js 18 LTS as the base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if using pnpm)
COPY package.json ./
COPY ../../pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package.json and install only production dependencies
COPY package.json ./
COPY ../../pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy built application from base stage
COPY --from=base /app/dist ./dist

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["node", "dist/main.js"]
