// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.0;

contract StarlightCoffee {
address public owner;
mapping(address => uint256) public balances;

constructor() {
owner = msg.sender;
}

function addPoints(address user, uint256 points) public {
require(msg.sender == owner);
balances[user] += points;
}

function spendPoints(address user, uint256 points) public {
require(msg.sender == owner);
balances[user] -= points;
}


}
