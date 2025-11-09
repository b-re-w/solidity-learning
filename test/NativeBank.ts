import hre from "hardhat";
import { expect } from "chai";
import { NativeBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";


describe("NativeBank", async () => {
    let signers: HardhatEthersSigner[];
    let nativeBankC: NativeBank;

    beforeEach("deploy NativeBank contract", async () => {
        signers = await hre.ethers.getSigners();
        nativeBankC = await hre.ethers.deployContract("NativeBank", []);
    });

    it("should send native token to contract", async () => {
        const staker = signers[0];

        const tx = {
            from: staker.address,
            to: await nativeBankC.getAddress(),
            value: hre.ethers.parseEther("1.0")
        };
        const txResp = await staker.sendTransaction(tx);
        const txReceipt = await txResp.wait();

        console.log(
            // total balance
            await hre.ethers.provider.getBalance(await nativeBankC.getAddress())
        );
        console.log(await nativeBankC.balanceOf(staker.address));
    });

    it("should withdraw native token from contract", async () => {
        const staker = signers[0];
        const withdrawAmount = hre.ethers.parseEther("10");
        const tx = {
            from: staker.address,
            to: await nativeBankC.getAddress(),
            value: withdrawAmount
        };
        const txResp = await staker.sendTransaction(tx);
        const txReceipt = await txResp.wait();
        expect(await nativeBankC.balanceOf(staker.address)).to.equal(withdrawAmount);

        await nativeBankC.withdraw(withdrawAmount);
        expect(await nativeBankC.balanceOf(staker.address)).to.equal(0n);
    });
});
