// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    address public manager;
    
    struct Player {
        address payable playerAddress;
        string nickname;
    }
    
    Player[] public players;
    string public lastWinnerNickname;

    constructor() {
        manager = msg.sender;
    }

    function enter(string memory _nickname) public payable {
        require(msg.value >= 0.01 ether, "Minimum amount is 0.01 ether");
        require(bytes(_nickname).length > 0, "Nickname cannot be empty");
        players.push(Player(payable(msg.sender), _nickname));
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players.length)));
    }

    function pickWinner() public restricted {
        require(players.length > 0, "No players in the lottery");
        uint index = random() % players.length;
        
        lastWinnerNickname = players[index].nickname;
        players[index].playerAddress.transfer(address(this).balance);
        
        delete players; // Очищуємо масив для наступної гри
    }

    modifier restricted() {
        require(msg.sender == manager, "Only manager can call this");
        _;
    }

    function getPlayers() public view returns (Player[] memory) {
        return players;
    }
}
