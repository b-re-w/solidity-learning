import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
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

    describe("Staking", () => {
        it("should return taked amount", async () => {
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
});
