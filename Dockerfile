FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files to reduce image size
RUN npm prune --production && rm -rf src tsconfig.json

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Run the server
CMD ["node", "dist/index.js"]
