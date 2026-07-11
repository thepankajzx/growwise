// Global state
let allConcepts = [];
let currentCategoryFilter = 'all';
let currentBookFilter = 'all';
let currentLibraryFilter = 'all'; 
let showPremiumOnly = false;

let currentBookId = null;
let currentConceptIndex = 0;
let currentGlobalIndex = 0;

function flattenData() {
    allConcepts = [];
    let globalIndex = 0;
    booksData.forEach(cat => {
        cat.books.forEach(book => {
            book.concepts.forEach((concept, idx) => {
                allConcepts.push({
                    globalIndex: globalIndex++,
                    categoryId: cat.id,
                    categoryName: cat.category,
                    bookId: book.id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    conceptIndex: idx,
                    concept: concept
                });
            });
        });
    });
}

function initBookFilter() {
    const select = document.getElementById('bookSelect');
    select.innerHTML = '<option value="all">Filter by Source Material</option>';
    
    booksData.forEach(cat => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = cat.category;
        cat.books.forEach(book => {
            const opt = document.createElement('option');
            opt.value = book.id;
            opt.textContent = book.title;
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });
}

// ----------------------------------------------------
// AUTH & PREMIUM LOGIC
// ----------------------------------------------------

function isLoggedIn() {
    return !!localStorage.getItem('tc_email');
}

function hasPremium() {
    return localStorage.getItem('tc_premium') === 'true';
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    if(email) {
        localStorage.setItem('tc_email', email);
        closeLoginModal();
        // Retry opening what they clicked
        if(pendingConceptToOpen) {
            openReader(pendingConceptToOpen.bookId, pendingConceptToOpen.conceptIndex, pendingConceptToOpen.globalIndex);
            pendingConceptToOpen = null;
        }
    }
}

function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

function checkAccessCode(e) {
    const val = e.target.value;
    if(val === 'pankaj@') {
        localStorage.setItem('tc_premium', 'true');
        e.target.value = 'ACCESS GRANTED';
        e.target.classList.add('text-green-500');
        setTimeout(() => {
            e.target.value = '';
            e.target.classList.remove('text-green-500');
        }, 2000);
        renderExplorer(); // re-render to remove lock icons
    }
}

// ----------------------------------------------------
// NAVIGATION & UI
// ----------------------------------------------------

function navTo(view) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
    document.getElementById(`btn-${view}`).classList.add('nav-active');
    
    // Check if going to admin via hash (security by obscurity for MVP)
    if(view === 'admin' && window.location.hash !== '#admin') {
        window.location.hash = '#admin';
    }
    window.scrollTo(0, 0);
}

// Support hash routing on load
window.addEventListener('load', () => {
    if(window.location.hash === '#admin') {
        document.getElementById('btn-admin').classList.remove('hidden');
        navTo('admin');
    }
});
window.addEventListener('hashchange', () => {
    if(window.location.hash === '#admin') {
        document.getElementById('btn-admin').classList.remove('hidden');
        navTo('admin');
    }
});


function setPremiumFilter(isPremium) {
    showPremiumOnly = isPremium;
    
    const btnStandard = document.getElementById('toggle-standard');
    const btnPremium = document.getElementById('toggle-premium');
    
    if (showPremiumOnly) {
        btnPremium.classList.add('bg-white', 'shadow-sm', 'text-[#0a0a0a]');
        btnPremium.classList.remove('text-gray-500');
        
        btnStandard.classList.remove('bg-white', 'shadow-sm', 'text-[#0a0a0a]');
        btnStandard.classList.add('text-gray-500');
    } else {
        btnStandard.classList.add('bg-white', 'shadow-sm', 'text-[#0a0a0a]');
        btnStandard.classList.remove('text-gray-500');
        
        btnPremium.classList.remove('bg-white', 'shadow-sm', 'text-[#0a0a0a]');
        btnPremium.classList.add('text-gray-500');
    }
    
    renderExplorer();
}

