export const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const contractABI = [
  "constructor()",
  "function manager() view returns (address)",
  "function players(uint256) view returns (address)",
  "function enter() payable",
  "function pickWinner()",
  "function getPlayers() view returns (address[])"
];
