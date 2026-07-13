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

function updateSourceDropdown(domain) {
    const wrapper = document.getElementById('sourceSelectWrapper');
    let logoElement = document.getElementById('cg-tc-logo');
    if (logoElement) {
        logoElement.innerHTML = `
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8" cy="8" r="1.5" fill="currentColor"></circle>
                <circle cx="16" cy="16" r="1.5" fill="currentColor"></circle>
                <line x1="18" y1="6" x2="6" y2="18"></line>
            </svg>
        `;
    }
    const select = document.getElementById('bookSelect');
    
    if (domain === 'all') {
        wrapper.classList.add('hidden');
        select.innerHTML = '<option value="all">All Source Materials</option>';
        return;
    }
    
    const cat = booksData.find(c => c.id === domain);
    if (!cat || !cat.books || cat.books.length === 0) {
        wrapper.classList.add('hidden');
        select.innerHTML = '<option value="all">All Source Materials</option>';
        return;
    }
    
    wrapper.classList.remove('hidden');
    select.innerHTML = '<option value="all">All Source Materials</option>';
    cat.books.forEach(book => {
        const opt = document.createElement('option');
        opt.value = book.id;
        opt.textContent = book.title;
        select.appendChild(opt);
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
        
        // Confetti burst!
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#059669', '#10b981', '#34d399', '#ffffff'] // Emerald tones
            });
        }
        
        setTimeout(() => {
            closeFreemiumModal();
            updateMembershipUI();
            setPremiumFilter(true); // Automatically switch them to premium view
            
            // Retry opening what they clicked
            if(pendingConceptToOpen) {
                openReader(pendingConceptToOpen.bookId, pendingConceptToOpen.conceptIndex, pendingConceptToOpen.globalIndex);
                pendingConceptToOpen = null;
            }
        }, 1500);
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
    
    window.scrollTo(0, 0);
}

