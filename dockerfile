# This Dockerfile demonstrates how to build the Aerospike Node.js client on
# Alpine Linux. Since there is no pre-build package for the Aerospike C Client
# SDK for Alpine Linux, this Dockerfile first builds the C Client SDK from source
# (stage 1), then builds the Node.js client using the binaries build in stage 1
# (this is stage 2). Finally, in stage 3, the Node.js client module built in
# stage 2 is copied into the final Docker image, to keep the size of that image
# minimal (i.e. no build dependencies).
#
# Note: The AS_NODEJS_VERSION and AS_C_VERSION need to be set to compatible
# versions. To find out which version of the C client is compatible with a
# given Node.js client version, check out the Node.js client repo at the given
# version, and look up the supported C client version in the
# aerospike-client-c.ini file.

# Stage 1: Build Aerospike C client
FROM alpine:3.11 as c-builder
WORKDIR /src

ENV AS_C_VERSION 4.6.12

RUN apk update
RUN apk add --no-cache \
    build-base \
    linux-headers \
    bash \
    libuv-dev \
    openssl-dev \
    lua5.1-dev \
    zlib-dev

RUN wget https://artifacts.aerospike.com/aerospike-client-c/${AS_C_VERSION}/aerospike-client-c-src-${AS_C_VERSION}.zip \
    && unzip aerospike-client-c-src-${AS_C_VERSION}.zip \
    && mv aerospike-client-c-src-${AS_C_VERSION} aerospike-client-c \
    && cd aerospike-client-c \
    && make EVENT_LIB=libuv

# Stage 2: Build Aerospike Node.js client
FROM node:12-alpine3.11 as node-builder
WORKDIR /src

COPY --from=c-builder /src/aerospike-client-c/target/Linux-x86_64/include/ aerospike-client-c/include/
COPY --from=c-builder /src/aerospike-client-c/target/Linux-x86_64/lib/ aerospike-client-c/lib/

ENV AS_NODEJS_VERSION 3.14.1
ENV PREFIX=/src/aerospike-client-c

RUN apk update
RUN apk add --no-cache \
      build-base \
      bash \
      python \
      linux-headers \
      zlib-dev \
      openssl-dev

RUN npm install aerospike@${AS_NODEJS_VERSION}

# Stage 3: Aerospike Node.js Runtime
FROM node:12-alpine3.11
WORKDIR /src

RUN apk add --no-cache \
      zlib \
      openssl

COPY --from=node-builder /src/node_modules/ node_modules/

COPY . .
RUN npm install


EXPOSE 5000

CMD ["npm", "run", "start"]