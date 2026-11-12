# syntax=docker/dockerfile:1

# build from the repo root: docker build -f services/web/Dockerfile .

FROM node:22-trixie-slim@sha256:be1e2a3dc2c4fd68cdfadad2a696a280e0d2749098bee509230174d72fb768c6 AS build

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch --frozen-lockfile

COPY services/web services/web
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --ignore-scripts --filter "web..."

RUN pnpm --filter web run build


FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime

# the base image lags behind alpine's security fixes, so the build applies them, then drops root again.
USER 0
RUN apk upgrade --no-cache
USER 101

# upstream for /api/, resolved at request time.
ENV API_UPSTREAM=http://catalog-api:3000
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY services/web/templates /etc/nginx/templates
COPY services/web/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /repo/services/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD ["sh", "-c", "wget -qO- http://127.0.0.1:8080/healthz > /dev/null || exit 1"]

USER 101
