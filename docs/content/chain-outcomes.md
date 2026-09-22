# The chain: how six dead ends become a walk

**Status:** proposal for review. Nothing here has been published to Sanity.
**Companion file:** `docs/content/chain-outcomes.json` (the machine-readable version).

## What this changes for a visitor

Right now the museum has three exhibits. You look at one, you make a choice, you read what happens — and then the corridor ends. You have to go back to the index yourself and pick another artifact, the way you'd back out of a dead-end hallway.

This proposal gives every one of the six endings a door. After you read what your choice did, the museum tells you which exhibit to see next, and it tells you *because of what you just chose*. Two visitors who choose differently at the same exhibit are sent to different rooms. The museum stops being three separate objects and becomes a route through a building.

It also gives every ending one to four **consequence tags** — short phrases like `borrowed-time` or `quiet-refusal` that describe what the ending did to your future rather than what the object was. These are collected as you walk and will later be composed into the personal "future" printed on your ticket (task T-010). They are the reason the ticket can say something specific about *you* instead of just listing rooms you entered.

## The walk, exhibit by exhibit

**The Vending Machine That Sells Extra Mondays** (The Civic Time Expansion Era)

- *Spend a plan* → "A paper Monday drops" → sends you to **the Telephone**.
  You have just been handed a day with someone else's chores already written on it. The telephone is where you can ask another version of yourself how that worked out.
- *Keep the weekend intact* → "The machine keeps humming" → sends you to **the Umbrella**.
  You kept your weekend. The museum shows you the object that stores what weekends were spent sheltering under.

**The Telephone for Calling Roads Not Taken** (The Counterfactual Communications Boom)

- *Call the life you declined* → "A familiar stranger answers" → sends you to **the Umbrella**.
  You leave holding a kitchen you never lived in. The umbrella is where this museum keeps the weather of households.
- *Hang up before it rings* → "A missed call arrives from you" → sends you to **the Vending Machine**.
  You now hold a date eleven years ahead that no calendar issued. The vending machine is the only exhibit that sells dates the official year never entered.

**The Umbrella That Remembers Every Storm** (The Domestic Weather Memory Era)

- *Open it indoors* → "The room rains back" → sends you to **the Telephone**.
  A voice called you inside, out of a storm that is no longer happening. The telephone answers voices like that one.
- *Leave it furled* → "The forecast forgets your name" → sends you to **the Vending Machine**.
  The weather has quietly deleted you from its records. The machine puts days back on a calendar for anyone willing to pay in plans.

## Where the loops are

The museum loops on purpose. You cannot walk it in a straight line and reach an exit, because it doesn't have one — that is the point of a museum of futures that never arrived. No ending ever sends you straight back to the exhibit you are standing in; the shortest possible return is two rooms away.

Three short loops (two exhibits each):

1. Vending Machine → *spend a plan* → Telephone → *hang up before it rings* → Vending Machine.
2. Vending Machine → *keep the weekend intact* → Umbrella → *leave it furled* → Vending Machine.
3. Telephone → *call the life you declined* → Umbrella → *open it indoors* → Telephone.

Two long loops that visit all three exhibits:

4. Vending Machine → *spend a plan* → Telephone → *call the life you declined* → Umbrella → *leave it furled* → Vending Machine.
5. Vending Machine → *keep the weekend intact* → Umbrella → *open it indoors* → Telephone → *hang up before it rings* → Vending Machine.

Every exhibit is reachable from two different endings, so no room can be stranded and no visitor can be stuck in a corner of the building. Loops 4 and 5 are the same triangle walked in opposite directions, which means the route you get depends entirely on whether you tend to act or tend to hold back.

One pattern worth noticing: of the three endings that follow a refusal — keeping the weekend, hanging up, leaving the umbrella furled — two return you to the vending machine. Decline something and the museum will, before long, offer to sell you time again.

## The tags and why some repeat

Four tags appear in two different endings each, always in two different wings. That repetition is deliberate: it is what will make a ticket read like a composed sentence instead of a shuffled list.

| Tag | Appears in | The rhyme |
|---|---|---|
| `quiet-refusal` | "The machine keeps humming", "A missed call arrives from you" | You declined, and something answered anyway. |
| `almost-recognized` | "A familiar stranger answers", "The room rains back" | A voice you know without being able to place. |
| `room-to-breathe` | "The machine keeps humming", "The forecast forgets your name" | Space opens where you expected to be counted. |
| `edited-without-asking` | "A paper Monday drops", "The forecast forgets your name" | Your record was changed and nobody consulted you. |

The full set, by ending:

- **A paper Monday drops** — `borrowed-time`, `accruing-interest`, `edited-without-asking`
- **The machine keeps humming** — `quiet-refusal`, `weekend-intact`, `room-to-breathe`
- **A familiar stranger answers** — `almost-recognized`, `another-life-answering`, `line-left-open`
- **A missed call arrives from you** — `quiet-refusal`, `future-already-calling`, `apology-not-required`
- **The room rains back** — `almost-recognized`, `weather-you-can-re-enter`, `shelter-returned`
- **The forecast forgets your name** — `room-to-breathe`, `edited-without-asking`, `unlisted-by-the-sky`

Each ending carries three tags, inside the schema's limit of four, leaving one slot free for a fourth exhibit later without any ending having to give something up.