function filterCategory(catId) {
    currentCategoryFilter = catId;
    currentBookFilter = 'all';
    document.getElementById('bookSelect').value = 'all';
    
    const pills = document.querySelectorAll('#filterPills button');
    pills.forEach(pill => {
        pill.classList.remove('bg-[#0a0a0a]', 'text-white', 'border-[#0a0a0a]');
        pill.classList.add('border-gray-300', 'text-gray-600');
    });
    
    const activePill = document.getElementById(`pill-${catId}`);
    if(activePill) {
        activePill.classList.remove('border-gray-300', 'text-gray-600');
        activePill.classList.add('bg-[#0a0a0a]', 'text-white', 'border-[#0a0a0a]');
    }
    
    renderExplorer();
}

function filterBook() {
    currentBookFilter = document.getElementById('bookSelect').value;
    if(currentBookFilter !== 'all') {
        currentCategoryFilter = 'all';
        const pills = document.querySelectorAll('#filterPills button');
        pills.forEach(pill => {
            pill.classList.remove('bg-[#0a0a0a]', 'text-white', 'border-[#0a0a0a]');
            pill.classList.add('border-gray-300', 'text-gray-600');
        });
        document.getElementById(`pill-all`).classList.add('bg-[#0a0a0a]', 'text-white', 'border-[#0a0a0a]');
    }
    renderExplorer();
}

function filterLibrary(type) {
    currentLibraryFilter = type;
    
    const pills = document.querySelectorAll('#libraryFilters button');
    pills.forEach(pill => {
        pill.classList.remove('bg-[#0a0a0a]', 'text-white', 'border-[#0a0a0a]');
        pill.classList.add('border-gray-300', 'text-gray-600');
    });
    
    const activePill = document.getElementById(`lib-${type}`);
    if (activePill) {
        activePill.classList.remove('border-gray-300', 'text-gray-600');
        activePill.classList.add('bg-[#0a0a0a]', 'text-white', 'border-[#0a0a0a]');
    }
    
    renderExplorer();
}

function resetToDashboard() {
    currentCategoryFilter = 'all';
    currentBookFilter = 'all';
    currentLibraryFilter = 'all';
    showPremiumOnly = false;
    
    filterCategory('all');
    filterLibrary('all');
    setPremiumFilter(false);
    closeReader();
}

function updateGlobalProgress() {
    const completedItems = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    const total = allConcepts.length;
    const mastered = completedItems.length;
    const percentage = Math.min(100, Math.round((mastered / total) * 100));
    
    const fill = document.getElementById('global-progress-fill');
    const text = document.getElementById('global-progress-text');
    
    if (fill) fill.style.width = `${percentage}%`;
    if (text) text.textContent = `${mastered} / ${total} Mastered`;
}