window.addEventListener('load', () => {
    if(window.location.hash === '#master') {
        localStorage.setItem('tc_premium', 'true');
        localStorage.setItem('tc_email', 'master@admin.com');
        document.getElementById('btn-admin').classList.remove('hidden');
    } else {
        document.getElementById('btn-admin').classList.add('hidden');
    }
});
window.addEventListener('hashchange', () => {
    if(window.location.hash === '#master') {
        localStorage.setItem('tc_premium', 'true');
        localStorage.setItem('tc_email', 'master@admin.com');
        document.getElementById('btn-admin').classList.remove('hidden');
        updateMembershipUI();
    } else {
        document.getElementById('btn-admin').classList.add('hidden');
        if(!document.getElementById('view-admin').classList.contains('hidden')) {
            navTo('explorer');
        }
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

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        dropdown.classList.toggle('flex');
    }
}

function requestPremiumAccess() {
    if (!isLoggedIn()) {
        showLoginModal();
    } else if (!hasPremium()) {
        showFreemiumModal();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email').value;
    const passwordInput = document.getElementById('login-password').value;
    
    if (emailInput.toLowerCase() === 'admin@84' && passwordInput === '123456') {
        localStorage.setItem('tlp_role', 'admin');
        localStorage.setItem('tc_premium', 'true');
    }
    
    localStorage.setItem('tc_email', emailInput);
    
    closeLoginModal();
    updateMembershipUI();
    
    if (pendingConceptToOpen) {
        const { bookId, conceptIndex, globalIndex } = pendingConceptToOpen;
        pendingConceptToOpen = null;
        openReader(bookId, conceptIndex, globalIndex);
    }
}

function logout() {
    localStorage.removeItem('tc_premium');
    localStorage.removeItem('tc_email');
    localStorage.removeItem('tlp_role');
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
    }
    if (window.location.hash === '#admin') navTo('explorer');
    updateMembershipUI();
}

function updateMembershipUI() {
    const authContainer = document.getElementById('auth-container');
    const btnProfile = document.getElementById('btn-profile');
    const adminBtn = document.getElementById('btn-admin');
    
    const email = localStorage.getItem('tc_email');
    const role = localStorage.getItem('tlp_role');
    
    if (email) {
        if(btnProfile) btnProfile.classList.remove('hidden');
        const emailDisplay = document.getElementById('profile-email-display');
        if(emailDisplay) emailDisplay.textContent = email;
    } else {
        if(btnProfile) btnProfile.classList.add('hidden');
    }
    
    if (role === 'admin') {
        if(adminBtn) adminBtn.classList.remove('hidden');
    } else {
        if(adminBtn) adminBtn.classList.add('hidden');
    }

    if (!authContainer) return;
    
    authContainer.style.display = 'flex';
    
    if (hasPremium()) {
        authContainer.innerHTML = `
            <button class="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 cursor-default">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Premium
            </button>
        `;
    } else {
        authContainer.innerHTML = `
            <div class="flex items-center gap-1 bg-gray-100 dark:bg-darkBorder p-0.5 rounded-full border border-gray-200 dark:border-gray-800">
                <button class="px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-darkCard shadow-sm text-[#0a0a0a] dark:text-white transition cursor-default">Free</button>
                <button onclick="requestPremiumAccess()" class="px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white transition flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Premium
                </button>
            </div>
        `;
    }
}

function filterCategory(catId) {
    currentCategoryFilter = catId;
    currentBookFilter = 'all';
    
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
    
    const domainSelect = document.getElementById('domainSelect');
    if (domainSelect) domainSelect.value = catId;

    const sourceSelectWrapper = document.getElementById('sourceSelectWrapper');
    const bookSelect = document.getElementById('bookSelect');
    
    if (catId === 'all') {
        if (sourceSelectWrapper) sourceSelectWrapper.classList.add('hidden');
    } else {
        if (sourceSelectWrapper) sourceSelectWrapper.classList.remove('hidden');
        if (bookSelect) {
            let optionsHTML = '<option value="all">All Concepts</option>';
            const categoryData = booksData.find(c => c.id === catId);
            if (categoryData) {
                categoryData.books.forEach(book => {
                    optionsHTML += `<option value="${book.id}">${book.title}</option>`;
                });
            }
            bookSelect.innerHTML = optionsHTML;
            bookSelect.value = 'all';
        }
    }
    
    renderExplorer();
}

function handleDomainDropdown() {
    const domainSelect = document.getElementById('domainSelect');
    if (domainSelect) {
        filterCategory(domainSelect.value);
    }
}

function filterBook() {
    currentBookFilter = document.getElementById('bookSelect').value;
    renderExplorer();
}

function filterLibrary(type) {
    currentLibraryFilter = type;
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
        card.className = `bg-white dark:bg-darkCard p-4 md:p-5 border ${item.concept.isPremium ? 'border-amber-200 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-800'} relative cursor-pointer hover:border-[#0a0a0a] dark:hover:border-gray-400 transition-all group flex flex-col h-full theme-${item.categoryId}`;
        card.onclick = () => openReader(item.bookId, item.conceptIndex, item.globalIndex);
        
        let statusIconsHtml = '';
        if (item.concept.isPremium) statusIconsHtml += `<span class="text-[8px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/20 px-1.5 py-0.5 border border-amber-200 dark:border-amber-900">Premium</span>`;
        if (isCompleted) statusIconsHtml += `<span class="text-[8px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 border border-emerald-100 dark:border-emerald-900">Completed</span>`;
        if (isBookmarked) statusIconsHtml += `<span class="text-[8px] font-bold uppercase tracking-widest text-[#0a0a0a] dark:text-white bg-gray-100 dark:bg-darkBg px-1.5 py-0.5 border border-gray-200 dark:border-gray-800">Bookmarked</span>`;
        if (isSaved) statusIconsHtml += `<span class="text-[8px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 border border-blue-100 dark:border-blue-900">Saved</span>`;
        if (isLocked) statusIconsHtml += `<svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2 gap-2">
                <span class="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">${item.categoryName}</span>
                <div class="flex flex-wrap gap-1 items-center justify-end flex-1">${statusIconsHtml}</div>
            </div>
            <div class="flex-1">
                <h4 class="text-lg md:text-xl font-bold text-[#0a0a0a] dark:text-white leading-tight mb-2 serif group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">${item.concept.title}</h4>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800/50">
                <p class="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 leading-relaxed italic truncate">Extracted from ${item.bookTitle}</p>
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
            pendingConceptToOpen = { bookId, conceptIndex, globalIndex };
            showFreemiumModal();
            return;
        }
    }

    currentBookId = bookId;
    currentConceptIndex = conceptIndex;
    currentGlobalIndex = globalIndex;
    
    const overlay = document.getElementById('reader-overlay');
    
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
    
    // UPDATE SIDEBAR BUTTONS
    const sideSaved = document.getElementById('sidebar-btn-saved');
    const sideSavedTxt = document.getElementById('sidebar-text-saved');
    if (sideSaved) {
        if (saved.includes(conceptId)) {
            sideSaved.classList.add('text-amber-600', 'dark:text-amber-500');
            sideSavedTxt.textContent = 'Saved';
        } else {
            sideSaved.classList.remove('text-amber-600', 'dark:text-amber-500');
            sideSavedTxt.textContent = 'Read Later';
        }
    }

    const sideBookmark = document.getElementById('sidebar-btn-bookmark');
    const sideBookmarkTxt = document.getElementById('sidebar-text-bookmark');
    if (sideBookmark) {
        if (bookmarks.includes(conceptId)) {
            sideBookmark.classList.add('text-blue-600', 'dark:text-blue-500');
            sideBookmarkTxt.textContent = 'Bookmarked';
        } else {
            sideBookmark.classList.remove('text-blue-600', 'dark:text-blue-500');
            sideBookmarkTxt.textContent = 'Save to Arsenal';
        }
    }
    
    const sideCompleted = document.getElementById('sidebar-btn-completed');
    const sideCompletedTxt = document.getElementById('sidebar-text-completed');
    const sideProgress = document.getElementById('sidebar-progress');
    const sidePercent = document.getElementById('sidebar-percent');
    if (sideCompleted) {
        if (completed.includes(conceptId)) {
            sideCompleted.classList.add('bg-emerald-50', 'dark:bg-emerald-900/20');
            sideCompletedTxt.textContent = 'Mastered';
            if(sideProgress) sideProgress.classList.add('text-emerald-500');
            if(sidePercent) { sidePercent.textContent = '100%'; sidePercent.classList.add('text-emerald-600'); }
        } else {
            sideCompleted.classList.remove('bg-emerald-50', 'dark:bg-emerald-900/20');
            sideCompletedTxt.textContent = 'Mark Completed';
            if(sideProgress) sideProgress.classList.remove('text-emerald-500');
            if(sidePercent) { sidePercent.classList.remove('text-emerald-600'); }
        }
    }

    // UPDATE MOBILE BUTTONS
    const mobSaved = document.getElementById('mobile-btn-saved');
    if (mobSaved) {
        if (saved.includes(conceptId)) mobSaved.classList.add('text-amber-600');
        else mobSaved.classList.remove('text-amber-600');
    }

    const mobBookmark = document.getElementById('mobile-btn-bookmark');
    if (mobBookmark) {
        if (bookmarks.includes(conceptId)) mobBookmark.classList.add('text-blue-600');
        else mobBookmark.classList.remove('text-blue-600');
    }

    const mobCompleted = document.getElementById('mobile-btn-completed');
    if (mobCompleted) {
        if (completed.includes(conceptId)) {
            mobCompleted.classList.add('bg-emerald-500', 'text-white');
            mobCompleted.classList.remove('bg-accent/10', 'text-accent');
        } else {
            mobCompleted.classList.remove('bg-emerald-500', 'text-white');
            mobCompleted.classList.add('bg-accent/10', 'text-accent');
        }
    }
}

function toggleSaved() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    if (saved.includes(conceptId)) saved = saved.filter(id => id !== conceptId);
    else saved.push(conceptId);
    localStorage.setItem('ka_saved', JSON.stringify(saved));
    updateActionButtonsState();
    renderExplorer();
}

function toggleBookmark() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let bookmarks = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    if (bookmarks.includes(conceptId)) bookmarks = bookmarks.filter(id => id !== conceptId);
    else bookmarks.push(conceptId);
    localStorage.setItem('ka_bookmarks', JSON.stringify(bookmarks));
    updateActionButtonsState();
    renderExplorer();
}

function toggleCompleted() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
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
    
    document.getElementById('reader-author').textContent = book.title;

    // Parse the One-Pager sections
    const sentences = concept.explanation.match(/[^.!?]+[.!?]+/g) || [concept.explanation];
    let premise = sentences[0];
    if (sentences.length > 1 && premise.length < 50) premise += sentences[1];
    
    const mechanism = concept.explanation.replace(premise, '').trim();
    
    let steps = concept.approach.split('. ').filter(s => s.trim().length > 0);
    if (steps.length === 1) steps = concept.approach.split(', ').filter(s => s.trim().length > 0);
    
    let checklistHtml = steps.map((step) => `
        <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ${step}${step.endsWith('.') ? '' : '.'}</li>
    `).join('');

    display.innerHTML = `
        <article class="mb-12 sm:mb-16 animate-fade">
            <div class="flex flex-wrap items-center gap-3 mb-6">
                <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-semibold tracking-widest uppercase rounded-full text-secondary">${book.category || 'Framework'}</span>
                <span class="text-xs text-secondary flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 5 Min Read</span>
            </div>
            
            <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight text-primary dark:text-white mb-8">
                ${concept.title}
            </h1>
            
            <div class="w-full bg-white dark:bg-darkCard border border-borderLight dark:border-gray-800 rounded-2xl p-6 sm:p-8 mb-10 premium-shadow">
                <p class="font-sans text-sm font-medium text-secondary mb-3 uppercase tracking-wide">One-Line Summary</p>
                <p class="font-serif text-xl sm:text-2xl italic text-primary dark:text-gray-200 leading-relaxed">${premise}</p>
            </div>
        </article>

        <div class="space-y-10 font-serif text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-300 animate-fade" style="animation-delay: 0.1s;">
            <h2 class="font-sans text-2xl sm:text-3xl font-semibold text-primary dark:text-white mt-16 mb-6 tracking-tight">Why It Matters</h2>
            <p>${mechanism || "This framework operates intrinsically via the aforementioned premise."}</p>
            
            <div class="my-16 w-full bg-[#FDFBF7] dark:bg-darkCard border border-[#EAE3D1] dark:border-gray-800 rounded-3xl p-8 sm:p-10 premium-shadow transition-colors">
                <div class="flex items-center mb-6">
                    <svg class="w-6 h-6 text-accent mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                    <h3 class="font-sans text-lg sm:text-xl font-semibold text-primary dark:text-white">Think for 30 Seconds</h3>
                </div>
                <p class="font-serif text-lg sm:text-xl italic text-secondary mb-6">How does this concept apply to your current biggest bottleneck?</p>
                <textarea class="w-full bg-white dark:bg-[#121212] border border-borderLight dark:border-gray-700 rounded-xl p-5 font-sans text-base focus:outline-none focus:ring-1 focus:ring-accent resize-none placeholder-gray-400" rows="3" placeholder="Jot down your reflection to lock in the learning..."></textarea>
            </div>

            <div class="my-16 w-full bg-white dark:bg-darkCard border-l-8 border-green-500 rounded-r-3xl p-8 sm:p-10 shadow-sm premium-shadow">
                <h3 class="font-sans text-xs sm:text-sm uppercase tracking-widest font-bold text-green-600 mb-3">Try Today (Max 5 Mins)</h3>
                <h4 class="font-sans text-2xl sm:text-3xl font-semibold text-primary dark:text-white mb-4">Actionable Steps</h4>
                <ul class="font-sans text-base sm:text-lg space-y-4 text-primary dark:text-gray-300">
                    ${checklistHtml}
                </ul>
            </div>
            
            <div class="my-20 w-full bg-primary dark:bg-[#1A1A1A] rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden premium-shadow group cursor-pointer" onclick="shareInsight()">
                <div class="absolute -top-10 -right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-10 -left-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl"></div>
                <span class="block font-sans text-xs sm:text-sm uppercase tracking-widest text-accent mb-8 relative z-10">Screenshot-Worthy Takeaway</span>
                <h2 class="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-snug sm:leading-tight text-white relative z-10 max-w-4xl mx-auto">
                    "${premise}"
                </h2>
            </div>
        </div>
    `;
}

function shareInsight() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
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
        document.getElementById('cg-preview-source').textContent = found.bookTitle;
    } else {
        if(!bookId || conceptIndex === "") return;
        
        const result = findBookById(bookId);
        if (!result) return;
        concept = result.book.concepts[parseInt(conceptIndex)];
        document.getElementById('cg-preview-source').textContent = result.book.title;
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
    
    const sourceEl = document.getElementById('cg-preview-source');
    if (document.getElementById('cg-show-source') && document.getElementById('cg-show-source').checked) {
        sourceEl.classList.remove('hidden');
    } else {
        sourceEl.classList.add('hidden');
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
        
        tcLogo.className = "w-14 h-14 bg-[#0a0a0a] text-white flex items-center justify-center font-serif font-bold text-3xl leading-none rounded-sm transition-colors";
        tcLogo.innerHTML = '<span class="relative -top-[2px]">%</span>';
        brandName.className = "text-3xl font-bold tracking-tight text-[#0a0a0a] serif leading-none transition-colors";
        document.getElementById('btn-download-carousel').textContent = "Download 1080x1080 PNG";
    } else if (ratio === '4:5') {
        width = 1080; height = 1350; scale = 0.333333;
        // Adjusted text sizing for portrait to leave room at top and bottom
        document.getElementById('cg-preview-title').className = "text-[6.5rem] font-bold serif leading-[1.1] tracking-tight transition-all duration-300";
        document.getElementById('cg-preview-content').className = "text-[3rem] text-gray-700 leading-snug font-medium transition-all duration-300 mt-8";
        document.getElementById('cg-flex-container').className = "flex-1 flex flex-col justify-center space-y-16 w-full pr-12 pb-12 mt-12 transition-all duration-300 relative";
        
        tcLogo.className = "w-20 h-20 bg-[#0a0a0a] text-white flex items-center justify-center font-serif font-bold text-4xl leading-none rounded-sm transition-colors";
        tcLogo.innerHTML = '<span class="relative -top-[3px]">TC</span>';
        brandName.className = "text-4xl font-bold tracking-tight text-[#0a0a0a] serif leading-none transition-colors";
        document.getElementById('btn-download-carousel').textContent = "Download 1080x1350 PNG";
    }
    
    // Apply Dark Post theme if selected
    const darkPostMode = document.getElementById('cg-bw-mode').checked;
    const brandItalic = document.getElementById('cg-brand-italic');
    const contentBorder = document.getElementById('cg-content-border');
    
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
        tcLogo.classList.remove('bg-[#0a0a0a]', 'text-white');
        tcLogo.classList.add('bg-white', 'text-[#0a0a0a]');
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
    updateMembershipUI();
    flattenData();
    updateSourceDropdown('all');
    renderDashboard();
    renderExplorer();
};

document.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape' && !document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(); 
    }
});
