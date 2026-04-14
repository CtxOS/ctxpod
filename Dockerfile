FROM node:20-slim

WORKDIR /app

# Install system dependencies if needed (e.g., for git-based agents)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm if needed (the project has pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* package-lock.json* ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else npm install; fi

COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
