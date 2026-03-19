# Stage 1 — Build
FROM node:24.2.0-bullseye AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install deps
COPY . .

RUN pnpm install

# Build TypeScript
RUN pnpm run build

# Stage 2 — Runtime
FROM node:24.2.0-bullseye AS runtime

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files & install only prod deps
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod --ignore-scripts

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Run app
ENTRYPOINT ["./entrypoint.sh"]
