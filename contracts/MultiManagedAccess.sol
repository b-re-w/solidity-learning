// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


contract MultiManagedAccess {
    uint constant MANAGER_NUMBERS = 5;
    //uint immutable BACKUP_MANAGER_INDEX;  // 가변으로 하고 싶은 경우

    address public god;  // 배포자
    address[MANAGER_NUMBERS] public managers;  // 관리자들
    bool[MANAGER_NUMBERS] public confirmations;  // 각 관리자의 승인 상태

    constructor(address _god, address[] memory _managers) {
        god = _god;
        for (uint i = 0; i < _managers.length; i++) {
            managers[i] = _managers[i];
        }
    }

    modifier onlyGod() {
        // 소유자만 실행 가능
        require(msg.sender == god, "You are not authorized! Only god can call this function");
        _;
    }

    function setManager(uint idx, address newManager) external onlyGod {
        // 관리자 변경
        managers[idx] = newManager;
    }

    function isManager(address addr) internal view returns (bool) {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (managers[i] == addr) {
                return true;
            }
        }
        return false;
    }

    modifier onlyManager() {
        require(
            isManager(msg.sender),
            "You are not authorized! Only managers can call this function"
        );
        _;
    }

    function allConfirmed() internal view returns (bool) {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (!confirmations[i]) {
                return false;
            }
        }
        return true;
    }

    modifier onlyAllConfirmed() {
        require(allConfirmed(), "Not all managers have confirmed");
        resetConfirmations();
        _;
    }

    function confirm() external {
        bool found = false;
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (managers[i] == msg.sender) {
                confirmations[i] = true;
                found = true;
                break;
            }
        }
        require(found, "You are not authorized! Only managers can confirm");
    }

    function resetConfirmations() internal {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            confirmations[i] = false;
        }
    }
}
