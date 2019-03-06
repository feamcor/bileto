require("dotenv").config();

const HDWalletProvider = require("truffle-hdwallet-provider");

const rinkebyMnemonic = process.env.RINKEBY_MNEMONIC;
const rinkebyInfuraKey = process.env.RINKEBY_INFURA_KEY;
const rinkebyAddressIndex = process.env.RINKEBY_ADDRESS_INDEX;
const rinkebyNumAddresses = process.env.RINKEBY_NUM_ADDRESSES;

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },

        ganachecli: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },

        ganachegui: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*"
        },

        rinkeby: {
            provider: () =>
                new HDWalletProvider(
                    rinkebyMnemonic,
                    `https://rinkeby.infura.io/v3/${rinkebyInfuraKey}`,
                    rinkebyAddressIndex,
                    rinkebyNumAddresses
                ),
            network_id: 4,
            skipDryRun: true
        }
    },

    compilers: {
        solc: {
            version: "0.5.5",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
};
