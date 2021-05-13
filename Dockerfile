FROM node:14-alpine

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

COPY . .

CMD [ "node", "index.js" ]
