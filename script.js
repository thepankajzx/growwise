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
        if (!cat.books || cat.books.length === 0) return;
        
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

function checkAccessCodeModal() {
    const input = document.getElementById('modalSecretCodeInput');
    const btn = document.getElementById('codeSubmitBtn');
    
    if(input.value === 'pankaj@') {
        localStorage.setItem('tc_premium', 'true');
        btn.textContent = 'ACCESS GRANTED';
        btn.classList.remove('bg-gray-100', 'text-[#0a0a0a]');
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
        
        setTimeout(() => {
            closeFreemiumModal();
            setPremiumFilter(true); // Automatically switch them to premium view
            
            // Retry opening what they clicked
            if(pendingConceptToOpen) {
                openReader(pendingConceptToOpen.bookId, pendingConceptToOpen.conceptIndex, pendingConceptToOpen.globalIndex);
                pendingConceptToOpen = null;
            }
        }, 1000);
    } else {
        input.value = '';
        input.placeholder = 'Invalid Code';
        input.classList.add('border-red-500');
        setTimeout(() => {
            input.placeholder = 'Enter Access Code';
            input.classList.remove('border-red-500');
        }, 2000);
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
    if(window.location.hash === '#master') {
        localStorage.setItem('tc_premium', 'true');
        localStorage.setItem('tc_email', 'master@admin.com');
        document.getElementById('btn-admin').classList.remove('hidden');
    }
});
window.addEventListener('hashchange', () => {
    if(window.location.hash === '#admin') {
        if(hasPremium()) {
            document.getElementById('btn-admin').classList.remove('hidden');
            navTo('admin');
        } else {
            navTo('explorer');
        }
    }
    if(window.location.hash === '#master') {
        localStorage.setItem('tc_premium', 'true');
        localStorage.setItem('tc_email', 'master@admin.com');
        updateMembershipUI();
    }
});


// ----------------------------------------------------
// THEME & UI TOGGLES
// ----------------------------------------------------

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tc_theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tc_theme', 'dark');
    }
}

function handleMembershipClick(wantsPremium) {
    if (wantsPremium && !hasPremium()) {
        showLoginModal();
    }
}

function handleLogin(e) {
    e.preventDefault();
    // Simulate successful login
    localStorage.setItem('tc_premium', 'true');
    closeLoginModal();
    updateMembershipUI();
}

function logout() {
    localStorage.removeItem('tc_premium');
    if (window.location.hash === '#admin') navTo('explorer');
    updateMembershipUI();
}

function updateMembershipUI() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;
    
    if (window.location.hash === '#master') {
        authContainer.style.display = 'none';
        const adminBtn = document.getElementById('btn-admin');
        if(adminBtn) adminBtn.classList.remove('hidden');
        return;
    }
    
    authContainer.style.display = 'flex';
    
    if (hasPremium()) {
        authContainer.innerHTML = `
            <button onclick="logout()" class="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 transition hover:bg-amber-200 dark:hover:bg-amber-900/40" title="Click to Logout">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Premium
            </button>
        `;
        const adminBtn = document.getElementById('btn-admin');
        if(adminBtn) adminBtn.classList.remove('hidden');
    } else {
        authContainer.innerHTML = `
            <div class="flex items-center gap-1 bg-gray-100 dark:bg-darkBorder p-0.5 rounded-full border border-gray-200 dark:border-gray-800">
                <button class="px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-darkCard shadow-sm text-[#0a0a0a] dark:text-white transition cursor-default">Free</button>
                <button onclick="handleMembershipClick(true)" class="px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white transition flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Premium
                </button>
            </div>
        `;
        const adminBtn = document.getElementById('btn-admin');
        if(adminBtn) adminBtn.classList.add('hidden');
    }
}