function renderDashboard() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';

    booksData.forEach(cat => {
        const card = document.createElement('div');
        card.className = `group bg-white p-8 border border-gray-200 cursor-pointer hover:border-[#0a0a0a] transition-all duration-300 theme-${cat.id}`;
        card.onclick = () => {
            navTo('explorer');
            filterCategory(cat.id);
        };
        
        let conceptCount = 0;
        cat.books.forEach(b => conceptCount += b.concepts.length);

        card.innerHTML = `
            <div class="mb-8">
                <span class="text-3xl font-serif text-[#0a0a0a]">${cat.category.charAt(0)}</span>
            </div>
            
            <div class="space-y-3">
                <h3 class="text-xl font-bold text-[#0a0a0a] serif">${cat.category}</h3>
                <div class="flex items-center gap-2">
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${conceptCount} Frameworks</p>
                </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between group-hover:border-[#0a0a0a] transition-colors">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#0a0a0a] transition-colors">Enter Domain →</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderExplorer() {
    const container = document.getElementById('explorerContainer');
    container.innerHTML = '';

    const savedItems = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    const bookmarkedItems = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    const completedItems = JSON.parse(localStorage.getItem('ka_completed') || '[]');

    let filtered = allConcepts;
    
    // Premium Toggle Filter
    if(showPremiumOnly) {
        filtered = filtered.filter(c => c.concept.isPremium);
    }

    if (currentLibraryFilter === 'saved') {
        filtered = filtered.filter(c => savedItems.includes(`${c.bookId}-${c.conceptIndex}`));
    } else if (currentLibraryFilter === 'bookmarked') {
        filtered = filtered.filter(c => bookmarkedItems.includes(`${c.bookId}-${c.conceptIndex}`));
    } else if (currentLibraryFilter === 'completed') {
        filtered = filtered.filter(c => completedItems.includes(`${c.bookId}-${c.conceptIndex}`));
    }
    
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(c => c.categoryId === currentCategoryFilter);
    }
    if (currentBookFilter !== 'all') {
        filtered = filtered.filter(c => c.bookId === currentBookFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <h3 class="text-xl font-bold text-[#0a0a0a] serif mb-2">No frameworks found</h3>
                <p class="text-gray-500">Adjust your filters to see more content.</p>
                <button onclick="resetToDashboard()" class="mt-6 px-6 py-2 border border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white transition rounded-sm text-xs font-bold uppercase tracking-widest">Reset Filters</button>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const conceptId = `${item.bookId}-${item.conceptIndex}`;
        const isSaved = savedItems.includes(conceptId);
        const isBookmarked = bookmarkedItems.includes(conceptId);
        const isCompleted = completedItems.includes(conceptId);
        const isLocked = item.concept.isPremium && !hasPremium();

        const card = document.createElement('div');
        card.className = `bg-white p-6 md:p-8 border ${item.concept.isPremium ? 'border-amber-200 bg-amber-50/10' : 'border-gray-200'} relative cursor-pointer hover:border-[#0a0a0a] transition-all group flex flex-col h-full theme-${item.categoryId}`;
        card.onclick = () => openReader(item.bookId, item.conceptIndex, item.globalIndex);
        
        let statusIconsHtml = '';
        if (item.concept.isPremium) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 border border-amber-200">Premium</span>`;
        if (isCompleted) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100">Mastered</span>`;
        if (isBookmarked) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-[#0a0a0a] bg-gray-100 px-2 py-0.5 border border-gray-200">Arsenal</span>`;
        if (isSaved) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100">Read Later</span>`;
        if (isLocked) statusIconsHtml += `<svg class="w-3.5 h-3.5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4 gap-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">${item.categoryName}</span>
                <div class="flex flex-wrap gap-1 items-center justify-end flex-1">${statusIconsHtml}</div>
            </div>
            <div class="flex-1">
                <h4 class="text-xl font-bold text-[#0a0a0a] leading-tight mb-2 serif">${item.concept.title}</h4>
                <p class="text-xs text-gray-500 leading-relaxed italic">Extracted from ${item.bookTitle}</p>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-100 group-hover:border-[#0a0a0a] transition-colors flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#0a0a0a] transition-colors">${isLocked ? 'Unlock Premium' : 'View Protocol'}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function findBookById(id) {
    for (const cat of booksData) {
        for (const book of cat.books) {
            if (book.id === id) return { book, cat };
        }
    }
    return null;
}

function showFreemiumModal() {
    const modal = document.getElementById('freemium-modal');
    modal.classList.remove('hidden');
}

function closeFreemiumModal() {
    const modal = document.getElementById('freemium-modal');
    modal.classList.add('hidden');
}

let pendingConceptToOpen = null;

function openReader(bookId, conceptIndex, globalIndex) {
    const result = findBookById(bookId);
    if(!result) return;
    const { book, cat } = result;
    const concept = book.concepts[conceptIndex];

    // Auth & Freemium Check
    if (concept.isPremium) {
        if (!isLoggedIn()) {
            pendingConceptToOpen = { bookId, conceptIndex, globalIndex };
            showLoginModal();
            return;
        }
        if (!hasPremium()) {
            showFreemiumModal();
            return;
        }
    }

    currentBookId = bookId;
    currentConceptIndex = conceptIndex;
    currentGlobalIndex = globalIndex;
    
    const overlay = document.getElementById('reader-overlay');
    
    document.getElementById('reader-category').textContent = cat.category;
    document.body.style.overflow = 'hidden'; 
    overlay.classList.remove('hidden');
    
    updateActionButtonsState();
    renderConceptDisplay();
}

function updateActionButtonsState() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    
    const saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    const completed = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    
    const btnSaved = document.getElementById('btn-saved');
    const txtSaved = document.getElementById('text-saved');
    if (btnSaved) {
        if (saved.includes(conceptId)) {
            btnSaved.classList.add('bg-gray-100', 'border-[#0a0a0a]', 'text-[#0a0a0a]');
            btnSaved.classList.remove('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtSaved.textContent = 'Saved';
        } else {
            btnSaved.classList.remove('bg-gray-100', 'border-[#0a0a0a]', 'text-[#0a0a0a]');
            btnSaved.classList.add('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtSaved.textContent = 'Read Later';
        }
    }

    const btnBookmark = document.getElementById('btn-bookmark');
    const txtBookmark = document.getElementById('text-bookmark');
    if (btnBookmark) {
        if (bookmarks.includes(conceptId)) {
            btnBookmark.classList.add('bg-gray-100', 'border-[#0a0a0a]', 'text-[#0a0a0a]');
            btnBookmark.classList.remove('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtBookmark.textContent = 'In Arsenal';
        } else {
            btnBookmark.classList.remove('bg-gray-100', 'border-[#0a0a0a]', 'text-[#0a0a0a]');
            btnBookmark.classList.add('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtBookmark.textContent = 'Save to Arsenal';
        }
    }
    
    const btnCompleted = document.getElementById('btn-completed');
    const txtCompleted = document.getElementById('text-completed');
    if (btnCompleted) {
        if (completed.includes(conceptId)) {
            btnCompleted.classList.add('bg-emerald-50', 'border-emerald-800', 'text-emerald-800');
            btnCompleted.classList.remove('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtCompleted.textContent = 'Mastered';
        } else {
            btnCompleted.classList.remove('bg-emerald-50', 'border-emerald-800', 'text-emerald-800');
            btnCompleted.classList.add('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtCompleted.textContent = 'Mark Mastered';
        }
    }
}

function toggleSaved() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    if (saved.includes(conceptId)) saved = saved.filter(id => id !== conceptId);
    else saved.push(conceptId);
    localStorage.setItem('ka_saved', JSON.stringify(saved));
    updateActionButtonsState();
    renderExplorer();
}

function toggleBookmark() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let bookmarks = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    if (bookmarks.includes(conceptId)) bookmarks = bookmarks.filter(id => id !== conceptId);
    else bookmarks.push(conceptId);
    localStorage.setItem('ka_bookmarks', JSON.stringify(bookmarks));
    updateActionButtonsState();
    renderExplorer();
}

function toggleCompleted() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let completed = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    if (completed.includes(conceptId)) completed = completed.filter(id => id !== conceptId);
    else completed.push(conceptId);
    localStorage.setItem('ka_completed', JSON.stringify(completed));
    updateActionButtonsState();
    updateGlobalProgress();
    renderExplorer();
}

function toggleChecklist(el) {
    const icon = el.querySelector('svg');
    if (el.classList.contains('opacity-50')) {
        el.classList.remove('opacity-50', 'line-through');
        icon.innerHTML = '';
        icon.classList.remove('text-emerald-700');
        icon.classList.add('text-transparent');
    } else {
        el.classList.add('opacity-50', 'line-through');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        icon.classList.add('text-emerald-700');
        icon.classList.remove('text-transparent');
    }
}

function renderConceptDisplay() {
    const book = findBookById(currentBookId).book;
    const display = document.getElementById('reader-display');
    const concept = book.concepts[currentConceptIndex];
    
    document.getElementById('reader-main-title').textContent = concept.title;
    document.getElementById('reader-author').textContent = book.title;
    document.getElementById('reader-title').textContent = concept.title;

    // Parse the One-Pager sections
    const sentences = concept.explanation.match(/[^.!?]+[.!?]+/g) || [concept.explanation];
    let premise = sentences[0];
    if (sentences.length > 1 && premise.length < 50) premise += sentences[1];
    
    const mechanism = concept.explanation.replace(premise, '').trim();
    
    let steps = concept.approach.split('. ').filter(s => s.trim().length > 0);
    if (steps.length === 1) steps = concept.approach.split(', ').filter(s => s.trim().length > 0);
    
    let checklistHtml = steps.map((step) => `
        <div class="flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 last:border-0 group" onclick="toggleChecklist(this)">
            <div class="w-5 h-5 border border-[#0a0a0a] flex items-center justify-center flex-shrink-0 mt-1 bg-white">
                <svg class="w-3 h-3 text-transparent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
            </div>
            <span class="text-[#0a0a0a] text-base md:text-lg font-medium leading-relaxed transition-all">${step}${step.endsWith('.') ? '' : '.'}</span>
        </div>
    `).join('');

    display.innerHTML = `
        <div class="space-y-12 animate-fade">
            ${concept.isPremium ? '<div class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Premium Framework Unlocked</div>' : ''}
            
            <!-- 1. The Core Premise -->
            <div class="border-l-4 border-emerald-800 pl-6">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-2">I. The Core Premise</h3>
                <p class="text-2xl md:text-3xl font-bold serif text-[#0a0a0a] leading-snug">
                    ${premise}
                </p>
            </div>

            <!-- 2. The Mechanism -->
            <div class="bg-gray-50 p-6 md:p-8 border border-gray-200">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">II. The Mechanism</h3>
                <p class="text-[#0a0a0a] text-lg leading-relaxed">
                    ${mechanism || "This framework operates intrinsically via the aforementioned premise."}
                </p>
            </div>

            <!-- 3. Actionable Pivot -->
            <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] mb-4 border-b border-gray-200 pb-2">III. Actionable Pivot</h3>
                <div class="border border-gray-200 bg-white">
                    ${checklistHtml}
                </div>
            </div>
        </div>
    `;
}

function shareInsight() {
    const book = findBookById(currentBookId).book;
    const concept = book.concepts[currentConceptIndex];
    const sentences = concept.explanation.match(/[^.!?]+[.!?]+/g) || [concept.explanation];
    let premise = sentences[0];
    
    const textToShare = `💡 ${concept.title}\n\n"${premise.trim()}"\n\nRead the full execution framework at: https://thepankajzx.github.io/growwise/`;
    
    navigator.clipboard.writeText(textToShare).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 2000);
    });
}

