FROM node:14

# Create app directory
WORKDIR /usr/src/app
RUN apt update -y && apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ADD package*.json /tmp/
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /usr/src/app

COPY . .

CMD [ "node", "index.js" ]
