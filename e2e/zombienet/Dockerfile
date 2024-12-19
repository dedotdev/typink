ARG NODE_VERSION=18.14.2

FROM node:${NODE_VERSION}
WORKDIR /usr/typink
COPY . .

WORKDIR /usr/bin
RUN \
    curl -L -O https://github.com/paritytech/zombienet/releases/download/v1.3.116/zombienet-linux-x64 && chmod +x zombienet-linux-x64 \
    && curl -L -O https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.14.1/polkadot && chmod +x polkadot \
    && curl -L -O https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.14.1/polkadot-execute-worker && chmod +x polkadot-execute-worker \
    && curl -L -O https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.14.1/polkadot-prepare-worker && chmod +x polkadot-prepare-worker \
    && curl -L -O https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.14.1/polkadot-parachain && chmod +x polkadot-parachain

WORKDIR /usr/typink

# Expose necessary ports
EXPOSE 9944
EXPOSE 9933

# Set the default command to run zombienet
CMD ["zombienet-linux-x64", "-p", "native", "spawn", "./e2e/zombienet/networks.json"]
