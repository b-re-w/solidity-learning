import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./Constants";


describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];


    beforeEach("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", ["MyToken", "MT", DECIMALS, MINTING_AMOUNT]);
    });


    describe("basic state value check", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).to.equal("MyToken");
        });
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).to.equal("MT");
        });
        it("should return DECIMALS", async () => {
            expect(await myTokenC.decimals()).to.equal(DECIMALS);
        });
        it("should return totalSupply", async () => {MINTING_AMOUNT
            expect(await myTokenC.totalSupply()).to.equal(MINTING_AMOUNT * 10n ** DECIMALS);
        });
    })


    // TDD: Test-driven Development
    describe("mint check", () => {
        it("should return balanceOf", async () => {
            const signer0 = signers[0];
            const oneMt = hre.ethers.parseUnits("1", DECIMALS);
            await myTokenC.mint(signer0.address, oneMt);

            expect(await myTokenC.balanceOf(signer0.address)).equal(MINTING_AMOUNT * 10n ** DECIMALS + oneMt);
        });

        it("should return or revert when minting infinitely", async () => {
            const hacker = signers[2];
            const mintingAgainAmount = hre.ethers.parseUnits("100", DECIMALS);
            await expect(
                myTokenC.connect(hacker).mint(hacker.address, mintingAgainAmount)
            ).to.be.revertedWith("You are not authorized! Only manager can call this function");  // 권한 없으면 revert 예상
        });
    });


    describe("transfer check", () => {
        it("should transfer", async () => {
            // 트랜젝션으로 토큰 전송 (signer 0으로 자동 서명)
            //const tx = await myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("1", DECIMALS));
            //const receipt = await tx.wait(); // 트랜잭션이 블록에 포함될 때까지 대기
            //console.log("Transfer 이벤트 로그:", receipt?.logs);
            await expect(
                myTokenC.transfer(signers[1].address, hre.ethers.parseUnits("1", DECIMALS))
            ).to.emit(myTokenC, "Transfer").withArgs(signers[0].address, signers[1].address, hre.ethers.parseUnits("1", DECIMALS));
            // 잔액이 올바르게 변경되었는지 확인
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits((MINTING_AMOUNT-1n).toString(), DECIMALS));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("1", DECIMALS));

            const filter = myTokenC.filters.Transfer(signers[0].address);
            const logs = await myTokenC.queryFilter(filter, 0, "latest");  // 0부터 최신 블록까지
            //console.log("필터링된 Transfer 이벤트:", logs);
            expect(logs.length).to.equal(1);
            expect(logs[0].args?.owner).to.equal(signers[0].address);
            expect(logs[0].args?.to).to.equal(signers[1].address);
            expect(logs[0].args?.value).to.equal(hre.ethers.parseUnits("1", DECIMALS));
        });

        it("should be reverted with insufficient balance error", async () => {
            // 잔액 부족으로 트랜잭션 실패 확인 (revert 예상)
            await expect(
                myTokenC.transfer(signers[1].address, hre.ethers.parseUnits((MINTING_AMOUNT+1n).toString(), DECIMALS))
            ).to.be.revertedWith("Insufficient balance");
            // 또는 try-catch 문으로도 확인 가능
            try {
                await myTokenC.transfer(signers[1].address, hre.ethers.parseUnits((MINTING_AMOUNT+1n).toString(), DECIMALS));
                expect.fail("트랜잭션이 성공하면 안 됩니다");  // revert 안되면 테스트 실패
            } catch (error: any) {
                console.log("예상된 오류 발생:", error.message);  // 오류 메시지 출력
                expect(error.message).to.include("Insufficient balance");  // 오류 메시지 검증
            }

            // 잔액이 변경되지 않았는지 확인
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits(MINTING_AMOUNT.toString(), DECIMALS));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("0", DECIMALS));
        });
    });


    describe("transfer from check", () => {
        it("should approve", async () => {
            // signer[0]이 signer[1]에게 100 토큰 사용 권한 위임
            await expect(
                myTokenC.approve(signers[1].address, hre.ethers.parseUnits("100", DECIMALS))
            ).to.emit(myTokenC, "Approval").withArgs(signers[1].address, hre.ethers.parseUnits("100", DECIMALS));
            expect(await myTokenC.allowance(signers[0].address, signers[1].address)).to.equal(hre.ethers.parseUnits("100", DECIMALS));
        });

        it("should approve and transferFrom", async () => {
            // signer[0]이 signer[1]에게 100 토큰 사용 권한 위임
            await expect(
                myTokenC.approve(signers[1].address, hre.ethers.parseUnits("100", DECIMALS))
            ).to.emit(myTokenC, "Approval").withArgs(signers[1].address, hre.ethers.parseUnits("100", DECIMALS));
            expect(await myTokenC.allowance(signers[0].address, signers[1].address)).to.equal(hre.ethers.parseUnits("100", DECIMALS));

            // signer[1]이 signer[0]의 토큰 100을 자신에게 전송
            await expect(
                myTokenC.connect(signers[1]).transferFrom(signers[0].address, signers[1].address, hre.ethers.parseUnits("100", DECIMALS))
            ).to.emit(myTokenC, "Transfer").withArgs(signers[0].address, signers[1].address, hre.ethers.parseUnits("100", DECIMALS));
            expect(await myTokenC.allowance(signers[0].address, signers[1].address)).to.equal(hre.ethers.parseUnits("0", DECIMALS));

            // 잔액이 올바르게 변경되었는지 확인
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits((MINTING_AMOUNT-100n).toString(), DECIMALS));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("100", DECIMALS));
        });

        it("should be reverted with missing allowance error", async () => {
            // 권한 위임 안함
            // signer[1]이 signer[0]의 토큰 100을 자신에게 전송 시도 (실패 예상)
            await expect(
                myTokenC.connect(signers[1]).transferFrom(signers[0].address, signers[1].address, hre.ethers.parseUnits("100", DECIMALS))
            ).to.be.revertedWith("Insufficient allowance");
            console.log("예상된 오류 발생: Insufficient allowance (missing allowance case)");  // 오류 메시지 출력
            expect(await myTokenC.allowance(signers[0].address, signers[1].address)).to.equal(hre.ethers.parseUnits("0", DECIMALS));  // 권한 없음 확인

            // 잔액이 바뀌면 안됨
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits(MINTING_AMOUNT.toString(), DECIMALS));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("0", DECIMALS));
        });

        it("should be reverted with insufficient allowance error", async () => {
            // 부족하게 권한 위임
            // signer[0]이 signer[1]에게 1 토큰 사용 권한 위임
            await expect(
                myTokenC.approve(signers[1].address, hre.ethers.parseUnits("1", DECIMALS))
            ).to.emit(myTokenC, "Approval").withArgs(signers[1].address, hre.ethers.parseUnits("1", DECIMALS));
            expect(await myTokenC.allowance(signers[0].address, signers[1].address)).to.equal(hre.ethers.parseUnits("1", DECIMALS));

            // signer[1]이 signer[0]의 토큰 100을 자신에게 전송 시도 (실패 예상)
            await expect(
                myTokenC.connect(signers[1]).transferFrom(signers[0].address, signers[1].address, hre.ethers.parseUnits("100", DECIMALS))
            ).to.be.revertedWith("Insufficient allowance");
            console.log("예상된 오류 발생: Insufficient allowance (exceeded allowed limit)");  // 오류 메시지 출력
            expect(await myTokenC.allowance(signers[0].address, signers[1].address)).to.equal(hre.ethers.parseUnits("1", DECIMALS));  // 권한이 1 토큰 그대로 남아있음 확인

            // 잔액이 바뀌면 안됨
            expect(await myTokenC.balanceOf(signers[0].address)).to.equal(hre.ethers.parseUnits(MINTING_AMOUNT.toString(), DECIMALS));
            expect(await myTokenC.balanceOf(signers[1].address)).to.equal(hre.ethers.parseUnits("0", DECIMALS));
        });
    });
});
