FROM python:3.10.0-slim AS base
SHELL ["/bin/bash", "-c"]

# Persist PATH for all future RUN, CMD, and ENTRYPOINT steps
ENV BUN_INSTALL="$HOME/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN apt-get update && apt-get install -y curl unzip ffmpeg libsm6 libxext6 && \
    curl -fsSL https://bun.sh/install | bash

# Install MinIO client
RUN curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc

RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

RUN python --version && pip3 --version && mc --version && bun --version

WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
SHELL ["/bin/bash", "-c"]
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY prisma /temp/prod/prisma
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production && bunx prisma generate

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bun build.ts

FROM base AS release
COPY --from=install /temp/prod/node_modules ./node_modules
COPY --from=prerelease /app/dist ./dist
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/scripts ./scripts
RUN pip install -r ./scripts/requirements.txt

# run the app
RUN mkdir ./tmp
RUN mkdir ./dist/tmp
RUN useradd -m enigma && chown -R enigma /app
USER enigma
EXPOSE 2002/tcp
ENTRYPOINT [ "/bin/bash", "-c" ]
CMD [ "bun run dist/main.js" ]