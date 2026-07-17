const booksData = [
    {
        id: "wealth",
        category: "Wealth & Finance",
        books: [
            {
                id: "psychology-of-money",
                title: "The Psychology of Money",
                author: "Morgan Housel",
                concepts: [
                    {
                        title: "The Freedom Filter™",
                        htmlFile: "premium_content_2.html",
                        isPremium: true
                    }
                ]
            }
        ]
    },
    {
        id: "business",
        category: "Business & Strategy",
        books: []
    },
    {
        id: "productivity",
        category: "Productivity & Systems",
        books: []
    },
    {
        id: "self-improvement",
        category: "Self-Improvement",
        books: [
            {
                id: "atomic-habits",
                title: "Atomic Habits",
                author: "James Clear",
                concepts: [
                    {
                        title: "Systems Beat Goals",
                        markdown: "**Visual First:**\n\n```\n    GOAL            →    ACTS WHEN MOTIVATED   →    STOPS WHEN GOAL\n   \"Lose 10kg\"            ●  ●  ●  (gaps)             HIT OR MISSED\n\n    SYSTEM           →    ACTS REGARDLESS        →    CONTINUES\n   \"Walk daily\"            ●●●●●●●●● (no gaps)         PAST THE GOAL\n```\n\n*Read this alone: one path has gaps and an end point. The other has no gaps and no end point. That's the entire idea.*\n\n**Simple Explanation:** A goal tells you *where* to go. A system tells you *what to do today* — regardless of mood, energy, or how close you are to the finish line. Goals depend on motivation. Systems don't ask for it.\n\n**Why It Matters:** The moment a goal is hit — or missed — the reason to act disappears with it. A system has no finish line, so it never runs out of reasons to continue.\n\n**Real-Life Example:** Two coworkers both want to get fit. One sets a target: \"lose 10 kg by June.\" The other sets a process: \"walk 20 minutes every evening.\" By July, the first has stopped — goal met or abandoned, either way ends the habit. The second is still walking, because the walk was never tied to a number.\n\n**Common Mistake:** People think a bigger, more specific goal creates more motivation. It usually creates more pressure — and pressure fades faster than a simple daily action does.\n\n**Reflection Question:** Is your current habit tied to a finish line — or does it keep working after the finish line disappears?\n\n**Try This Today (2 minutes):** Take one goal you're chasing. Write the smallest daily action that moves you toward it. Do that action once, right now, before reading further.\n\n**Mental Model:** *Systems are the engine. Goals are just the destination painted on the map.*\n\n**Key Takeaway:** *You don't need a better goal — you need a system that doesn't care how you feel today.*",
                        isPremium: false
                    },
                    {
                        title: "You Become What You Repeat",
                        markdown: "**Visual First:**\n\n```\n    ACTION           →    EVIDENCE            →    IDENTITY\n   \"Wrote today\"           \"I did it again\"         \"I'm a writer\"\n        ↑                                                 │\n        └─────────────── makes next action easier ────────┘\n```\n\n*Read this alone: the arrow loops back. Each action feeds the next. That's the whole mechanism — no text needed.*\n\n**Simple Explanation:** Every small action isn't just progress toward a result — it's a vote for a certain identity. Enough votes, and that identity becomes who you *are*, not just what you're *trying to do*.\n\n**Why It Matters:** Behavior driven by identity doesn't need daily convincing. Someone who sees themselves as \"a person who writes\" isn't negotiating each morning — writing is just what they do.\n\n**Real-Life Example:** Someone cutting sugar says, \"I can't have that, I'm trying to cut sugar\" — a goal still under negotiation. Someone who says, \"I don't eat sugar\" — identity already settled — isn't negotiating at all. Same situation, completely different internal conversation.\n\n**Common Mistake:** People try to install identity through self-talk alone (\"I am a disciplined person\") with no evidence behind it. Identity isn't declared — it's built vote by vote, through repeated small actions.\n\n**Reflection Question:** If a stranger only watched your actions this week — not your intentions — what identity would they conclude you have?\n\n**Try This Today (3 minutes):** Complete the smallest visible version of one habit right now — something that leaves proof behind (a note written, a rep done, a page read). That's one vote cast.\n\n**Mental Model:** *Identity grows through evidence, not intention.*\n\n**Key Takeaway:** *Every action is a vote for the person you're becoming — cast one today.*",
                        isPremium: false
                    },
                    {
                        title: "Small Actions Compound — But Late",
                        markdown: "**Visual First:**\n\n```\nRESULTS\n   │                                             ● ← visible breakthrough\n   │                                        ●\n   │                                   ●\n   │                              ●\n   │                    ● ● ●\n   │  ●  ●  ●  ●  ●\n   └──────────────────────────────────────────── TIME\n       \"flat zone\" — most people quit here\n```\n\n*Read this alone: a long flat line, then a sudden rise. The lesson is the shape itself — effort doesn't look like progress until very late.*\n\n**Simple Explanation:** Small consistent actions don't produce small visible results in a straight line. They produce almost nothing for a long stretch — then a sudden, disproportionate payoff. Most people quit during the flat part, right before the curve bends upward.\n\n**Why It Matters:** If you expect results to arrive evenly, day one feels like failure and day thirty feels like a waste. Understanding the shape of the curve is what keeps you going through the flat part.\n\n**Real-Life Example:** Fifteen minutes of daily language practice feels pointless for weeks — nothing gets easier. Then, without any single dramatic study session, a conversation suddenly flows. The results were compounding invisibly the entire time.\n\n**Common Mistake:** People judge whether a habit is \"working\" based on the first two weeks — exactly the part of the curve where almost nothing is visible yet.\n\n**Reflection Question:** Are you currently in the flat zone of a habit you're about to quit?\n\n**Try This Today (5 minutes):** Pick a habit you've already started. Instead of checking for results, mark today as a number on a simple streak count. Judge the habit by the count, not by what's visibly changed.\n\n**Mental Model:** *Compounding is silent before it's obvious.*\n\n**Key Takeaway:** *The results are always further down the curve than you think — don't judge day ten by the standard of day one hundred.*",
                        isPremium: false
                    },
                    {
                        title: "Environment Beats Willpower",
                        markdown: "**Visual First:**\n\n```\n   HARD PATH                    →    EASY PATH\n   Junk food on counter              Fruit on counter\n   Phone on nightstand               Phone charges elsewhere\n   Book buried in bag                Book on pillow\n\n   Relies on willpower           →   Relies on default\n   (runs out by evening)             (works even exhausted)\n```\n\n*Read this alone: one column needs energy to resist, the other needs none. The comparison itself is the lesson.*\n\n**Simple Explanation:** You don't need more discipline to change behavior. You need to change what's easiest to reach. People default to the lowest-effort option available — so design your space to make the good option the lazy option.\n\n**Why It Matters:** Willpower is highest in the morning and lowest at night — exactly when most bad habits happen. An environment designed well doesn't rely on willpower at all, so it keeps working even when you're depleted.\n\n**Real-Life Example:** Someone struggling with late-night phone scrolling doesn't fix it by \"trying harder.\" They fix it by charging the phone in the kitchen overnight — the habit disappears not because willpower improved, but because the option became inconvenient.\n\n**Common Mistake:** People blame themselves for \"lacking discipline\" when the real issue is that the bad option was one step away and the good option was five steps away.\n\n**Reflection Question:** What's one habit you keep failing at because the wrong option is simply closer than the right one?\n\n**Try This Today (5 minutes):** Choose one habit you keep failing at. Physically move one object in your space right now — closer for the habit you want, farther for the one you don't.\n\n**Mental Model:** *Change your space before you try to change yourself.*\n\n**Key Takeaway:** *Willpower fluctuates. A well-designed environment doesn't.*",
                        isPremium: false
                    },
                    {
                        title: "The Habit Stress Test™",
                        htmlFile: "premium_content_1.html",
                        isPremium: true
                    }
                ]
            }
        ]
    }
];
