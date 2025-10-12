import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];
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
    it("should transfer", async () => {
        // 트랜젝션으로 토큰 전송 (signer 0으로 자동 서명)
        await myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("100", 18));

        expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits("999900", 18));
        expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("100", 18));
    });
    it("should be reverted with insufficient balance error", async () => {
        // 잔액 부족으로 트랜잭션 실패 확인 (revert 예상)
        await expect(
            myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("1000000000", 18))
        ).to.be.revertedWith("Insufficient balance");
        // 또는 try-catch 문으로도 확인 가능
        try {
            await myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("1000000000", 18));
            expect.fail("트랜잭션이 성공하면 안 됩니다"); // revert 안되면 테스트 실패
        } catch (error: any) {
            console.log("예상된 오류 발생:", error.message); // 오류 메시지 출력
            expect(error.message).to.include("Insufficient balance"); // 오류 메시지 검증
        }

        // 잔액이 변경되지 않았는지 확인
        expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits("999900", 18));
        expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("100", 18));
    });
});
