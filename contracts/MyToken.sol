// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManagedAccess.sol";

// Token: Smart contract based
// BTC, ETH, XRP, KAIA: Native Token (수수료는 네이티브로만)
// Smart Contract Token은 네이티브 x


contract MyToken is ManagedAccess {
    event Transfer(address indexed owner, address indexed to, uint256 value);
    // indexed: 필터링 가능 (최대 3개)
    event Approval(address indexed spender, uint256 value);

    string public name = "MyToken";  // 토큰 이름
    string public symbol = "MTK";  // 토큰 심볼
    uint8 public decimals = 18;  // 소수점 이하 자리수

    uint256 public totalSupply;  // 총 발행량
    mapping(address => uint256) public balanceOf;  // 각 주소의 잔액
    // - balanceOf(), totalSupply() 조회: 트랜잭션 X, 가스비 무료, 즉시 반환
    // - transfer(), _mint() 실행: 트랜잭션 O, 가스비 필요, 블록 생성 대기
    mapping(address => mapping(address => uint256)) public allowance;
    // owner => (spender => amount)

    constructor(
        string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply
    ) ManagedAccess(msg.sender, msg.sender) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        uint256 amount = _initialSupply * (10 ** uint256(decimals));  // 1,000,000 토큰 (소수점 고려)

        _mint(msg.sender, amount);  // 배포자(transaction sender)에게 총 발행량 할당
                                    // 토큰 추가 발행 불가 (고정 공급량)
        emit Transfer(address(0), msg.sender, amount);  // 발행 이벤트 (from: 0 주소)
    }

    function mint(address owner, uint256 amount) external onlyManager {
        // 토큰 발행 (보안 취약)
        _mint(owner, amount);
    }

    function _mint(address owner, uint256 amount) internal {
        // 토큰 발행
        totalSupply += amount;
        balanceOf[owner] += amount;
    }

    function faucet(uint256 amount) external {
        // 테스트용 토큰 무제한 발행
        _mint(msg.sender, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        // 토큰 전송 (트랜젝션) by owner
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);

        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        // 토큰 사용 권한 위임 (트랜젝션) by owner
        allowance[msg.sender][spender] = amount;
        emit Approval(spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        // 토큰 전송 (트랜젝션) by spender
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);

        return true;
    }
}


/*
approve
- allow spender address to send my token
transferFrom
- spender: owner -> target address

* token owner --> bank contract
* token owner --> router contract --> bank contract
* token owner --> router contract --> bank contract(multi contract)

*/
