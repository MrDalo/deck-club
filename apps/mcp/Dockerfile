# syntax=docker/dockerfile:1.7
#
# Deck Club — mcp (NestJS MCP server, Streamable HTTP). Stateless; holds no
# data and no secrets. It reaches the api over the private network.
#   docker build -f apps/mcp/Dockerfile -t deck-club-mcp .

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    COREPACK_HOME=/corepack
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

FROM deps AS build
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile
RUN pnpm turbo run build --filter=@deck-club/mcp...
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter=@deck-club/mcp deploy --prod --legacy /out \
 && rm -rf /out/dist && cp -r apps/mcp/dist /out/dist

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    MCP_PORT=4100 \
    LOG_FORMAT=json
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4100
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.MCP_PORT||4100)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
