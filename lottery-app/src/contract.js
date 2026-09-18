export const contractABI = [
  "constructor()",
  "function manager() view returns (address)",
  "function lastWinnerNickname() view returns (string)",
  "function enter(string _nickname) payable",
  "function pickWinner()",
  "function getPlayers() view returns (tuple(address playerAddress, string nickname)[])"
];
