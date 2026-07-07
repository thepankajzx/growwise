const booksData = [
    {
        id: "wealth",
        category: "Wealth & Finance",
        icon: "dollar-sign",
        books: [
            {
                id: "book-1",
                title: "The Psychology of Money",
                author: "Morgan Housel",
                cover: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "No One's Crazy", explanation: "People make financial decisions based on their own unique generation, upbringing, and experiences. What seems crazy to you makes perfect sense to them.", approach: "Stop judging others' financial decisions. Recognize your own money biases and understand they are heavily influenced by when and where you were born." },
                    { tabTitle: "Concept 2", title: "Luck & Risk", explanation: "Success is never entirely due to hard work, and failure is never entirely due to laziness. Luck and risk are siblings.", approach: "Focus less on specific individuals' extreme success and more on broad patterns. Forgive yourself for failures outside your control." },
                    { tabTitle: "Concept 3", title: "Never Enough", explanation: "The hardest financial skill is getting the goalpost to stop moving. Comparing yourself to others guarantees misery.", approach: "Define what 'enough' means for you financially. Stop risking what you have and need for what you don't have and don't need." },
                    { tabTitle: "Concept 4", title: "Confounding Compounding", explanation: "Warren Buffett's wealth isn't just because he's a good investor, but because he's been investing since he was a child. Time is the secret.", approach: "Start investing as early as possible. Let the math of compounding work for decades instead of seeking quick, high returns." },
                    { tabTitle: "Concept 5", title: "Getting Wealthy vs. Staying Wealthy", explanation: "Getting money requires taking risks and being optimistic. Keeping money requires paranoia and fear.", approach: "Adopt a dual mindset: be optimistic about the long-term future, but extremely paranoid about short-term risks that could wipe you out." },
                    { tabTitle: "Concept 6", title: "Tails, You Win", explanation: "A small number of massive successes account for the majority of wealth. You can be wrong half the time and still make a fortune.", approach: "Diversify your bets. Don't panic when individual investments fail; ensure you are exposed to the few 'tail events' that drive all the returns." },
                    { tabTitle: "Concept 7", title: "Freedom is the Highest Dividend", explanation: "The greatest intrinsic value of money is its ability to give you control over your time.", approach: "Use money to buy autonomy, not luxury goods. Having an emergency fund gives you the freedom to quit a toxic job or wait for a good opportunity." },
                    { tabTitle: "Concept 8", title: "Man in the Car Paradox", explanation: "When you see someone driving a Ferrari, you don't admire the driver. You imagine *yourself* in the Ferrari. Wealth doesn't bring respect.", approach: "Stop using flashy items to seek admiration. True respect and admiration are earned through humility, kindness, and empathy, not horsepower." },
                    { tabTitle: "Concept 9", title: "Wealth is What You Don't See", explanation: "Rich is current income (the fancy car). Wealth is the money not spent (the investment portfolio).", approach: "Build actual wealth by increasing the gap between your ego and your income. Save the money instead of upgrading your lifestyle." },
                    { tabTitle: "Concept 10", title: "Save Money", explanation: "You don't need a specific reason to save. Saving is simply a hedge against life's inevitable ability to surprise you.", approach: "Save aggressively just for the sake of saving. Treat savings as the cost of buying a buffer against the unpredictability of the world." }
                ]
            },
            {
                id: "book-2",
                title: "Rich Dad Poor Dad",
                author: "Robert Kiyosaki",
                cover: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "The Rich Don't Work for Money", explanation: "The poor and middle class work for money. The rich have money work for them through assets.", approach: "Stop trading time for a paycheck as your only strategy. Focus on acquiring assets that generate passive income." },
                    { tabTitle: "Concept 2", title: "Financial Literacy", explanation: "It's not how much money you make; it's how much money you keep. Accounting and financial literacy are the foundation of wealth.", approach: "Learn to read an income statement and balance sheet. Understand the flow of cash in your personal life." },
                    { tabTitle: "Concept 3", title: "Assets vs. Liabilities", explanation: "An asset puts money in your pocket. A liability takes money out of your pocket. The middle class buys liabilities thinking they are assets (e.g., a primary home).", approach: "Audit your spending. Strictly limit buying liabilities and redirect that capital into income-producing assets like stocks, real estate, or businesses." },
                    { tabTitle: "Concept 4", title: "Mind Your Own Business", explanation: "Your profession is how you pay the bills. Your business is your asset column. Don't spend your whole life working for someone else's business.", approach: "Keep your daytime job, but start building your asset column on the side. Create a side hustle or invest heavily." },
                    { tabTitle: "Concept 5", title: "The History of Taxes", explanation: "Taxes originally targeted only the rich, but eventually expanded to the middle class. The rich use corporations to protect their wealth.", approach: "Educate yourself on tax codes and corporate structures. Use legal tax advantages to minimize your burden and protect your assets." },
                    { tabTitle: "Concept 6", title: "The Rich Invent Money", explanation: "Opportunities are not seen with your eyes, they are seen with your mind. Financial intelligence allows you to see deals others miss.", approach: "Train your mind to spot market inefficiencies. Learn how to structure a deal rather than just saving money in a bank account." },
                    { tabTitle: "Concept 7", title: "Work to Learn, Not for Money", explanation: "Job security means everything to the poor dad. Learning means everything to the rich dad.", approach: "Take jobs for the skills they will teach you (sales, marketing, leadership, communication) rather than the salary they offer." },
                    { tabTitle: "Concept 8", title: "Overcoming Fear", explanation: "The primary difference between a rich person and a poor person is how they manage fear, especially the fear of losing money.", approach: "Acknowledge that failure is part of the process of success. Play to win instead of playing not to lose." },
                    { tabTitle: "Concept 9", title: "Overcoming Cynicism", explanation: "Cynics criticize, and winners analyze. Doubt and 'Chicken Little' thinking keep people poor.", approach: "When analyzing an opportunity, ask 'How can I afford this?' instead of stating 'I can't afford this.' Force your brain to find solutions." },
                    { tabTitle: "Concept 10", title: "The Power of Choosing", explanation: "You have the power to choose what you do with your time, your money, and what you put in your head.", approach: "Invest heavily in your financial education before investing in markets. Read, attend seminars, and surround yourself with smart people." }
                ]
            },
            {
                id: "book-3",
                title: "Think and Grow Rich",
                author: "Napoleon Hill",
                cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "Desire", explanation: "Wishing will not bring riches. Only a burning, pulsating desire that transcends everything else will.", approach: "Write down the exact amount of money you desire, the date you want it by, and exactly what you will give in return. Read it aloud twice daily." },
                    { tabTitle: "Concept 2", title: "Faith", explanation: "Faith is the head chemist of the mind. When blended with desire, the subconscious instantly translates it into its spiritual equivalent.", approach: "Visualize yourself already in possession of your goal. Force your mind to experience the emotions of success before it happens." },
                    { tabTitle: "Concept 3", title: "Autosuggestion", explanation: "You can influence your subconscious mind through repeated instructions. It's the agency of control through which you voluntarily feed your subconscious.", approach: "Repeat affirmations daily. Speak them with absolute conviction and emotion to bypass the critical conscious mind." },
                    { tabTitle: "Concept 4", title: "Specialized Knowledge", explanation: "General knowledge has little use in the accumulation of money. Knowledge is only potential power until organized into definite plans of action.", approach: "Identify the exact specialized knowledge you need to succeed. If you don't have it, assemble a 'Master Mind' group of people who do." },
                    { tabTitle: "Concept 5", title: "Imagination", explanation: "The imagination is the workshop of the mind. It is where all plans are created. Wealth is created through ideas.", approach: "Exercise your synthetic imagination (rearranging old ideas) and creative imagination (receiving flashes of insight). Spend 30 minutes daily just thinking." },
                    { tabTitle: "Concept 6", title: "Organized Planning", explanation: "No individual has sufficient experience or education to accumulate a great fortune without the cooperation of other people.", approach: "Create a practical, workable plan. If your first plan fails, replace it with a new one. Quitting is the only permanent failure." },
                    { tabTitle: "Concept 7", title: "Decision", explanation: "Analysis of wealthy individuals shows they reach decisions promptly and change them slowly, if at all.", approach: "Stop being influenced by the opinions of others. When you have the facts, make a firm decision and stick to your course." },
                    { tabTitle: "Concept 8", title: "Persistence", explanation: "Persistence is to the character of man as carbon is to steel. It is the sustained effort necessary to induce faith.", approach: "Cultivate persistence by having a definite purpose, a definite plan, a closed mind against negativity, and a supportive alliance." },
                    { tabTitle: "Concept 9", title: "The Master Mind", explanation: "The coordination of knowledge and effort between two or more people, in a spirit of harmony, for the attainment of a definite purpose.", approach: "Form a group of 2-5 like-minded, ambitious individuals. Meet regularly to share ideas, pool resources, and hold each other accountable." },
                    { tabTitle: "Concept 10", title: "The Subconscious Mind", explanation: "The subconscious mind works day and night. It will translate negative or positive thoughts into reality with equal speed.", approach: "Protect your subconscious from negative influences (fear, jealousy, anger). Deliberately plant thoughts of wealth, success, and courage." }
                ]
            },
            {
                id: "book-4",
                title: "Atomic Habits",
                author: "James Clear",
                cover: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "1% Better Every Day", explanation: "Habits are the compound interest of self-improvement. A 1% improvement daily results in being 37x better after a year.", approach: "Stop looking for massive transformations. Identify tiny, manageable tweaks you can make to your daily routine." },
                    { tabTitle: "Concept 2", title: "Systems > Goals", explanation: "Goals are about the results you want to achieve. Systems are about the processes that lead to those results.", approach: "Instead of setting a goal to lose 10 lbs, build a system to never miss a workout. Fix the inputs, and the outputs fix themselves." },
                    { tabTitle: "Concept 3", title: "Identity-Based Habits", explanation: "True behavior change is identity change. You don't want to read a book; you want to become a reader.", approach: "Decide the type of person you want to be. Prove it to yourself with small wins. Say 'I am a runner' instead of 'I want to run'." },
                    { tabTitle: "Concept 4", title: "Make it Obvious", explanation: "The 1st Law of Behavior Change. Environmental design is more powerful than motivation.", approach: "Use Implementation Intentions: 'I will [BEHAVIOR] at [TIME] in [LOCATION]'. Put your guitar in the middle of the living room." },
                    { tabTitle: "Concept 5", title: "Habit Stacking", explanation: "Tying a new habit to an existing one uses the momentum of current behaviors to build new ones.", approach: "Formula: 'After I [CURRENT HABIT], I will [NEW HABIT].' (e.g., After I pour my coffee, I will meditate for 1 minute)." },
                    { tabTitle: "Concept 6", title: "Make it Attractive", explanation: "The 2nd Law of Behavior Change. Dopamine spikes when we anticipate a reward, not just when we receive it.", approach: "Use Temptation Bundling. Link an action you *want* to do with an action you *need* to do. (e.g., Only watch Netflix while on the treadmill)." },
                    { tabTitle: "Concept 7", title: "Make it Easy", explanation: "The 3rd Law of Behavior Change. Human nature follows the Law of Least Effort. Reduce the friction associated with good behaviors.", approach: "Prime your environment. Chop vegetables on Sunday so eating healthy on Wednesday is effortless. Reduce the steps between you and the habit." },
                    { tabTitle: "Concept 8", title: "The 2-Minute Rule", explanation: "When you start a new habit, it should take less than two minutes to do.", approach: "Scale down the habit. 'Read before bed' becomes 'Read one page.' Master the art of showing up before optimizing." },
                    { tabTitle: "Concept 9", title: "Make it Satisfying", explanation: "The 4th Law of Behavior Change. We repeat behaviors that are immediately rewarded.", approach: "Give yourself an immediate, tangible reward when you complete a hard habit. Use a habit tracker to visually see your streak." },
                    { tabTitle: "Concept 10", title: "Never Miss Twice", explanation: "Mistakes happen. But the first mistake is never the one that ruins you. It is the spiral of repeated mistakes that follows.", approach: "If you miss a day at the gym or eat a bad meal, immediately get back on track the next day. Reclaim your identity." }
                ]
            }
        ]
    },
    {
        id: "productivity",
        category: "Productivity",
        icon: "zap",
        books: [
            {
                id: "book-5",
                title: "Deep Work",
                author: "Cal Newport",
                cover: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "Deep vs. Shallow Work", explanation: "Deep work is cognitively demanding and creates new value. Shallow work is logistical, easily replicable, and low value (e.g., emails).", approach: "Audit your week. Radically reduce the hours spent on shallow work to make space for deep, focused sessions." },
                    { tabTitle: "Concept 2", title: "The Deep Work Equation", explanation: "High-Quality Work Produced = (Time Spent) x (Intensity of Focus).", approach: "Stop trying to work 10 hours a day. Instead, work for 3-4 hours with absolute, zero-distraction intensity." },
                    { tabTitle: "Concept 3", title: "Attention Residue", explanation: "When you switch from Task A to Task B, your attention doesn't immediately follow; a residue remains stuck on Task A.", approach: "Stop multi-tasking. Group similar tasks together (batching) and finish a task completely before looking at your inbox." },
                    { tabTitle: "Concept 4", title: "The Bimodal Philosophy", explanation: "Dividing your time into clearly defined stretches of deep work and stretches where you are available for everything else.", approach: "Schedule 'monastic' days or weeks where you are completely unreachable, and 'open' periods where you handle admin." },
                    { tabTitle: "Concept 5", title: "Embrace Boredom", explanation: "If you are addicted to checking your phone every time you are bored, your brain loses the ability for deep focus.", approach: "Practice doing absolutely nothing. Stand in line without your phone. Train your brain to tolerate the absence of novel stimuli." },
                    { tabTitle: "Concept 6", title: "Quit Social Media", explanation: "Network tools fragment your time and reduce your capacity to concentrate.", approach: "Take a 30-day detox. After 30 days, ask: Did this tool bring significant value to my life? If no, delete it permanently." },
                    { tabTitle: "Concept 7", title: "Drain the Shallows", explanation: "Most of the shallow work you do doesn't actually matter to your bottom line.", approach: "Ask your boss for a 'shallow work budget' (e.g., 20% of your time). Push back on unnecessary meetings and say 'no' ruthlessly." },
                    { tabTitle: "Concept 8", title: "Fixed-Schedule Productivity", explanation: "Setting a firm cut-off time for your workday forces you to be ruthless with your time during the day.", approach: "Commit to ending work at 5:30 PM every day. Let the artificial constraint force you to drop low-value activities." },
                    { tabTitle: "Concept 9", title: "The 4 Disciplines of Execution", explanation: "Focus on the wildly important, act on lead measures, keep a scoreboard, and create accountability.", approach: "Define one highly ambitious Deep Work goal. Track the hours you spend in deep work (the lead measure) rather than the outcome." },
                    { tabTitle: "Concept 10", title: "Shutdown Ritual", explanation: "Your brain needs a clear signal that work is over so it can recharge for the next day's deep work.", approach: "End each day by reviewing tasks, planning tomorrow, and verbally saying 'Shutdown complete' to close the psychological loop." }
                ]
            },
            {
                id: "book-6",
                title: "Getting Things Done",
                author: "David Allen",
                cover: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "Mind Like Water", explanation: "Your brain is for having ideas, not holding them. You achieve peace when your mind is completely clear of to-dos.", approach: "Do a 'mind sweep'. Write down every single open loop, task, and idea currently in your head into an external system." },
                    { tabTitle: "Concept 2", title: "Capture Everything", explanation: "If it's on your mind, your mind isn't clear. Capture 100% of the 'stuff' in a trusted inbox.", approach: "Carry a notebook or use an app. The moment a task or idea pops into your head, capture it immediately. Don't process it yet." },
                    { tabTitle: "Concept 3", title: "Clarify", explanation: "Emptying your inbox requires asking one question: 'Is it actionable?'", approach: "If yes, define the very next physical action. If no, trash it, incubate it (someday/maybe), or file it as reference material." },
                    { tabTitle: "Concept 4", title: "The 2-Minute Rule", explanation: "If an action will take less than two minutes, it should be done immediately when it is first defined.", approach: "Don't write down 2-minute tasks. Just do them right then and there to clear them from your queue." },
                    { tabTitle: "Concept 5", title: "Organize", explanation: "Sorting actions into proper categories: Projects, Next Actions, Waiting For, and Calendar.", approach: "Use context tags for Next Actions (e.g., @computer, @errands, @office) so you only see the tasks you can actually do right now." },
                    { tabTitle: "Concept 6", title: "Projects vs. Actions", explanation: "You cannot 'do' a project. You can only do an action. A project is anything requiring more than one step.", approach: "Break every project down into its component Next Actions. Define exactly what the very next physical step looks like." },
                    { tabTitle: "Concept 7", title: "The Weekly Review", explanation: "The critical success factor in GTD. Once a week, you must review and update your entire system.", approach: "Schedule 1 hour every Friday afternoon to clear your inboxes, review your lists, update projects, and plan the upcoming week." },
                    { tabTitle: "Concept 8", title: "Engage", explanation: "Choosing what to do next based on four criteria: Context, Time Available, Energy Available, and Priority.", approach: "Look at your context lists. If you are tired and have 10 minutes, pick a low-energy task from the @phone list." },
                    { tabTitle: "Concept 9", title: "The Tickler File", explanation: "A physical or digital system to send reminders to your future self.", approach: "If a concert ticket goes on sale in 43 days, put a reminder in a file for day 43. Forget about it completely until that day arrives." },
                    { tabTitle: "Concept 10", title: "Someday/Maybe Lists", explanation: "A parking lot for projects and ideas you might want to do in the future, but have no commitment to right now.", approach: "Keep your active lists clean. Move 'Learn to play piano' to Someday/Maybe. Review this list monthly." }
                ]
            },
            {
                id: "book-7",
                title: "Essentialism",
                author: "Greg McKeown",
                cover: "https://images.unsplash.com/photo-1506784951209-4522928fc002?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "Less But Better", explanation: "The core mindset of an Essentialist. It is about making the wisest possible investment of your time and energy.", approach: "Stop trying to do it all. Identify the vital few things that matter most and eliminate the trivial many." },
                    { tabTitle: "Concept 2", title: "The Power of Choice", explanation: "We often forget that we have the ability to choose. When we surrender our right to choose, others choose for us.", approach: "Reclaim your agency. Say 'I choose to' instead of 'I have to'. Acknowledge the trade-offs of every decision." },
                    { tabTitle: "Concept 3", title: "The 90 Percent Rule", explanation: "When evaluating an option, score it between 0 and 100. If it scores lower than 90, automatically change it to 0 and reject it.", approach: "Apply extreme criteria to opportunities. If it's not a 'Hell yes!', it's a 'No'." },
                    { tabTitle: "Concept 4", title: "The Un-Commitment", explanation: "Sunk-cost bias keeps us doing things that no longer serve us. You must learn how to cut your losses.", approach: "Ask yourself: 'If I wasn't already invested in this project, how hard would I work to get into it today?' If the answer is 'Not hard', quit." },
                    { tabTitle: "Concept 5", title: "Editing Your Life", explanation: "Just as a movie editor cuts good scenes to make a great movie, you must edit your life.", approach: "Regularly audit your commitments. Be ruthless in cutting out meetings, obligations, and relationships that distract from your essential goal." },
                    { tabTitle: "Concept 6", title: "The Power of a Graceful 'No'", explanation: "People respect you more when you have boundaries. Saying no is an essential leadership skill.", approach: "Separate the decision from the relationship. Offer a polite but firm decline: 'I am honored, but my current commitments prevent me from participating.'" },
                    { tabTitle: "Concept 7", title: "Sleep is for High Performers", explanation: "Sleep is not a luxury; it is the ultimate performance enhancer. Protecting your asset (you) is essential.", approach: "Schedule 8 hours of sleep. Treat it as an unbreakable appointment with yourself. Fatigue makes cowards of us all." },
                    { tabTitle: "Concept 8", title: "Create Buffers", explanation: "The Non-Essentialist assumes the best-case scenario. The Essentialist expects the unexpected.", approach: "Add a 50% buffer to your time estimates. If you think a project will take 2 weeks, give yourself 3 weeks to account for friction." },
                    { tabTitle: "Concept 9", title: "Remove Obstacles", explanation: "Instead of pushing harder, find what is holding you back and remove it.", approach: "Identify the 'slowest hiker' in your workflow. Focus all your energy on removing that specific bottleneck rather than applying brute force." },
                    { tabTitle: "Concept 10", title: "Small Wins", explanation: "Don't go for the flashy, massive victory. Go for small, incremental progress in the essential direction.", approach: "Set micro-goals. Celebrate the smallest possible unit of progress to build momentum and psychological capital." }
                ]
            }
        ]
    },
    {
        id: "mindset",
        category: "Mindset & Growth",
        icon: "brain",
        books: [
            {
                id: "book-8",
                title: "Mindset",
                author: "Carol S. Dweck",
                cover: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "Fixed vs. Growth", explanation: "A fixed mindset believes traits are carved in stone. A growth mindset believes abilities can be developed through dedication.", approach: "Catch yourself thinking 'I'm not good at this.' Immediately add the word 'YET' to the end of the sentence." },
                    { tabTitle: "Concept 2", title: "The Danger of Praise", explanation: "Praising intelligence ('You're so smart!') fosters a fixed mindset. It makes people fear failure.", approach: "Praise the *process*, effort, and strategy, not the person's inherent traits. 'I love how hard you worked on that problem.'" },
                    { tabTitle: "Concept 3", title: "Redefining Failure", explanation: "In a fixed mindset, failure defines you as a loser. In a growth mindset, failure is just information on how to improve.", approach: "After a setback, write down three specific lessons you learned. Treat the failure as a data point, not an identity." },
                    { tabTitle: "Concept 4", title: "The Power of 'Yet'", explanation: "Understanding that the learning curve is ongoing. You haven't failed, you just haven't mastered it *yet*.", approach: "Use 'yet' as a mental override. Whenever you hit a wall, verbally remind yourself that mastery is a matter of time and effort." },
                    { tabTitle: "Concept 5", title: "Embracing Challenges", explanation: "Fixed mindsets avoid challenges to look smart. Growth mindsets seek challenges to get smarter.", approach: "Actively choose the harder task. When given an option, pick the one that forces you out of your comfort zone, even if you might fail." },
                    { tabTitle: "Concept 6", title: "Effort is the Path", explanation: "In a fixed mindset, having to exert effort means you lack talent. In a growth mindset, effort is what ignites talent.", approach: "Reframe your relationship with hard work. Recognize that feeling confused or exhausted means your brain is growing." },
                    { tabTitle: "Concept 7", title: "Learning from Criticism", explanation: "Fixed mindsets ignore useful negative feedback. Growth mindsets learn from it.", approach: "When criticized, pause for 5 seconds. Thank the person for the feedback. Extract the actionable advice and discard any personal attacks." },
                    { tabTitle: "Concept 8", title: "Success of Others", explanation: "Fixed mindsets feel threatened by the success of others. Growth mindsets find lessons and inspiration in it.", approach: "Find someone who is better than you at your field. Instead of feeling jealous, study them. Ask them how they achieved their success." },
                    { tabTitle: "Concept 9", title: "The CEO Disease", explanation: "Leaders with fixed mindsets surround themselves with yes-men because they need to be the smartest person in the room.", approach: "If you are a leader, reward employees who challenge your ideas. Create an environment where admitting mistakes is celebrated." },
                    { tabTitle: "Concept 10", title: "Changing Mindsets", explanation: "You are not locked into one mindset forever. You can choose to adopt a growth mindset at any moment.", approach: "Recognize your fixed mindset 'triggers' (e.g., trying something new, facing a deadline). When triggered, consciously choose the growth mindset voice." }
                ]
            },
            {
                id: "book-9",
                title: "The Subtle Art of Not Giving a F*ck",
                author: "Mark Manson",
                cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "The Backwards Law", explanation: "The desire for more positive experience is itself a negative experience. Accepting negative experience is a positive experience.", approach: "Stop chasing happiness. Accept that suffering is inevitable and focus on finding a meaningful struggle instead." },
                    { tabTitle: "Concept 2", title: "Choose Your F*cks", explanation: "You only have a limited amount of emotional energy. You must curate what you actually care about.", approach: "Audit your worries. If it won't matter in 5 years, stop giving a f*ck about it today. Reserve your energy for family, purpose, and health." },
                    { tabTitle: "Concept 3", title: "Happiness is a Problem", explanation: "Problems never stop; they merely get exchanged and upgraded. Happiness comes from solving problems, not avoiding them.", approach: "Stop trying to build a life with no problems. Try to build a life with *better* problems that you enjoy solving." },
                    { tabTitle: "Concept 4", title: "You Are Not Special", explanation: "The cultural obsession with being extraordinary is toxic. Most of us are average at most things, and that's fine.", approach: "Accept your mediocrity in the grand scheme of the universe. It frees you from the pressure to be amazing and lets you just be." },
                    { tabTitle: "Concept 5", title: "The Value of Suffering", explanation: "Pain serves a biological and psychological purpose. It tells us what to pay attention to.", approach: "When you feel pain (emotional or physical), don't numb it. Ask what it is trying to teach you about your values." },
                    { tabTitle: "Concept 6", title: "Radical Responsibility", explanation: "It may not be your fault that something happened to you, but it is always your responsibility how you react to it.", approach: "Take 100% ownership of your current situation. Stop blaming your parents, your boss, or society. Own your choices." },
                    { tabTitle: "Concept 7", title: "Shitty Values", explanation: "Pleasure, material success, always being right, and staying positive are terrible metrics for a good life.", approach: "Adopt better values: honesty, vulnerability, standing up for yourself, and curiosity. Base your life on things you can control." },
                    { tabTitle: "Concept 8", title: "You Are Wrong About Everything", explanation: "Certainty is the enemy of growth. We are all wrong, we are just slightly less wrong today than we were yesterday.", approach: "Hold your beliefs loosely. Actively seek out information that proves your current worldviews are incorrect." },
                    { tabTitle: "Concept 9", title: "The 'Do Something' Principle", explanation: "Action isn't just the effect of motivation; it's also the cause of it.", approach: "If you lack motivation, just do the smallest possible action related to your goal. The momentum of the action will create the motivation to continue." },
                    { tabTitle: "Concept 10", title: "Memento Mori", explanation: "Death is the only certainty. Keeping it in mind helps you realize how trivial most of your worries are.", approach: "Regularly contemplate your mortality. Use it as a filter to realize that fear of embarrassment or failure means nothing in the face of death." }
                ]
            },
            {
                id: "book-10",
                title: "Man's Search for Meaning",
                author: "Viktor E. Frankl",
                cover: "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&q=80&w=800",
                concepts: [
                    { tabTitle: "Concept 1", title: "The Last Human Freedom", explanation: "Everything can be taken from a man but one thing: the last of the human freedoms—to choose one's attitude in any given set of circumstances.", approach: "When faced with a situation you cannot change, focus entirely on changing your attitude towards it." },
                    { tabTitle: "Concept 2", title: "Meaning in Suffering", explanation: "Suffering ceases to be suffering at the moment it finds a meaning, such as the meaning of a sacrifice.", approach: "Find the 'why' in your pain. If you are struggling at work, frame it as a sacrifice for your family's well-being." },
                    { tabTitle: "Concept 3", title: "He Who Has a Why", explanation: "'He who has a *why* to live for can bear almost any *how*.' (Quoting Nietzsche).", approach: "Clearly define your life's ultimate purpose. Write it down and look at it every time you face extreme adversity." },
                    { tabTitle: "Concept 4", title: "Logotherapy", explanation: "Frankl's psychological theory: humanity's primary motivational force is the search for meaning, not pleasure (Freud) or power (Adler).", approach: "Stop chasing happiness directly. Pursue meaningful work, love, or courage, and happiness will ensue as a byproduct." },
                    { tabTitle: "Concept 5", title: "Three Sources of Meaning", explanation: "Meaning is found in three ways: 1) Creating a work or doing a deed. 2) Experiencing something or encountering someone (love). 3) The attitude we take toward unavoidable suffering.", approach: "If you feel lost, actively invest in one of these three areas. Create art, deepen a relationship, or face a fear with dignity." },
                    { tabTitle: "Concept 6", title: "The Tragic Triad", explanation: "Pain, guilt, and death are inescapable parts of the human condition.", approach: "Turn pain into achievement, guilt into the opportunity to change for the better, and life's transitoriness into an incentive to act responsibly." },
                    { tabTitle: "Concept 7", title: "Responsibility", explanation: "Freedom threatens to degenerate into arbitrariness unless it is lived in terms of responsibleness.", approach: "Do not just ask what you expect from life. Ask what life expects from you. Take responsibility for answering life's demands daily." },
                    { tabTitle: "Concept 8", title: "Love as the Highest Goal", explanation: "Love goes very far beyond the physical person of the beloved. It finds its deepest meaning in his spiritual being, his inner self.", approach: "Cultivate deep, selfless love for another human being. It is the ultimate salvation and provides meaning even when all else is lost." },
                    { tabTitle: "Concept 9", title: "The Existential Vacuum", explanation: "A widespread phenomenon in the modern world: the feeling of total emptiness and meaninglessness (the Sunday Neurosis).", approach: "Combat boredom and emptiness by taking up responsibilities. Volunteer, mentor someone, or dedicate yourself to a cause larger than yourself." },
                    { tabTitle: "Concept 10", title: "No One Can Do It For You", explanation: "Everyone has his own specific vocation or mission in life. Therein he cannot be replaced, nor can his life be repeated.", approach: "Stop trying to live someone else's life. Identify the unique task that *only* you can fulfill, and dedicate your life to it." }
                ]
            }
        ]
    }
];
