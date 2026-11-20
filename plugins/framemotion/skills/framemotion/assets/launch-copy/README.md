# Launch copy check

`copy_check.py` checks a launch or update film's script before any picture: a stranger with the sound off must know by 3 s what the product is, then read one concrete thing per line, and end on the name and what to do. It reads English and Polish. FrameMotion's own code (MIT), written after the copy formula of [cinetic](../cinetic-kit/README.md) (MIT); no upstream code is used.

```bash
python3 copy_check.py script.txt              # launch film
python3 copy_check.py script.txt --kind update --name Kadr --json
```

A script is one line of the film per row, optionally timed in seconds: `0.4 | Kadr turns photos into short reels.` Lines `name: Kadr` and `kind: update` set the product and the kind; `#` starts a comment. A JSON file `{"name", "kind", "lines": [{"t", "text"}]}` works too.

| Check | Level | Fails when |
| --- | --- | --- |
| `long` | error | a line has more than 7 words |
| `vague`, `metaphor` | error | fancy or figurative words a customer would not say ("unleash", "seamless", "superpower", "rewolucyjny", "supermoc") |
| `slogan` | error | a slogan shape: "Meet X", "X meets Y", "Less X. More Y.", a question, an exclamation |
| `claims` | error | two sentences in one line |
| `name` | error | no line names the product (with a name given) |
| `what-it-is` | error | nothing says what the product is by 3 s; an update film has no "Name version" line by 3 s |
| `keyword`, `close`, `quantity` | warning | a one-word line; the film does not end on the name or what to do; "every", "always", "zawsze" that one example on screen cannot prove |

Exit code 0 pass, 1 errors. Untimed lines count as 1.5 s apart. The check reads words, not meaning: a PASS says the script is plain and short, not that it is true or good; claims still come from the product's own pages.
