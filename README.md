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

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

In development mode (`npm run start:dev`), Swagger endpoint should be accessible: http://localhost:3000/api/#

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
