# e2e tests via zombienet

## Running e2e tests locally via Docker

- Build Docker image

```shell
docker build -t typink-zbn --progress=plain --platform linux/amd64 --file=./e2e/zombienet/Dockerfile .
```

- Run zombienet locally

```shell
docker run -p 9944:9944 -p 9933:9933 --platform linux/amd64 typink-zbn
```

- After the zombienet network fully launched, we can now run the e2e tests

```shell
yarn workspace zombienet run e2e:test
```
