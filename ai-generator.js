// AI Content Generator Module
// Placed in the Admin section without affecting existing systems

const AIEngine = {
    buildSystemPrompt(config) {
        // We output a structured prompt that the user can copy into ChatGPT/Claude
        const platforms = config.platforms.length > 0 ? config.platforms.join(', ') : 'All Platforms';
        
        let prompt = `You are a world-class Social Media Ghostwriter and Content Strategist.
I am going to provide you with a specific concept/framework from a book.

Your task is to convert this concept into highly-optimized, viral-ready social media content.
Do NOT invent new facts. Do NOT hallucinate. Do NOT distort the original meaning.
Your goal is strictly to organize, summarize, and structure the original knowledge.

### Source Material
Niche: ${config.domain}
Book: ${config.book}
Concept Title: ${config.conceptTitle}
Concept Content:
"""
${config.conceptContent}
"""

### Configuration
- Target Audience: ${config.audience}
- Tone of Voice: ${config.tone}
- Target Platforms: ${platforms}

### Required Output Format

Provide 3 distinct variations (Option 1, Option 2, Option 3) so I have choices for the final post. Each option should have a different angle, hook, and body text. 

Provide your response in a clear, easy-to-copy format using the following structure:

---
## AI Analysis
- Main Idea:
- Emotional Triggers:

## Option 1: [Format Name - e.g. Carousel / Single Post / Twitter Thread]
- Hook / Title:
- Body Text / Slides:
- CTA:
- Why this works:

## Option 2: [Format Name - e.g. Carousel / Single Post / Twitter Thread]
- Hook / Title:
- Body Text / Slides:
- CTA:
- Why this works:

## Option 3: [Format Name - e.g. Carousel / Single Post / Twitter Thread]
- Hook / Title:
- Body Text / Slides:
- CTA:
- Why this works:
---

### Readability & Style Rules
- Every carousel slide must be readable in under 8 seconds.
- Use simple English. Avoid long paragraphs.
- Never split one sentence across multiple carousel slides.
- Adapt wording for the [${config.audience}] audience using a [${config.tone}] tone.
`;
        return prompt;
    },

    mockGenerate(prompt) {
        // In a real environment, this would be a fetch() to an AI API.
        // For now, it returns a mocked HTML response simulating the generated content.
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`
                    <div class="space-y-6 animate-fade">
                        <div class="p-4 bg-gray-50 dark:bg-darkBg rounded-sm border border-gray-200 dark:border-gray-800">
                            <h4 class="font-bold text-[#0a0a0a] dark:text-white mb-2 uppercase tracking-widest text-xs">AI Analysis</h4>
                            <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-4">
                                <li><strong>Main Idea:</strong> Automatically extracted from the specific concept you selected.</li>
                                <li><strong>Emotional Triggers:</strong> Curiosity, Practicality, FOMO.</li>
                            </ul>
                        </div>
                        
                        <div class="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-sm border border-emerald-200 dark:border-emerald-800/50">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest text-xs">Option 1: The Storyteller (Carousel)</h4>
                            </div>
                            <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                <div class="bg-white dark:bg-darkCard p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700"><strong>Hook:</strong> "Everyone gets this wrong about [Topic]."</div>
                                <div class="bg-white dark:bg-darkCard p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700"><strong>Slide 2:</strong> Here is why the conventional advice fails.</div>
                                <div class="bg-white dark:bg-darkCard p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700"><strong>CTA:</strong> Follow for more insights.</div>
                            </div>
                        </div>

                        <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-sm border border-blue-200 dark:border-blue-800/50">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest text-xs">Option 2: Direct & Punchy (Short Post)</h4>
                            </div>
                            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300 font-mono text-xs">
                                <p><strong>Heading:</strong> Stop doing [X]. Start doing [Y].</p>
                                <p><strong>Body:</strong> The concept is actually very simple. If you apply this framework, your results will 10x. Here is the step-by-step breakdown.</p>
                                <p><strong>CTA:</strong> Save this post for later.</p>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-sm border border-purple-200 dark:border-purple-800/50">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="font-bold text-purple-800 dark:text-purple-400 uppercase tracking-widest text-xs">Option 3: The Contrarian (Twitter Thread)</h4>
                            </div>
                            <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300 font-mono text-xs">
                                <p>1/ The biggest lie you've been told about this topic.</p>
                                <p>2/ Why the opposite is actually true.</p>
                                <p>3/ The 3 steps to implement the real solution today.</p>
                            </div>
                        </div>
                    </div>
                `);
            }, 1000);
        });
    }
};

