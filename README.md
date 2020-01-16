## Description

Project Ekho - peer-to-peer communication module

## Installation

```bash
$ npm install
```

## Configuration

```bash
# .env contents
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
```

## Running the app

### Requirements

- node `v11.9.0`
- docker v19 (working with `Docker version 19.03.5, build 633a0ea838`)
- docker-compose v1 (working with `docker-compose version 1.22.0, build f46880fe`)

```bash
# to use the correct node version
nvm use v11.9.0

# or as of now (2020/01/15), stable version points to v11.9.0
nvm use stable
```

### Development mode

```bash
# make sure the databse is up and running
$ docker-compose up

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Swagger endpoint should be accessible: http://localhost:3000/api/#

### Prod mode - single node

```bash
# use docker-compose-single-node
# 1) brings up postgres db
# 2) brings up ekho instance
$ docker-compose -f docker-compose-single-node.yml up

# to update existing containers with new code, rebuild new images
$ docker-compose -f docker-compose-single-node.yml down
$ docker-compose -f docker-compose-single-node.yml build
$ docker-compose -f docker-compose-single-node.yml up
```

Swagger endpoint should be accessible: http://localhost:3000/api/#

### Prod mode - dual node

```bash
# use docker-compose-dual-node
# 1) brings up postgres db1 and ekho1 in network1
# 2) brings up postgres db2 and ekho2 in network2
# Note: instance 1 and 2 are isolated by different networks
$ docker-compose -f docker-compose-dual-node.yml up

# to update existing containers with new code, rebuild new images
$ docker-compose -f docker-compose-dual-node.yml down
$ docker-compose -f docker-compose-dual-node.yml build
$ docker-compose -f docker-compose-dual-node.yml up
```

Swagger endpoints should be accessible:
- http://localhost:3100/api/#
- http://localhost:3200/api/#

Note: single and dual node can run simultaneosly, producing 3 separate instances locally

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
