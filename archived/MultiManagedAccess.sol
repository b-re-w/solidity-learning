// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


contract MultiManagedAccess {
    uint constant MAX_MANAGER = 5;
    uint public registeredManagers;
    //uint immutable BACKUP_MANAGER_INDEX;  // 가변으로 하고 싶은 경우

    address public god;  // 배포자
    address[MAX_MANAGER] public managers;  // 관리자들
    bool[MAX_MANAGER] public confirmations;  // 각 관리자의 승인 상태

    constructor(address _god, address[] memory _managers) {
        god = _god;
        for (uint i = 0; i < _managers.length; i++) {
            managers[i] = _managers[i];
        }
        registeredManagers = _managers.length;
    }

    modifier onlyGod() {
        // 소유자만 실행 가능
        require(msg.sender == god, "You are not authorized! Only god can call this function");
        _;
    }

    function setManager(uint idx, address newManager) external onlyGodOrAllConfirmed {
        // 관리자 변경
        managers[idx] = newManager;
        registeredManagers = registeredManagers > idx ? registeredManagers : idx + 1;
    }

    function addManager(address newManager) external onlyManager onlyAllConfirmed {
        // 관리자 추가
        require(registeredManagers < MAX_MANAGER, "Maximum number of managers reached");
        managers[registeredManagers] = newManager;
        registeredManagers++;
    }

    function isManager(address addr) internal view returns (bool) {
        for (uint i = 0; i < MAX_MANAGER; i++) {
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
        for (uint i = 0; i < registeredManagers; i++) {
            if (!confirmations[i]) {
                return false;
            }
        }
        return registeredManagers > 0; // 최소 한 명의 매니저가 있어야 함
    }

    modifier onlyGodOrAllConfirmed() {
        if (msg.sender != god) {
            require(
                isManager(msg.sender),
                "You are not authorized! Only managers can call this function"
            );
            require(allConfirmed(), "Not all managers have confirmed");
        }
        _;
    }

    modifier onlyAllConfirmed() {
        require(allConfirmed(), "Not all managers have confirmed yet");
        _;
        resetConfirmations();
    }

    function confirm() external {
        bool found = false;
        for (uint i = 0; i < MAX_MANAGER; i++) {
            if (managers[i] == msg.sender) {
                confirmations[i] = true;
                found = true;
                break;
            }
        }
        require(found, "You are not authorized! Only managers can confirm");
    }

    function resetConfirmations() internal {
        for (uint i = 0; i < MAX_MANAGER; i++) {
            confirmations[i] = false;
        }
    }
}
