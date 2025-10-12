import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEtherSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEtherSigner[];
    before("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", ["MyToken", "MT", 18]);
        console.log(await myTokenC.name());
    });
    it("should return name", async () => {
        expect(await myTokenC.name()).to.equal("MyToken");
    });
    it("should return symbol", async () => {
        expect(await myTokenC.symbol()).to.equal("MT");
    });
    it("should return decimals", async () => {
        expect(await myTokenC.decimals()).to.equal(18);
    });
    it("should return totalSupply", async () => {
        expect(await myTokenC.totalSupply()).to.equal(1_000_000n * 10n ** 18n);
    });
    it("should return balanceOf", async () => {
        expect(await myTokenC.balanceOf(signers[0].address)).to.equal(1_000_000n * 10n ** 18n);
    });
});
