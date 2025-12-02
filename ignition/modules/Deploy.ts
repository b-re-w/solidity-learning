import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenDeploy", (m) => {
    const myTokenC = m.contract("MyToken", ["MyToken", "MT", 18, 1000000]);
    const tinyBankC = m.contract("TinyBank", [myTokenC]);
    m.call(myTokenC, "setManager", [tinyBankC]);
    return { myTokenC, tinyBankC };
});  // contract 생성
