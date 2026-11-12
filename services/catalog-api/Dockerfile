# syntax=docker/dockerfile:1

# build from the repo root: docker build -f services/catalog-api/Dockerfile .

FROM node:22-trixie-slim@sha256:be1e2a3dc2c4fd68cdfadad2a696a280e0d2749098bee509230174d72fb768c6 AS build

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch --frozen-lockfile

COPY packages packages
COPY services/catalog-api services/catalog-api
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --ignore-scripts --filter "catalog-api..."

RUN pnpm --filter "catalog-api..." run build \
 && pnpm --filter catalog-api run bundle


# source of the node binary only; the runtime below ships nothing else from it.
FROM node:22-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS node


# the C libraries node links against, from the same Alpine release as the binary.
FROM alpine:3.24@sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf AS libs

RUN apk add --no-cache libstdc++ libgcc


# no OS, shell or package manager: only node, its libraries and the bundle (x86-64).
FROM scratch AS runtime

COPY --from=libs /lib/ld-musl-x86_64.so.1 /lib/ld-musl-x86_64.so.1
COPY --from=libs /lib/ld-musl-x86_64.so.1 /lib/libc.musl-x86_64.so.1
COPY --from=libs /usr/lib/libstdc++.so.6 /usr/lib/libstdc++.so.6
COPY --from=libs /usr/lib/libgcc_s.so.1 /usr/lib/libgcc_s.so.1
COPY --from=node /usr/local/bin/node /usr/local/bin/node

ENV NODE_ENV=production
ENV MIGRATIONS_DIR=/app/drizzle

WORKDIR /app

COPY --from=build /repo/services/catalog-api/bundle ./
COPY --from=build /repo/packages/database/drizzle ./drizzle

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/readyz').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

USER 10001:10001

ENTRYPOINT ["node"]
CMD ["--require", "./tracing.js", "main.js"]
