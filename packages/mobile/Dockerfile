FROM node:20-slim

WORKDIR /app

# Install turborepo globally
RUN npm install -g turbo

# Install Android development tools (for future use)
# This is commented out for now as we're focusing on development setup
# RUN apt-get update && apt-get install -y openjdk-11-jdk android-tools-adb

# Copy package.json from all workspaces
COPY package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api/package.json ./packages/api/
COPY packages/mobile/package.json ./packages/mobile/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build shared packages first
RUN npm run build -- --filter=@speakbetter/core --filter=@speakbetter/ui --filter=@speakbetter/api

# Expose Metro Bundler port
EXPOSE 8081

# Start Metro Bundler
CMD ["npm", "run", "start", "--", "--workspace=@speakbetter/mobile"]
