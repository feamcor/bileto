# BILETO

[![Build Status](https://travis-ci.org/feamcor/bileto.svg?branch=master)](https://travis-ci.org/feamcor/bileto)

[Bileto](https://en.wiktionary.org/wiki/bileto) is a decentralized ticket store for the Ethereum blockchain.

- [BILETO](#bileto)
  - [INTRODUCTION](#introduction)
    - [ORIGINS](#origins)
  - [HIGH-LEVEL SOLUTION](#high-level-solution)
  - [INSTALLATION](#installation)
    - [INSTALLING THE DAPP (development build)](#installing-the-dapp-development-build)
    - [INSTALLING THE DAPP (production build)](#installing-the-dapp-production-build)
  - [ROADMAP](#roadmap)

## INTRODUCTION

**Bileto** is a set of smart contracts, written in [Solidity](https://solidity.readthedocs.io/en/v0.5.3/index.html) [0.5.3](https://github.com/ethereum/solidity/releases/tag/v0.5.3), which implement the business of a ticket store. It is accompanied by a decentralized [web3](https://blockchainhub.net/web3-decentralized-web)-enabled application ([DApp](https://ethereum.stackexchange.com/questions/383/what-is-a-dapp)) where users, according to their roles, can manage the store, its events and perform ticket purchases, cancellations, refunds and event check-in.

**Bileto** can be deployed to an [Ethereum](https://ethereum.org) blockchain, be it the public [mainnet](https://etherscan.io), a public testnet like [Rinkeby](https://rinkeby.etherscan.io), a private network, or on a local development blockchain like [Ganache](https://truffleframework.com/ganache).

As currency for ticket purchases, so far, Bileto uses Ethereum's native [Ether](https://www.ethereum.org/ether).

### ORIGINS

**Bileto** was initially developed as [my](https://github.com/feamcor) [final project](https://github.com/dev-bootcamp-2019/final-project-feamcor) for the [ConsenSys Academy Developer Program Bootcamp](https://consensys.net/academy/bootcamp), cohort of [Fall/Winter 2018](https://courses.consensys.net/courses/course-v1:ConsenSysAcademy+2018DP+2/about).

This repo, as a way of learning and improving my skills on blockchain development, holds all the changes performed after the bootcamp: bug fixing, refactoring, new features, adoption of best practices and improvements on the user experience.

## HIGH-LEVEL SOLUTION

TBD

## INSTALLATION

TBD

### INSTALLING THE DAPP (development build)

TBD

### INSTALLING THE DAPP (production build)

TBD

## ROADMAP

The following list doesn't imply on order of implementation.

- [ ] Allow different kinds of tickets, with distinct prices.
- [ ] Allow assignment of seats.
- [ ] Allow to increase or decrease number of tickets available for sale.
- [ ] Allow multiple accounts to manage the store subject to multi-sig protocol.
- [ ] Allow multiple accounts to manage an event subject to multi-sig protocol.
- [ ] Allow store balance to be distributed to many accounts.
- [ ] Allow event balance to be distributed to many accounts.
- [ ] Split contract between store and events.
- [ ] Replace store currency from Ether to a utility token.
- [ ] Integrate customer identification with uPort or other identity provider.
- [ ] Turn tickets into [ERC-721](https://eips.ethereum.org/EIPS/eip-721) NFT deeds.
      _etc._
