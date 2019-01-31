// These OpenZeppelin libraries expose "internal" functions
// which end up being linked inline with the caller contract.

// var Address = artifacts.require("./Address.sol");
// var Counter = artifacts.require("./Counter.sol");
// var SafeMath = artifacts.require("./SafeMath.sol");
var Bileto = artifacts.require("./Bileto.sol");

module.exports = function(deployer) {
  // deployer.deploy(Address);
  // deployer.deploy(Counter);
  // deployer.deploy(SafeMath);
  // deployer.link(Address, Bileto);
  // deployer.link(Counter, Bileto);
  // deployer.link(SafeMath, Bileto);
  deployer.deploy(Bileto);
};
