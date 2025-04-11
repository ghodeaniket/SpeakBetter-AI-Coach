FROM node:20-slim

WORKDIR /app

# Install turborepo globally
RUN npm install -g turbo

# Install dependencies only when needed
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the project
COPY . .

# Build all packages
RUN npm run build

# Expose the web app port
EXPOSE 5173

# Default command to start the web app
CMD ["npm", "run", "dev"]
