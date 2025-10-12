// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Token: Smart contract based
// BTC, ETH, XRP, KAIA: Native Token (수수료는 네이티브로만)
// Smart Contract Token은 네이티브 x

contract MyToken {
    string public name = "MyToken";  // 토큰 이름
    string public symbol = "MTK";  // 토큰 심볼
    uint8 public decimals = 18;  // 소수점 이하 자리수

    uint256 public totalSupply;  // 총 발행량
    mapping(address => uint256) public balanceOf;  // 각 주소의 잔액

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        uint256 amount = 1000000 * (10 ** uint256(decimals));  // 1,000,000 토큰 (소수점 고려)

        _mint(msg.sender, amount);  // 배포자(transaction sender)에게 총 발행량 할당
                                    // 토큰 추가 발행 불가 (고정 공급량)
    }

    function _mint(address owner, uint256 amount) internal {
        // 토큰 발행
        totalSupply += amount;
        balanceOf[owner] += amount;
    }
}
