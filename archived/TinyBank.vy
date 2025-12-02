# @version ^0.3.0
# @license MIT

INIT_REWARD: constant(uint256) = 1 * 10 ** 18  # 1 token per block

interface IMyToken:
    def transfer(to: address, amount: uint256): nonpayable
    def transferFrom(owner: address, to: address, amount: uint256): nonpayable
    def mint(owner: address, amount: uint256): nonpayable

event Staked:
    user: indexed(address)
    amount: uint256

event Withdraw:
    user: indexed(address)
    amount: uint256

owner: public(address)
manager: public(address)

staked: public(HashMap[address, uint256])
totalStaked: public(uint256)

stakingToken: IMyToken

rewardPerBlock: uint256
lastClaimedBlock: HashMap[address, uint256]

@external
def __init__(stakingToken: IMyToken):
    self.stakingToken = stakingToken
    self.rewardPerBlock = INIT_REWARD
    self.owner = msg.sender
    self.manager = msg.sender

@internal
def onlyOwner(sender: address):
    assert sender == self.owner, "You are not authorized! Only god can call this function"

@internal
def onlyManager(sender: address):
    assert sender == self.manager, "You are not authorized! Only manager can call this function"

@external
def setManager(_newManager: address):
    self.onlyOwner(msg.sender)
    self.manager = _newManager

@external
def setRewardPerBlock(_amount: uint256):
    self.onlyManager(msg.sender)
    self.rewardPerBlock = _amount

@internal
def updateReward(to: address):
    if self.staked[to] > 0:
        blocks: uint256 = block.number - self.lastClaimedBlock[to]
        reward: uint256 = self.rewardPerBlock * blocks * self.staked[to] / self.totalStaked
        self.stakingToken.mint(to, reward)

    self.lastClaimedBlock[to] = block.number

@external
def stake(_amount: uint256):
    assert _amount > 0, "Amount must be greater than zero"
    self.updateReward(msg.sender)
    self.stakingToken.transferFrom(msg.sender, self, _amount)
    self.staked[msg.sender] += _amount
    self.totalStaked += _amount

    log Staked(msg.sender, _amount)

@external
def withdraw(_amount: uint256):
    assert self.staked[msg.sender] >= _amount, "Insufficient staked amount"
    self.updateReward(msg.sender)
    self.staked[msg.sender] -= _amount
    self.totalStaked -= _amount
    self.stakingToken.transfer(msg.sender, _amount)

    log Withdraw(msg.sender, _amount)