function closeReader() {
    document.getElementById('reader-overlay').classList.add('hidden');
    document.body.style.overflow = ''; 
}

// ----------------------------------------------------
// ADMIN CAROUSEL GENERATOR LOGIC
// ----------------------------------------------------

function updateCarouselPreview() {
    const title = document.getElementById('cg-title').value;
    const content = document.getElementById('cg-content').value;
    const number = document.getElementById('cg-number').value;

    document.getElementById('cg-preview-title').textContent = title;
    document.getElementById('cg-preview-content').textContent = content;
    document.getElementById('cg-preview-number').textContent = number;
}

async function downloadCarousel() {
    // Temporarily remove scaling for crisp 1080x1080 capture
    const node = document.getElementById('carousel-export-node');
    const oldTransform = node.style.transform;
    node.style.transform = 'scale(1)';
    
    try {
        const canvas = await html2canvas(node, {
            scale: 1, // 1080x1080 native
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true
        });
        
        node.style.transform = oldTransform;
        
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        const title = document.getElementById('cg-title').value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        link.download = `tc-carousel-${title}.png`;
        link.href = image;
        link.click();
    } catch (e) {
        console.error("Failed to generate image", e);
        node.style.transform = oldTransform;
        alert("Sorry, an error occurred while generating the image.");
    }
}

// Initialize
window.onload = () => {
    flattenData();
    initBookFilter();
    renderDashboard();
    renderExplorer();
    updateGlobalProgress();
};

document.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape' && !document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(); 
    }
});
