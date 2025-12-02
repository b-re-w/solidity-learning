# @version ^0.3.0
# @license MIT

event Transfer:
    owner: indexed(address)
    to: indexed(address)
    value: uint256

event Approval:
    spender: indexed(address)
    amount: uint256

name: public(String[64])
symbol: public(String[32])
decimals: public(uint256)
totalSupply: public(uint256)

balanceOf: public(HashMap[address, uint256])
allowances: public(HashMap[address, HashMap[address, uint256]])

@external
def __init__(_name: String[64], _symbol: String[32], _decimals: uint256, _initialSupply: uint256):
    self.name = _name
    self.symbol = _symbol
    self.decimals = _decimals
    self.totalSupply = _initialSupply * 10 ** _decimals
    self.balanceOf[msg.sender] = self.totalSupply  # mint to deployer

@external
def transfer(_to: address, _value: uint256):
    assert self.balanceOf[msg.sender] >= _value, "Insufficient balance"
    self.balanceOf[msg.sender] -= _value
    self.balanceOf[_to] += _value

    log Transfer(msg.sender, _to, _value)

@external
def approve(_spender: address, _value: uint256):
    assert self.balanceOf[msg.sender] >= _value, "Insufficient balance"
    self.allowances[msg.sender][_spender] += _value

    log Approval(_spender, _value)

@external
def transferFrom(_from: address, _to: address, _value: uint256):
    assert self.allowances[_from][msg.sender] >= _value, "Insufficient allowance"
    assert self.balanceOf[_from] >= _value, "Insufficient balance"
    self.allowances[_from][msg.sender] -= _value
    self.balanceOf[_from] -= _value
    self.balanceOf[_to] += _value

    log Transfer(_from, _to, _value)

@internal
def _mint(_amount: uint256, _to: address):
    self.totalSupply += _amount
    self.balanceOf[_to] += _amount

    log Transfer(ZERO_ADDRESS, _to, _amount)

@external
def mint(_amount: uint256, _to: address):
    self._mint(_amount, _to)

