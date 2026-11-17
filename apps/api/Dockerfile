# syntax=docker/dockerfile:1.7
#
# Deck Club — api (NestJS core: every business rule, the SQLite database).
# Build context is the repository root:
#   docker build -f apps/api/Dockerfile -t deck-club-api .
# Runtime secrets come from the environment at run time, never from a build
# argument or an image layer (.dockerignore drops .env).

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    COREPACK_HOME=/corepack
RUN corepack enable
WORKDIR /repo

# Dependencies first: this layer only changes when the lockfile does. The
# root package.json carries the pnpm pin; .npmrc the supply-chain settings.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

FROM deps AS build
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile
RUN pnpm turbo run build --filter=@deck-club/api...
# A self-contained production tree: the app (with its drizzle/ migrations),
# the built workspace packages it imports, and production dependencies only.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter=@deck-club/api deploy --prod --legacy /out \
 && rm -rf /out/dist && cp -r apps/api/dist /out/dist

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    API_PORT=4000 \
    LOG_FORMAT=json \
    DATABASE_URL=file:/data/deck-club.db
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# The SQLite file lives on a volume mounted here; the runtime user owns it.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
