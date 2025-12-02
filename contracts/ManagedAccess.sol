// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


// Centralization vs Decentralization
// Distributed Ledger Technology (DLT)
// Governance
// - on-chain governance: voting


abstract contract ManagedAccess {
    address public god;  // 배포자
    address public manager;  // 관리자

    constructor(address _god, address _manager) {
        god = _god;
        manager = _manager;
    }

    modifier onlyGod() {
        // 소유자만 실행 가능
        require(msg.sender == god, "You are not authorized! Only god can call this function");
        _;
    }

    modifier onlyManager() {
        // 관리자만 실행 가능
        require(msg.sender == manager, "You are not authorized! Only manager can call this function");
        _;
    }

    function setManager(address newManager) external onlyGod {
        // 관리자 변경
        manager = newManager;
    }
}
