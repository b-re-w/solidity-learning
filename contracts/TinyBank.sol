// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// stacking
// deposit(MyToken) / withdraw(MyToken)

// MyToken: Token balance management
// - the balance of TinyBank address
// TinyBank: Deposit / Withdraw vault
// - user token management
// - user => deposit => TinyBank (contract address) => transfer(user to TinyBank)

// Reward
// - reward token: MyToken
// - reward resources: 1 MT/block minting
// - reward strategy: staked[user] / total staked distribution
//
// - signer0 block 0 staking
// - signer1 block 5 staking
// - 0-- 1- 2-- 3-- 4-- 5--
//   |                  |
// - signer0 10MT       signer1 10MT


interface IMyToken {
    function mint(address owner, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}


contract TinyBank {
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    IMyToken public stakingToken;  // MyToken contract

    mapping(address => uint256) public lastClaimedBlock;
    uint256 rewardPerBlock = 1e18; // 1 MT/block

    mapping(address => uint256) public staked;  // user address => staked amount
    uint256 public totalStaked;  // total staked tokens

    constructor(IMyToken _stakingToken) {
        stakingToken = _stakingToken;
    }

    // who, when?
    // totalStaked 0: genesis staking + lastClaimedBlock update
    function updateReward(address to) internal {
        // 불공평한 구현 (임시)
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
            if (reward > 0) {
                stakingToken.mint(to, reward);
            }
        }
        lastClaimedBlock[to] = block.number;
    }

    function stake(uint256 amount) external {
        // MyToken 토큰 예치
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        updateReward(msg.sender);
        staked[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        // MyToken 토큰 인출
        require(staked[msg.sender] >= amount, "Insufficient staked tokens");
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        updateReward(msg.sender);
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance() external view returns (uint256) {
        // 예치된 토큰 잔액 조회
        return staked[msg.sender];
    }
}
