import hre from "hardhat";
import { expect } from "chai";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./Constants";


describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let myTokenC: MyToken;
    let tinyBankC: TinyBank;
    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", ["MyToken", "MT", DECIMALS, MINTING_AMOUNT]);
        tinyBankC = await hre.ethers.deployContract("TinyBank", [myTokenC.getAddress()]);
        await myTokenC.setManager(await tinyBankC.getAddress());  // TinyBank가 토큰 민팅할 수 있도록 권한 부여
        for (let i = 0; i < 3; i++) {
            await tinyBankC.setManager(i, signers[i].address);  // signer0~3을 TinyBank 매니저로 설정
        }
    });

    describe("Initialized state check", () => {
        it("should have zero total stakes", async () => {
            expect(await tinyBankC.totalStaked()).to.equal(0);
        });
        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });
    })

    describe("Authorizing", () => {
        it("should only allow managers to call restricted functions", async () => {
            const nonManager = signers[5];
            const newManagerAddress = signers[6].address;

            // 매니저가 아닌 사용자가 매니저 추가 시도
            await expect(
                tinyBankC.connect(nonManager).addManager(newManagerAddress)
            ).to.be.revertedWith("You are not authorized! Only managers can call this function");
        });

        it("should require all confirmations for critical operations", async () => {
            // 매니저가 매니저 추가 시도
            const manager = signers[0];
            const newManagerAddress = signers[6].address;

            // 부분적인 confirm만으로는 실행 불가
            await expect(
                tinyBankC.connect(manager).addManager(newManagerAddress)
            ).to.be.revertedWith("Not all managers have confirmed yet");
        });

        it("should proceed critical operation after requiring all confirmations", async () => {
            // 매니저가 매니저 추가 시도
            const manager = signers[0];
            const newManagerAddress = signers[6].address;

            // 모든 매니저가 confirm 후 실행 가능
            const managerCount = await tinyBankC.registeredManagers();
            for (let i = 0; i < Number(managerCount); i++) {
                await tinyBankC.connect(signers[i]).confirm();
            }
            await expect(
                tinyBankC.connect(manager).addManager(newManagerAddress)
            ).to.not.be.reverted;

            const updatedManagerCount = await tinyBankC.registeredManagers();
            await expect(await tinyBankC.managers(Number(updatedManagerCount)-1)).to.equal(newManagerAddress);
        });
    });

    describe("Staking", () => {
        it("should return staked amount", async () => {
            const signer0 = signers[0];
            const stakeAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakeAmount);
            await tinyBankC.stake(stakeAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(stakeAmount);
            expect(await myTokenC.balanceOf(tinyBankC)).equal(await tinyBankC.totalStaked());
            expect(await tinyBankC.totalStaked()).equal(stakeAmount);
        });
    })

    describe("Withdrawing", () => {
        it("should return 0 staked amount after withdraw totals", async () => {
            const signer0 = signers[0];
            const stakeAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakeAmount);
            await tinyBankC.stake(stakeAmount);
            await tinyBankC.withdraw(stakeAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(
                await tinyBankC.totalStaked()
            );
        });
    });

    describe("Rewarding", () => {
        it("should reward 1MT every blocks", async () => {
            const signer0 = signers[0];
            const stakeAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakeAmount);
            await tinyBankC.stake(stakeAmount);

            const BLOCKS = 5n;
            const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
            for (let i = 0; i < BLOCKS; i++) {
                await myTokenC.transfer(signer0.address, transferAmount);
            }

            await tinyBankC.withdraw(stakeAmount);
            expect(await myTokenC.balanceOf(signer0.address)).equal(
                hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
            );
        });

        it("should revert when changing rewardPerBlock by hacker", async () => {
            const signer3 = signers[4];
            const rewardToChange = hre.ethers.parseUnits("10", DECIMALS);
            await expect(tinyBankC.connect(signer3).setRewardPerBlock(rewardToChange)).to.be.revertedWith(
                "You are not authorized! Only managers can call this function"
            )
        });
    });
});
