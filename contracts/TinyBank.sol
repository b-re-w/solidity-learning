// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//import "./ManagedAccess.sol";
import "./ManagedAccess.sol";

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


contract TinyBank is ManagedAccess {
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    IMyToken public stakingToken;  // MyToken contract

    mapping(address => uint256) public lastClaimedBlock;
    uint256 defaultRewardPerBlock = 1e18; // 1 MT/block
    uint256 rewardPerBlock;

    mapping(address => uint256) public staked;  // user address => staked amount
    uint256 public totalStaked;  // total staked tokens

    constructor(IMyToken _stakingToken) ManagedAccess(msg.sender, msg.sender) {
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;  // 초기 보상 설정
    }

    // who, when?
    // totalStaked 0: genesis staking + lastClaimedBlock update
    modifier updateReward(address to) {  // internal default
        // 불공평한 구현 (임시)
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
            if (reward > 0) {
                stakingToken.mint(to, reward);
            }
        }
        lastClaimedBlock[to] = block.number;
        _;  // 함수 본문 실행
    }

    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyManager {
        // 보상 변경 (다중 서명 필요)
        rewardPerBlock = _rewardPerBlock;
    }

    function currentReward(address to) external view returns (uint256) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
            return reward;
        } else {
            return 0;
        }
    }

    function stake(uint256 amount) external updateReward(msg.sender) {
        // MyToken 토큰 예치
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        staked[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external updateReward(msg.sender) {
        // MyToken 토큰 인출
        require(staked[msg.sender] >= amount, "Insufficient staked tokens");
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        emit Withdrawn(msg.sender, amount);
    }
}
