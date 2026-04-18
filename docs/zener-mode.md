# Zener Mode

A forced-choice perception task for the Sound Lab.

Purpose:
Test whether different audio conditions affect:
- calm
- confidence
- imagery
- response latency
- hit rate

This is not a proof engine.
This is an experiment layer.

---

## Deck Structure

Standard deck:
- 25 cards total
- 5 symbols
- 5 of each symbol

Symbols:
- circle
- cross
- wavy lines
- square
- star

Chance expectation:
- 20% correct over large enough trials

---

## Session Modes

### Mode A: Hidden Target
Target is selected randomly and hidden until response is locked.

Best for:
- clairvoyance-style forced choice
- clean single-user testing

### Mode B: Timed Impression
Target is hidden.
User gets a fixed window:
- e.g. 5 sec / 10 sec / 20 sec
Then responds.

Best for:
- speed/confidence comparisons

### Mode C: Image-First
User records first impression before choosing a symbol.

Best for:
- testing whether symbolic choice follows imagistic signal

### Mode D: Tone Condition Comparison
Run same number of trials under:
- silence
- neutral bed
- F10 shell
- F12 shell
- custom tone condition

Best for:
- comparing state conditions

---

## Recommended First Build

Start with:
- 25 trials
- hidden random target
- F12 shell
- no voice during trials
- short tone cue at trial start
- response confidence slider (1–5)

Log:
- trial number
- target
- guess
- hit/miss
- response time
- confidence
- notes

---

## Audio Recommendations for Zener Mode

Preferred shell:
- F12

Why:
- enough calm to reduce noise
- enough alertness to report clearly
- enough openness to permit image-first responses

Avoid:
- too sleepy
- too theatrical
- too emotionally loaded

During trial phase:
- maintain stable bed
- avoid major transitions
- avoid surprise sounds
- use consistent trial markers

---

## Trial Flow

1. settle into shell
2. begin block
3. play trial cue
4. present hidden target internally
5. wait fixed interval
6. collect guess
7. collect confidence
8. optional short reset cue
9. next trial

---

## Metrics

Per session:
- total hits
- hit rate
- average confidence
- hit rate by confidence
- average response time
- hit rate by shell
- hit rate by time window

Optional:
- compare first 10 vs last 10 trials
- compare image-first vs direct-symbol mode

---

## Guardrails

Do not:
- keep changing multiple variables at once
- infer huge meanings from one hot streak
- run until exhausted
- collapse disappointment into identity

Do:
- compare against baseline
- repeat conditions
- keep logs clean
- stop while still coherent

---

## Suggested First Experiments

### ZEN001
Silence vs neutral bed

### ZEN002
Neutral bed vs F10

### ZEN003
Neutral bed vs F12

### ZEN004
F12 with 5s vs 10s response window

### ZEN005
Direct guess vs image-first

---

## North Star

Zener mode is useful when it becomes boringly trackable.

The point is not to feel magical.
The point is to see whether a condition changes performance in a way worth taking seriously.
