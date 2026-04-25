FROM codercom/code-server:latest

USER root

# Install basic dev tools and Node.js
RUN apt-get update && apt-get install -y \
    git \
    curl \
    sudo \
    nodejs \
    npm \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create workspace directory
WORKDIR /workspace

# Install common development dependencies
RUN npm install -g nodemon typescript ts-node

# Expose code-server port
EXPOSE 8080

# Start code-server with no authentication for development
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none"]
