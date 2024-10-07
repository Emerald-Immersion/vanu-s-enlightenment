FROM node:22-alpine AS builder

# Create app directory
WORKDIR /usr/src/app
RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    ttf-liberation

ADD package*.json /tmp/
RUN cd /tmp && npm ci
RUN cp -a /tmp/node_modules /usr/src/app/node_modules

## Copy built node modules and binaries without including the toolchain

COPY . .

CMD [ "node", "index.js" ]
