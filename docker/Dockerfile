FROM node:22.22.3-bookworm-slim@sha256:e21fc383b50d5347dc7a9f1cae45b8f4e2f0d39f7ade28e4eef7d2934522b752 AS build
WORKDIR /src
ARG VITE_API_BASE_URL
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.31.7-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=build /src/dist /usr/share/nginx/html
COPY docker/dev.conf /etc/nginx/conf.d/default.conf
