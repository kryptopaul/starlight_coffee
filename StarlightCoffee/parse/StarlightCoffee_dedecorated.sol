// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.0;

contract StarlightCoffee {
address public owner;
mapping(uint256 => uint256) public balances;

constructor() {
owner = msg.sender;
}

function addPoints(uint256 user, uint256 points) public {
require(msg.sender == owner);
balances[user] += points;
}

function spendPoints(uint256 user, uint256 points) public {
require(msg.sender == owner);
balances[user] -= points;
}


}
