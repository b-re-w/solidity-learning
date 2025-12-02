// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


contract NativeBank {
    mapping(address => uint256) public balanceOf;
    bool private lock;  // 재진입 방지용 락 변수

    function withdraw(uint256 amount) external {
        require(!lock, "is now working on");  // (방법 2) 재진입 방지: 함수 시작 시점에 락 설정
        lock = true;

        uint256 balance = balanceOf[msg.sender];
        require(balance > 0, "insufficient balance");

        //balanceOf[msg.sender] = 0;  // (방법 1) 상태 변경: 재진입 공격 방어

        (bool success, ) = msg.sender.call{value: amount}("");  // 호출자에게 제어권을 이동 (재진입 가능!)
        require(success, "failed to send native token");

        balanceOf[msg.sender] = 0;  // 재진입 방지를 위해 위치 이동
        lock = false;  // (방법 2) 재진입 방지: 함수 종료 시점에 락 해제

        //require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        ////payable(msg.sender).transfer(amount);
        //(bool success, ) = msg.sender.call{value: amount}("");
        //balanceOf[msg.sender] -= amount;
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}
