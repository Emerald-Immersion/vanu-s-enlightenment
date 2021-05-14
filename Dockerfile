FROM node:14-alpine as builder

# Create app directory
WORKDIR /usr/src/app
RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev

ADD package*.json /tmp/
RUN cd /tmp && npm ci
RUN cp -a /tmp/node_modules /usr/src/app

FROM node:14-alpine as app

## Copy built node modules and binaries without including the toolchain
COPY --from=builder /usr/src/app/node_modules .

COPY . /usr/src/app

CMD [ "node", "index.js" ]
