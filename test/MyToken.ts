import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 100n;
const decimals = 18n;

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];
    beforeEach("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", ["MyToken", "MT", decimals, mintingAmount]);
    });
    describe("basic state value check", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).to.equal("MyToken");
        });
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).to.equal("MT");
        });
        it("should return decimals", async () => {
            expect(await myTokenC.decimals()).to.equal(decimals);
        });
        it("should return totalSupply", async () => {
            expect(await myTokenC.totalSupply()).to.equal(mintingAmount * 10n ** decimals);
        });
    })
    describe("mint check", () => {
        it("should return balanceOf", async () => {
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(mintingAmount * 10n ** decimals);
        });
    });
    describe("transfer check", () => {
        it("should transfer", async () => {
            // 트랜젝션으로 토큰 전송 (signer 0으로 자동 서명)
            //const tx = await myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("1", decimals));
            //const receipt = await tx.wait(); // 트랜잭션이 블록에 포함될 때까지 대기
            //console.log("Transfer 이벤트 로그:", receipt?.logs);
            await expect(
                myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("1", decimals))
            ).to.emit(myTokenC, "Transfer").withArgs(signers[0].address, signers[1].address, hre.ethers.parseUnits("1", decimals));
            // 잔액이 올바르게 변경되었는지 확인
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits((mintingAmount-1n).toString(), decimals));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("1", decimals));

            const filter = myTokenC.filters.Transfer(signers[0].address);
            const logs = await myTokenC.queryFilter(filter, 0, "latest");  // 0부터 최신 블록까지
            //console.log("필터링된 Transfer 이벤트:", logs);
            expect(logs.length).to.equal(1);
            expect(logs[0].args?.from).to.equal(signers[0].address);
            expect(logs[0].args?.to).to.equal(signers[1].address);
            expect(logs[0].args?.value).to.equal(hre.ethers.parseUnits("1", decimals));
        });
        it("should be reverted with insufficient balance error", async () => {
            // 잔액 부족으로 트랜잭션 실패 확인 (revert 예상)
            await expect(
                myTokenC.transfer(signers[1].address, hre.ethers.parseUnits((mintingAmount+1n).toString(), decimals))
            ).to.be.revertedWith("Insufficient balance");
            // 또는 try-catch 문으로도 확인 가능
            try {
                await myTokenC.transfer(signers[1].address, hre.ethers.parseUnits((mintingAmount+1n).toString(), decimals));
                expect.fail("트랜잭션이 성공하면 안 됩니다"); // revert 안되면 테스트 실패
            } catch (error: any) {
                console.log("예상된 오류 발생:", error.message); // 오류 메시지 출력
                expect(error.message).to.include("Insufficient balance"); // 오류 메시지 검증
            }

            // 잔액이 변경되지 않았는지 확인
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits(mintingAmount.toString(), decimals));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("0", decimals));
        });
    });
});
