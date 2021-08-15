https://github.com/nishchaysaxena1711/Crowdfundr

The following is a micro audit of git commit 91d027cae99966606831e4ffb2a3ab607f0c4e8d

CrowdfundrManager has many functions that proxy to Crowdfundr. This isn't necessary as anyone can call functions on new Crowdfundr contracts directly.

I see lots of extra features. That's fine for learning, but when you're working with a client / company you don't want to do add features they don't mention.

## issue-1

**[High]** Use of .transfer()

https://consensys.github.io/smart-contract-best-practices/recommendations/#dont-use-transfer-or-send


## issue-2

**[High]** Denial of Service vulnerability

https://consensys.github.io/smart-contract-best-practices/known_attacks/#dos-with-unexpected-revert

Use a pull system instead https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls


## issue-3

**[High]** Iteration over an arbitrarily large list

https://consensys.github.io/smart-contract-best-practices/known_attacks/#gas-limit-dos-on-a-contract-via-unbounded-operations


## Nitpicks

- Conventionally, function parameter names often have underscores, but state variables do not. Consider renaming `_projectId`, `_projectName`, etc. to be without underscores.
- `_minCreditAmount` should conventionally be cased as `MIN_CREDIT_AMOUNT`
