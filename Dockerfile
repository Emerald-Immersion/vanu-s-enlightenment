FROM node:14

# Create app directory
WORKDIR /usr/src/app

ADD package.json /tmp/package.json
RUN cd /tmp && npm ci
RUN cp -a /tmp/node_modules /usr/src/app

COPY . .

CMD [ "node", "index.js" ]