const aiUI = {
    currentPrompt: '',

    populateBooks() {
        const domain = document.getElementById('ai-domain-select').value;
        const bookSelect = document.getElementById('ai-book-select');
        const conceptSelect = document.getElementById('ai-concept-select');
        
        bookSelect.innerHTML = '<option value="">-- Choose Book --</option>';
        conceptSelect.innerHTML = '<option value="">-- Select Book First --</option>';
        conceptSelect.disabled = true;

        if (!domain || typeof window.allConcepts === 'undefined') {
            bookSelect.disabled = true;
            return;
        }

        const booksMap = new Map();
        window.allConcepts.forEach(c => {
            if (domain === 'all' || c.categoryId === domain) {
                booksMap.set(c.bookId, c.bookTitle);
            }
        });

        Array.from(booksMap.keys()).sort().forEach(bookId => {
            const opt = document.createElement('option');
            opt.value = bookId;
            opt.textContent = booksMap.get(bookId);
            bookSelect.appendChild(opt);
        });

        bookSelect.disabled = false;
    },

    populateConcepts() {
        const book = document.getElementById('ai-book-select').value;
        const conceptSelect = document.getElementById('ai-concept-select');
        
        conceptSelect.innerHTML = '<option value="">-- Choose Concept --</option>';

        if (!book || typeof window.allConcepts === 'undefined') {
            conceptSelect.disabled = true;
            return;
        }

        window.allConcepts.forEach(c => {
            if (c.bookId === book) {
                const opt = document.createElement('option');
                opt.value = `${c.bookId}-${c.conceptIndex}`;
                opt.textContent = c.concept.title;
                conceptSelect.appendChild(opt);
            }
        });

        conceptSelect.disabled = false;
    },

    async generate() {
        const conceptId = document.getElementById('ai-concept-select').value;
        const resultsContainer = document.getElementById('ai-results-container');
        const actionBtns = document.getElementById('ai-action-buttons');

        if (!conceptId) {
            resultsContainer.innerHTML = '<div class="flex h-full items-center justify-center text-red-500 text-sm font-medium pt-32">Please select a concept first.</div>';
            return;
        }

        const concept = window.conceptsDB.find(c => c.id === conceptId);
        if (!concept || !concept.content || concept.content.trim() === '') {
            resultsContainer.innerHTML = '<div class="flex h-full items-center justify-center text-amber-500 text-sm font-medium pt-32">No content available for this concept.</div>';
            return;
        }

        resultsContainer.innerHTML = `
            <div class="flex flex-col h-full items-center justify-center text-gray-500 space-y-4 pt-32">
                <svg class="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="text-xs font-bold uppercase tracking-widest">Generating Content...</span>
            </div>
        `;
        actionBtns.style.display = 'none';

        const config = {
            domain: document.getElementById('ai-domain-select').value,
            book: concept.book,
            conceptTitle: concept.title,
            conceptContent: concept.content,
            audience: document.getElementById('ai-audience-select').value,
            tone: document.getElementById('ai-tone-select').value,
            platforms: Array.from(document.querySelectorAll('.ai-platform-chk:checked')).map(cb => cb.value)
        };

        this.currentPrompt = AIEngine.buildSystemPrompt(config);

        // Check Cache
        const cacheKey = `ai_gen_${conceptId}_${config.audience}_${config.tone}`;
        let htmlResponse = sessionStorage.getItem(cacheKey);

        if (!htmlResponse) {
            htmlResponse = await AIEngine.mockGenerate(this.currentPrompt);
            sessionStorage.setItem(cacheKey, htmlResponse);
        }

        resultsContainer.innerHTML = htmlResponse;
        actionBtns.style.display = 'flex';
    },

    copyPrompt() {
        if (!this.currentPrompt) return;
        navigator.clipboard.writeText(this.currentPrompt).then(() => {
            alert("Prompt copied to clipboard! Paste it into ChatGPT or Claude.");
        });
    }
};

// Expose to window so onclick handlers in HTML can use it
window.aiUI = aiUI;

// Tab switcher for Admin Studio
window.switchAdminTab = function(tab) {
    document.getElementById('admin-tab-carousel').classList.add('hidden');
    document.getElementById('admin-tab-ai').classList.add('hidden');
    document.getElementById('admin-tab-ai').classList.remove('flex');
    
    document.getElementById('tab-btn-carousel').classList.remove('border-[#0a0a0a]', 'dark:border-white', 'text-[#0a0a0a]', 'dark:text-white');
    document.getElementById('tab-btn-carousel').classList.add('border-transparent', 'text-gray-500');
    
    document.getElementById('tab-btn-ai').classList.remove('border-[#0a0a0a]', 'dark:border-white', 'text-[#0a0a0a]', 'dark:text-white');
    document.getElementById('tab-btn-ai').classList.add('border-transparent', 'text-gray-500');

    if(tab === 'carousel') {
        document.getElementById('admin-tab-carousel').classList.remove('hidden');
        document.getElementById('tab-btn-carousel').classList.add('border-[#0a0a0a]', 'dark:border-white', 'text-[#0a0a0a]', 'dark:text-white');
        document.getElementById('tab-btn-carousel').classList.remove('border-transparent', 'text-gray-500');
    } else {
        document.getElementById('admin-tab-ai').classList.remove('hidden');
        document.getElementById('admin-tab-ai').classList.add('flex');
        document.getElementById('tab-btn-ai').classList.add('border-[#0a0a0a]', 'dark:border-white', 'text-[#0a0a0a]', 'dark:text-white');
        document.getElementById('tab-btn-ai').classList.remove('border-transparent', 'text-gray-500');
    }
}
