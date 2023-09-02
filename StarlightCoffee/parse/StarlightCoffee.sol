// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.0;

contract StarlightCoffee {
    address public owner;
    secret mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function addPoints(secret address user, secret uint256 points) public {
        require(msg.sender == owner);
        balances[user] += points;
    }

    function spendPoints(secret address user, secret uint256 points) public {
        require(msg.sender == owner);
        balances[user] -= points;
    }


}
