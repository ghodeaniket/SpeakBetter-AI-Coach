FROM node:20-slim

WORKDIR /app

# Install turborepo globally
RUN npm install -g turbo

# Copy package.json from all workspaces
COPY package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build shared packages first
RUN npm run build -- --filter=@speakbetter/core --filter=@speakbetter/ui --filter=@speakbetter/api

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--workspace=@speakbetter/web", "--", "--host", "0.0.0.0"]
