// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


contract NativeBank {
    mapping(address => uint256) public balanceOf;

    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        //payable(msg.sender).transfer(amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        balanceOf[msg.sender] -= amount;
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}