function filterCategory(catId) {
    currentCategoryFilter = catId;
    currentBookFilter = 'all';
    document.getElementById('bookSelect').value = 'all';
    
    const pills = document.querySelectorAll('#filterPills button');
    pills.forEach(pill => {
        pill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white', 'border-transparent');
        pill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
    });
    
    const activePill = document.getElementById(`pill-${catId}`);
    if(activePill) {
        activePill.classList.remove('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        activePill.classList.add('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
    }
    
    renderExplorer();
}

function filterBook() {
    currentBookFilter = document.getElementById('bookSelect').value;
    if(currentBookFilter !== 'all') {
        currentCategoryFilter = 'all';
        const pills = document.querySelectorAll('#filterPills button');
        pills.forEach(pill => {
            pill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white', 'border-transparent');
            pill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        });
        document.getElementById(`pill-all`).classList.add('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
    }
    renderExplorer();
}

function filterLibrary(type) {
    currentLibraryFilter = type;
    
    const pills = document.querySelectorAll('#libraryFilters button');
    pills.forEach(pill => {
        pill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white', 'border-transparent');
        pill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
    });
    
    const activePill = document.getElementById(`lib-${type}`);
    if (activePill) {
        activePill.classList.remove('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        activePill.classList.add('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
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
    updateMembershipUI();
    closeReader();
}

function renderDashboard() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';

    booksData.forEach(cat => {
        const card = document.createElement('div');
        card.className = `group bg-white dark:bg-darkCard p-8 border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-[#0a0a0a] dark:hover:border-gray-400 transition-all duration-300 theme-${cat.id}`;
        card.onclick = () => {
            navTo('explorer');
            filterCategory(cat.id);
        };
        
        let conceptCount = 0;
        cat.books.forEach(b => conceptCount += b.concepts.length);

        card.innerHTML = `
            <div class="mb-8">
                <span class="text-3xl font-serif text-[#0a0a0a] dark:text-white">${cat.category.charAt(0)}</span>
            </div>
            
            <div class="space-y-3">
                <h3 class="text-xl font-bold text-[#0a0a0a] dark:text-white serif">${cat.category}</h3>
                <div class="flex items-center gap-2">
                    <p class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">${conceptCount} Frameworks</p>
                </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between group-hover:border-[#0a0a0a] dark:group-hover:border-gray-400 transition-colors">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#0a0a0a] dark:group-hover:text-white transition-colors">Enter Domain →</span>
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
    
    // Filter by membership logic removed (all concepts always visible)

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
                <h3 class="text-xl font-bold text-[#0a0a0a] dark:text-white serif mb-2">No frameworks found</h3>
                <p class="text-gray-500 dark:text-gray-400">Adjust your filters to see more content.</p>
                <button onclick="resetToDashboard()" class="mt-6 px-6 py-2 border border-[#0a0a0a] dark:border-white text-[#0a0a0a] dark:text-white hover:bg-[#0a0a0a] dark:hover:bg-white hover:text-white dark:hover:text-[#0a0a0a] transition rounded-sm text-xs font-bold uppercase tracking-widest">Reset Filters</button>
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
        card.className = `bg-white dark:bg-darkCard p-6 md:p-8 border ${item.concept.isPremium ? 'border-amber-200 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-800'} relative cursor-pointer hover:border-[#0a0a0a] dark:hover:border-gray-400 transition-all group flex flex-col h-full theme-${item.categoryId}`;
        card.onclick = () => openReader(item.bookId, item.conceptIndex, item.globalIndex);
        
        let statusIconsHtml = '';
        if (item.concept.isPremium) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 border border-amber-200 dark:border-amber-900">Premium</span>`;
        if (isCompleted) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 border border-emerald-100 dark:border-emerald-900">Completed</span>`;
        if (isBookmarked) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-[#0a0a0a] dark:text-white bg-gray-100 dark:bg-darkBg px-2 py-0.5 border border-gray-200 dark:border-gray-800">Bookmarked</span>`;
        if (isSaved) statusIconsHtml += `<span class="text-[9px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 border border-blue-100 dark:border-blue-900">Saved</span>`;
        if (isLocked) statusIconsHtml += `<svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4 gap-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">${item.categoryName}</span>
                <div class="flex flex-wrap gap-1 items-center justify-end flex-1">${statusIconsHtml}</div>
            </div>
            <div class="flex-1">
                <h4 class="text-xl font-bold text-[#0a0a0a] dark:text-white leading-tight mb-2 serif">${item.concept.title}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">Extracted from ${item.bookTitle}</p>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 group-hover:border-[#0a0a0a] dark:group-hover:border-gray-400 transition-colors flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest group-hover:text-[#0a0a0a] dark:group-hover:text-white transition-colors">${isLocked ? 'Unlock Premium' : 'View Protocol'}</span>
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
            txtSaved.textContent = 'Save Later';
        }
    }

    const btnBookmark = document.getElementById('btn-bookmark');
    const txtBookmark = document.getElementById('text-bookmark');
    if (btnBookmark) {
        if (bookmarks.includes(conceptId)) {
            btnBookmark.classList.add('bg-gray-100', 'border-[#0a0a0a]', 'text-[#0a0a0a]');
            btnBookmark.classList.remove('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtBookmark.textContent = 'Bookmarked';
        } else {
            btnBookmark.classList.remove('bg-gray-100', 'border-[#0a0a0a]', 'text-[#0a0a0a]');
            btnBookmark.classList.add('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtBookmark.textContent = 'Bookmark';
        }
    }
    
    const btnCompleted = document.getElementById('btn-completed');
    const txtCompleted = document.getElementById('text-completed');
    if (btnCompleted) {
        if (completed.includes(conceptId)) {
            btnCompleted.classList.add('bg-emerald-50', 'border-emerald-800', 'text-emerald-800');
            btnCompleted.classList.remove('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtCompleted.textContent = 'Completed';
        } else {
            btnCompleted.classList.remove('bg-emerald-50', 'border-emerald-800', 'text-emerald-800');
            btnCompleted.classList.add('border-gray-300', 'text-gray-600', 'hover:bg-gray-50');
            txtCompleted.textContent = 'Mark Completed';
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
        <div class="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-darkBorder cursor-pointer transition border-b border-gray-100 dark:border-gray-800 last:border-0 group" onclick="toggleChecklist(this)">
            <div class="w-5 h-5 border border-[#0a0a0a] dark:border-gray-500 flex items-center justify-center flex-shrink-0 mt-1 bg-white dark:bg-darkBg">
                <svg class="w-3 h-3 text-transparent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
            </div>
            <span class="text-[#0a0a0a] dark:text-gray-300 text-base md:text-lg font-medium leading-relaxed transition-all">${step}${step.endsWith('.') ? '' : '.'}</span>
        </div>
    `).join('');

    display.innerHTML = `
        <div class="space-y-12 animate-fade">
            ${concept.isPremium ? '<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-500 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Premium Framework Unlocked</div>' : ''}
            
            <!-- 1. The Core Premise -->
            <div class="border-l-4 border-emerald-800 dark:border-emerald-500 pl-6">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-500 mb-2">I. The Core Premise</h3>
                <p class="text-2xl md:text-3xl font-bold serif text-[#0a0a0a] dark:text-white leading-snug">
                    ${premise}
                </p>
            </div>

            <!-- 2. The Mechanism -->
            <div class="bg-gray-50 dark:bg-darkCard p-6 md:p-8 border border-gray-200 dark:border-gray-800">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">II. The Mechanism</h3>
                <p class="text-[#0a0a0a] dark:text-gray-300 text-lg leading-relaxed">
                    ${mechanism || "This framework operates intrinsically via the aforementioned premise."}
                </p>
            </div>

            <!-- 3. Actionable Pivot -->
            <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">III. Actionable Pivot</h3>
                <div class="border border-gray-200 dark:border-gray-800 bg-white dark:bg-darkCard">
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

function populateAdminBooks() {
    const domain = document.getElementById('admin-domain-select').value;
    const bookSelect = document.getElementById('admin-book-select');
    const conceptSelect = document.getElementById('admin-concept-select');
    
    conceptSelect.innerHTML = '<option value="">-- Select Source First --</option>';
    conceptSelect.disabled = true;
    
    if (!domain) {
        bookSelect.innerHTML = '<option value="">-- Select Domain First --</option>';
        bookSelect.disabled = true;
        return;
    }
    
    if (domain === 'all') {
        bookSelect.innerHTML = '<option value="all">-- All Source Materials --</option>';
        bookSelect.disabled = true;
        
        // Populate concepts with ALL concepts globally
        let html = '<option value="">-- Select Concept --</option>';
        allConcepts.forEach(c => {
            html += `<option value="global-${c.globalIndex}">${c.bookTitle}: ${c.concept.title}</option>`;
        });
        conceptSelect.innerHTML = html;
        conceptSelect.disabled = false;
        return;
    }
    
    const domainObj = booksData.find(b => b.id === domain);
    
    if (!domainObj || !domainObj.books || domainObj.books.length === 0) {
        bookSelect.innerHTML = '<option value="">No books in this domain</option>';
        bookSelect.disabled = true;
        return;
    }
    
    let html = '<option value="">-- Select Book --</option>';
    domainObj.books.forEach(book => {
        html += `<option value="${book.id}">${book.title}</option>`;
    });
    
    bookSelect.innerHTML = html;
    bookSelect.disabled = false;
}

function populateAdminConcepts() {
    const bookId = document.getElementById('admin-book-select').value;
    const conceptSelect = document.getElementById('admin-concept-select');
    
    if (!bookId) {
        conceptSelect.innerHTML = '<option value="">-- Select Source First --</option>';
        conceptSelect.disabled = true;
        return;
    }
    
    const result = findBookById(bookId);
    if (!result || !result.book || !result.book.concepts || result.book.concepts.length === 0) {
        conceptSelect.innerHTML = '<option value="">No concepts found</option>';
        conceptSelect.disabled = true;
        return;
    }
    
    let html = '<option value="">-- Select Concept --</option>';
    result.book.concepts.forEach((concept, index) => {
        html += `<option value="${index}">${concept.title}</option>`;
    });
    
    conceptSelect.innerHTML = html;
    conceptSelect.disabled = false;
}

function selectConceptForCarouselFromDropdown() {
    const bookId = document.getElementById('admin-book-select').value;
    const conceptIndex = document.getElementById('admin-concept-select').value;
    
    const domain = document.getElementById('admin-domain-select').value;
    let concept;
    
    if (domain === 'all' && conceptIndex.startsWith('global-')) {
        const globalIdx = parseInt(conceptIndex.replace('global-', ''));
        const found = allConcepts.find(c => c.globalIndex === globalIdx);
        if (!found) return;
        concept = found.concept;
    } else {
        if(!bookId || conceptIndex === "") return;
        
        const result = findBookById(bookId);
        if (!result) return;
        concept = result.book.concepts[parseInt(conceptIndex)];
    }
    
    // Parse premise
    const sentences = concept.explanation.match(/[^.!?]+[.!?]+/g) || [concept.explanation];
    let premise = sentences[0];
    if (sentences.length > 1 && premise.length < 50) premise += sentences[1];
    
    document.getElementById('cg-title').value = concept.title;
    document.getElementById('cg-content').value = premise.trim();
    
    updateCarouselPreview();
}

function updateCarouselPreview() {
    const title = document.getElementById('cg-title').value;
    const content = document.getElementById('cg-content').value;
    const showNumber = document.getElementById('cg-show-number').checked;
    const numberText = document.getElementById('cg-number').value;
    const ratio = document.getElementById('cg-ratio').value;
    
    const numberEl = document.getElementById('cg-preview-number');
    const node = document.getElementById('carousel-export-node');
    const wrapper = document.getElementById('cg-preview-wrapper');

    document.getElementById('cg-preview-title').textContent = title;
    document.getElementById('cg-preview-content').textContent = content;
    numberEl.textContent = numberText;
    
    if (showNumber) {
        numberEl.classList.remove('hidden');
    } else {
        numberEl.classList.add('hidden');
    }
    
    // Handle ratios
    let width = 1080;
    let height = 1080;
    let scale = 0.333333;

    const tcLogo = document.getElementById('cg-tc-logo');
    const brandName = document.getElementById('cg-brand-name');
    const swipeIndicator = document.getElementById('cg-swipe-indicator');
    
    // Toggle Swipe Indicator
    if (document.getElementById('cg-show-swipe').checked) {
        swipeIndicator.classList.remove('hidden');
    } else {
        swipeIndicator.classList.add('hidden');
    }
    
    if (ratio === '1:1') {
        width = 1080; height = 1080; scale = 0.333333;
        document.getElementById('cg-preview-title').className = "text-[6rem] font-bold serif leading-[1.1] tracking-tight transition-all duration-300";
        document.getElementById('cg-preview-content').className = "text-[3rem] text-gray-700 leading-snug font-medium transition-all duration-300 mt-6";
        document.getElementById('cg-flex-container').className = "flex-1 flex flex-col justify-center space-y-12 w-full pr-12 pb-12 transition-all duration-300 relative";
        
        tcLogo.className = "w-16 h-16 bg-[#0a0a0a] text-white flex items-center justify-center font-serif font-bold text-3xl rounded-sm transition-colors";
        brandName.className = "text-3xl font-bold tracking-tight text-[#0a0a0a] serif transition-colors";
        document.getElementById('btn-download-carousel').textContent = "Download 1080x1080 PNG";
    } else if (ratio === '4:5') {
        width = 1080; height = 1350; scale = 0.333333;
        // Increase text sizing for portrait to fill the vertical space appropriately
        document.getElementById('cg-preview-title').className = "text-[7.5rem] font-bold serif leading-[1.1] tracking-tight transition-all duration-300";
        document.getElementById('cg-preview-content').className = "text-[3.5rem] text-gray-700 leading-snug font-medium transition-all duration-300 mt-10";
        document.getElementById('cg-flex-container').className = "flex-1 flex flex-col justify-center space-y-20 w-full pr-12 pb-12 mt-12 transition-all duration-300 relative";
        
        tcLogo.className = "w-20 h-20 bg-[#0a0a0a] text-white flex items-center justify-center font-serif font-bold text-4xl rounded-sm transition-colors";
        brandName.className = "text-4xl font-bold tracking-tight text-[#0a0a0a] serif transition-colors";
        document.getElementById('btn-download-carousel').textContent = "Download 1080x1350 PNG";
    }
    
    // Apply Dark Post theme if selected
    const darkPostMode = document.getElementById('cg-bw-mode').checked;
    
    // Default text colors for title and content (based on ratio)
    let titleClass = document.getElementById('cg-preview-title').className;
    let contentClass = document.getElementById('cg-preview-content').className;
    
    if (darkPostMode) {
        node.classList.replace('bg-white', 'bg-[#0a0a0a]');
        
        // Update Title Color
        document.getElementById('cg-preview-title').className = titleClass + " text-emerald-400";
        
        // Update Content Color
        document.getElementById('cg-preview-content').className = contentClass.replace('text-gray-700', 'text-gray-200');
        
        // Update Brand & Logo
        brandName.classList.replace('text-[#0a0a0a]', 'text-white');
        brandItalic.className = "italic text-emerald-400 transition-colors";
        contentBorder.className = "border-l-8 border-emerald-400 pl-12 transition-all duration-300";
        tcLogo.classList.replace('bg-[#0a0a0a]', 'bg-white');
        tcLogo.classList.replace('text-white', 'text-[#0a0a0a]');
    } else {
        node.classList.replace('bg-[#0a0a0a]', 'bg-white');
        
        // Update Title Color
        document.getElementById('cg-preview-title').className = titleClass + " text-emerald-800";
        
        // Brand & Logo remain default
        brandName.classList.replace('text-white', 'text-[#0a0a0a]');
        brandItalic.className = "italic text-emerald-800 transition-colors";
        contentBorder.className = "border-l-8 border-emerald-800 pl-12 transition-all duration-300";
        tcLogo.classList.replace('bg-white', 'bg-[#0a0a0a]');
        tcLogo.classList.replace('text-[#0a0a0a]', 'text-white');
    }
    
    node.style.width = width + 'px';
    node.style.height = height + 'px';
    node.style.transform = `scale(${scale})`;
    
    wrapper.style.width = (width * scale) + 'px';
    wrapper.style.height = (height * scale) + 'px';
}

async function downloadCarousel() {
    // Temporarily remove scaling for crisp native capture
    const node = document.getElementById('carousel-export-node');
    const oldTransform = node.style.transform;
    node.style.transform = 'scale(1)';
    
    try {
        const isDark = document.documentElement.classList.contains('dark');
        const darkPostMode = document.getElementById('cg-bw-mode').checked;
        const bgColor = darkPostMode ? "#0a0a0a" : "#ffffff";
        
        // If dark mode is active, temporarily switch to light mode for the export
        if (isDark) {
            document.documentElement.classList.remove('dark');
        }

        const canvas = await html2canvas(node, {
            scale: 1, 
            backgroundColor: bgColor,
            logging: false,
            useCORS: true
        });
        
        node.style.transform = oldTransform;
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
        
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
    if(window.location.hash === '#master') {
        localStorage.setItem('tc_premium', 'true');
        localStorage.setItem('tc_email', 'master@admin.com');
    }
    updateMembershipUI();
    flattenData();
    initBookFilter();
    renderDashboard();
    renderExplorer();
};

document.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape' && !document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(); 
    }
});
