## Transmogrify Docker container

# Build stage 1 - builder
#
# This stage installs all of the needed dependencies to build the transmogrify image.

FROM node:14-alpine as builder

WORKDIR /transmogrify

COPY .npmrc .npmrc
COPY ./package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add \
    python \
    build-base \
    imagemagick

ENV GS4JS_HOME=/usr/lib
ENV GS4JS_LIB=libgs.so.9.50

RUN npm ci --production

COPY ./src ./src

RUN rm -f .npmrc

# Build stage 2 - runtime
#
# This stage installs only the depencies needed for runtime, and it copies pre-built node_modules over.

FROM node:14-alpine as runtime

COPY --from=builder /transmogrify /transmogrify
COPY ./test/samples /transmogrify/test/samples
COPY docker-entrypoint.sh /usr/local/bin/

# Create non-root user to run puppeteer without --no-sandbox flag
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /transmogrify

# Set shell for pptruser to /bin/ash
RUN sed -i 's/pptruser:\/sbin\/nologin/pptruser:\/bin\/ash/' /etc/passwd

# Install chromium and dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

RUN apk add imagemagick

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV NODE_ENV=production

USER pptruser

WORKDIR /transmogrify

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["node", "./src/app.js"]

