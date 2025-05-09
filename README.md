# TON Contract Its Wednesday My Dudes 🐸 📅

A **Tact v1.6.7** smart contract that turns the iconic meme into a weekly, on‑chain, community challenge on **The Open Network (TON)**.  Each Wednesday players cooperate to spell the phrase `ITSWEDNESDAYMYDUDES` one letter at a time.  Finish the phrase in order before the day is over and everyone who helped is celebrated on‑chain!

Contract: [EQCqEICNHjE7PZaoWrUty38VK8K-xeZ0_-_GXt_-dz0Guv4a](https://verifier.ton.org/EQCqEICNHjE7PZaoWrUty38VK8K-xeZ0_-_GXt_-dz0Guv4a)

## 🗂 Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## 🛠 How to use
* **Node.js ≥ 22** (required by `@tact-lang/compiler` ≥1.6.7)
* Build — `yarn blueprint build`
* Test — `yarn blueprint test`
* Deploy or run another script — `yarn blueprint run`

## 📜 Game Rules

1. **Wednesday‑only** – The contract rejects all moves on any other weekday with the message `Not Wednesday`.
2. **Single‑letter messages** – The message body must be **8 bits** long (one UTF‑8 byte).  Anything else is rejected with `Exactly one letter required`.
3. **Alphabet only** – Only letters `A–Z` (case‑insensitive) are accepted.
4. **Sequential order** – The letter must equal the next character of the phrase (`I`, then `T`, then `S`, …).
5. **One turn per address** – A wallet that already sent a correct letter this week cannot send another until the next game.
6. **Completion lock** – After a win the contract stores the current **week number** and ignores further moves until the following Wednesday.

## 🚀 Playing the Game

### From a Wallet

1. Open the contract address in your TON wallet.
2. Tap **Send transfer**.
3. Enter **0 TON** as the value.
4. In the *Comment* (payload) field type **one letter** – for example `I`.
5. Confirm the transaction.
6. Check the contract events – you should see `Got it!` or another status message.

### From Code (TypeScript example)

```ts
import { beginCell, toNano, Address, comment } from '@ton/core';
import { TonClient } from '@ton/ton';

const client = new TonClient({ endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC' });
const contract = Address.parse('<contract‑addr>');

await client.sendInternalMessage({
  to: contract,
  value: toNano('0.05'),
  body: comment('I')
});
```

## 🔍 Contract API

| Getter                    | Description                                             | Return type         |
| ------------------------- | ------------------------------------------------------- | ------------------- |
| `getProgress()`           | Current number of correct letters collected this week   | `uint5` (0–20)      |
| `getLastCompletionWeek()` | Week index of the most recent victory (Unix epoch week) | `uint14`            |
| `getParticipants()`       | Map of addresses that already sent a correct letter     | `map<Address,bool>` |
