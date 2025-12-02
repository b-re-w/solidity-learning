import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-vyper";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  vyper: {
    version: "0.3.0",
  },
  networks: {
    kairos: {
      url: "https://public-en-kairos.node.kaia.io",
      accounts: [
        "0x6c506048505198016a67814bc5a546c5cd257e0aa92bcfb384f18db8af502df6"
      ]
    }
  },
  etherscan: {  // verify용 설정
    apiKey: {
      kairos: "unnecessary",
    },
    customChains: [
      {
        network: "kairos",
        chainId: 1001,
        urls: {
          apiURL: "https://kairos-api.kaiascan.io/hardhat-verify",
          browserURL: "https://kairos.kaiascan.io",
        }
      },
    ]
  }
};

export default config;
