FROM node:10-alpine

# Create directory if not present
RUN mkdir -p /usr/src/app

# Sets work directory
WORKDIR /usr/src/app

RUN apk add --no-cache python2 make gcc g++ git libtool autoconf automake linux-headers \
openssl-dev zlib-dev libuv-dev

RUN git clone https://github.com/aerospike/aerospike-client-c.git && \
  cd aerospike-client-c && \
  git checkout --detach 4.6.3 && \
  git submodule update --init && \
  make EVENT_LIB=libuv

# Copy package.json
COPY package.json ./
COPY package-lock.json ./

# Installs dependencies
ENV PREFIX=/usr/src/app/aerospike-client-c/target/Linux-x86_64

COPY . .
RUN npm install


EXPOSE 5000

CMD ["npm", "run", "start"]