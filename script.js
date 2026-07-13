// Global state
let allConcepts = [];
let currentCategoryFilter = 'all';
let currentBookFilter = 'all';
let currentLibraryFilter = new Set(); // multi-select: set of active filters
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
    
    if (wrapper) wrapper.classList.remove('hidden');
    
    if (domain === 'all') {
        let optionsHTML = '<option value="all">All Source Materials</option>';
        booksData.forEach(cat => {
            cat.books.forEach(book => {
                optionsHTML += `<option value="${book.id}">${book.title}</option>`;
            });
        });
        select.innerHTML = optionsHTML;
        return;
    }
    
    const cat = booksData.find(c => c.id === domain);
    if (!cat || !cat.books || cat.books.length === 0) {
        select.innerHTML = '<option value="all">All Source Materials</option>';
        return;
    }
    
    let optionsHTML = '<option value="all">All Source Materials</option>';
    cat.books.forEach(book => {
        optionsHTML += `<option value="${book.id}">${book.title}</option>`;
    });
    select.innerHTML = optionsHTML;
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

function navTo(view, updateHash = true) {
    if (updateHash && window.location.hash !== `#${view}`) {
        window.history.pushState(null, null, `#${view}`);
    }

    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
    const btn = document.getElementById(`btn-${view}`);
    if (btn) btn.classList.add('nav-active');
    
    const footer = document.getElementById('main-footer');
    if (footer) {
        if (view === 'dashboard') {
            footer.classList.remove('hidden');
        } else {
            footer.classList.add('hidden');
        }
    }
    
    // Extra logic for profile view stats updates
    if (view === 'profile') {
        const completedItems = JSON.parse(localStorage.getItem('ka_completed') || '[]');
        const savedItems = JSON.parse(localStorage.getItem('ka_saved') || '[]');
        
        const completedBooks = new Set();
        let premiumConcepts = 0;
        
        completedItems.forEach(id => {
            const parts = id.split('-');
            if (parts.length >= 2) {
                const conceptIdx = parseInt(parts.pop());
                const bookId = parts.join('-');
                completedBooks.add(bookId);
                
                const found = allConcepts.find(c => c.bookId === bookId && c.conceptIndex === conceptIdx);
                if (found && found.concept.premium) {
                    premiumConcepts++;
                }
            }
        });
        
        const countDisplay = document.getElementById('profile-concepts-count');
        if (countDisplay) countDisplay.textContent = completedItems.length;
        
        const booksDisplay = document.getElementById('profile-books-count');
        if (booksDisplay) booksDisplay.textContent = completedBooks.size;
        
        const premiumDisplay = document.getElementById('profile-premium-count');
        if (premiumDisplay) premiumDisplay.textContent = premiumConcepts;
        
        const hoursDisplay = document.getElementById('profile-hours');
        if (hoursDisplay) hoursDisplay.textContent = Math.round((completedItems.length * 5) / 60);
        
        const streakDisplay = document.getElementById('profile-streak');
        if (streakDisplay) streakDisplay.textContent = completedItems.length > 0 ? "1 Day" : "0 Days";
    }
    
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

function toggleMobileMenu() {
    const dropdown = document.getElementById('mobile-menu-dropdown');
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
    const email = localStorage.getItem('tc_email');
    const premium = hasPremium();
    
    // Desktop UI
    const profileBtn = document.getElementById('btn-profile');
    const profileEmail = document.getElementById('profile-email-display');
    const togglePremiumBtn = document.getElementById('toggle-premium');
    const toggleStandardBtn = document.getElementById('toggle-standard');
    
    // Mobile UI
    const mobileProfileSection = document.getElementById('mobile-profile-section');
    const mobileTogglePremiumBtn = document.getElementById('mobile-toggle-premium');
    const mobileToggleStandardBtn = document.getElementById('mobile-toggle-standard');
    
    if (email) {
        if(profileBtn) profileBtn.classList.remove('hidden');
        if(profileEmail) profileEmail.textContent = email;
        if(mobileProfileSection) {
            mobileProfileSection.classList.remove('hidden');
            mobileProfileSection.classList.add('flex');
        }
    } else {
        if(profileBtn) profileBtn.classList.add('hidden');
        if(mobileProfileSection) {
            mobileProfileSection.classList.add('hidden');
            mobileProfileSection.classList.remove('flex');
        }
    }
    
    if (premium) {
        if(togglePremiumBtn) {
            togglePremiumBtn.classList.add('bg-white', 'dark:bg-darkCard', 'text-[#0a0a0a]', 'dark:text-white', 'shadow-sm');
            togglePremiumBtn.classList.remove('text-gray-500', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }
        if(toggleStandardBtn) {
            toggleStandardBtn.classList.remove('bg-white', 'dark:bg-darkCard', 'shadow-sm', 'text-[#0a0a0a]', 'dark:text-white');
            toggleStandardBtn.classList.add('text-gray-500', 'dark:text-gray-400');
        }
        if(mobileTogglePremiumBtn) {
            mobileTogglePremiumBtn.classList.add('bg-white', 'dark:bg-darkCard', 'text-[#0a0a0a]', 'dark:text-white', 'shadow-sm');
            mobileTogglePremiumBtn.classList.remove('text-gray-500', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }
        if(mobileToggleStandardBtn) {
            mobileToggleStandardBtn.classList.remove('bg-white', 'dark:bg-darkCard', 'shadow-sm', 'text-[#0a0a0a]', 'dark:text-white');
            mobileToggleStandardBtn.classList.add('text-gray-500', 'dark:text-gray-400');
        }
    } else {
        if(togglePremiumBtn) {
            togglePremiumBtn.classList.remove('bg-white', 'dark:bg-darkCard', 'text-[#0a0a0a]', 'dark:text-white', 'shadow-sm');
            togglePremiumBtn.classList.add('text-gray-500', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }
        if(toggleStandardBtn) {
            toggleStandardBtn.classList.add('bg-white', 'dark:bg-darkCard', 'shadow-sm', 'text-[#0a0a0a]', 'dark:text-white');
            toggleStandardBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
        }
        if(mobileTogglePremiumBtn) {
            mobileTogglePremiumBtn.classList.remove('bg-white', 'dark:bg-darkCard', 'text-[#0a0a0a]', 'dark:text-white', 'shadow-sm');
            mobileTogglePremiumBtn.classList.add('text-gray-500', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }
        if(mobileToggleStandardBtn) {
            mobileToggleStandardBtn.classList.add('bg-white', 'dark:bg-darkCard', 'shadow-sm', 'text-[#0a0a0a]', 'dark:text-white');
            mobileToggleStandardBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
        }
    }

    const authContainer = document.getElementById('auth-container');
    const adminBtn = document.getElementById('btn-admin');
    const role = localStorage.getItem('tlp_role');
    
    if (role === 'admin') {
        if(adminBtn) adminBtn.classList.remove('hidden');
    } else {
        if(adminBtn) adminBtn.classList.add('hidden');
    }

    if (!authContainer) return;
    
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
    renderExplorer();
}

function filterBook(bookId) {
    currentBookFilter = bookId;
    // Also set the category to match the book so we only see this book's concepts
    if (bookId !== 'all') {
        const bookObj = findBookById(bookId);
        if (bookObj && bookObj.cat) {
            currentCategoryFilter = bookObj.cat.id;
        }
    }
    renderExplorer();
    closeMegaMenu(); // if clicked from mega menu
}

// ----------------------------------------------------
// MEGA MENU LOGIC
// ----------------------------------------------------

let currentHoveredDomain = 'all';

function toggleMegaMenu() {
    const menu = document.getElementById('mega-menu-dropdown');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        renderMegaMenuDomains();
        hoverDomain('all');
    } else {
        closeMegaMenu();
    }
}

function closeMegaMenu() {
    const menu = document.getElementById('mega-menu-dropdown');
    if (menu) menu.classList.add('hidden');
}

// Close mega menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('mega-menu-dropdown');
    const btn = document.getElementById('mega-menu-btn');
    if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(event.target) && !btn.contains(event.target)) {
            closeMegaMenu();
        }
    }
});

function hoverDomain(domainId) {
    currentHoveredDomain = domainId;
    renderMegaMenuDomains(); // to update active state
    renderMegaMenuContent(domainId);
}

function renderMegaMenuDomains() {
    const domainsContainer = document.getElementById('mega-menu-domains');
    if (!domainsContainer) return;
    
    let html = `
        <li>
            <button onmouseover="hoverDomain('all')" onclick="filterCategory('all'); closeMegaMenu();" class="w-full text-left px-6 py-3 font-bold text-sm tracking-wide transition-colors ${currentHoveredDomain === 'all' ? 'bg-white dark:bg-darkCard text-[#0a0a0a] dark:text-white border-l-4 border-[#0a0a0a] dark:border-white' : 'text-gray-600 dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white border-l-4 border-transparent'}">
                All Domains
            </button>
        </li>
    `;
    
    booksData.forEach(cat => {
        const isActive = currentHoveredDomain === cat.id;
        html += `
            <li>
                <button onmouseover="hoverDomain('${cat.id}')" onclick="filterCategory('${cat.id}'); closeMegaMenu();" class="w-full text-left px-6 py-3 font-bold text-sm tracking-wide transition-colors ${isActive ? 'bg-white dark:bg-darkCard text-[#0a0a0a] dark:text-white border-l-4 border-[#0a0a0a] dark:border-white' : 'text-gray-600 dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white border-l-4 border-transparent'}">
                    ${cat.category}
                </button>
            </li>
        `;
    });
    
    domainsContainer.innerHTML = html;
}

function renderMegaMenuContent(domainId) {
    const contentContainer = document.getElementById('mega-menu-content');
    if (!contentContainer) return;
    
    let html = '';
    
    if (domainId === 'all') {
        html = `<div class="text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-widest font-bold">Featured Source Materials</div>`;
        html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">`;
        booksData.forEach(cat => {
            cat.books.slice(0, 2).forEach(book => {
                html += `
                    <button onclick="filterBook('${book.id}')" class="text-left p-4 rounded-xl border border-borderLight dark:border-gray-800 hover:border-[#0a0a0a] dark:hover:border-white transition group bg-gray-50 dark:bg-[#0f0f0f]">
                        <p class="font-serif text-lg font-medium text-[#0a0a0a] dark:text-white group-hover:text-accent transition">${book.title}</p>
                        <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest">${cat.category}</p>
                    </button>
                `;
            });
        });
        html += `</div>`;
    } else {
        const categoryData = booksData.find(c => c.id === domainId);
        if (categoryData) {
            html = `<div class="flex items-center justify-between mb-6">
                        <div class="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">${categoryData.category} Sources</div>
                        <button onclick="filterCategory('${domainId}'); closeMegaMenu();" class="text-xs font-bold text-[#0a0a0a] dark:text-white uppercase tracking-widest hover:text-accent transition">View All in Domain →</button>
                    </div>`;
            
            html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">`;
            categoryData.books.forEach(book => {
                html += `
                    <button onclick="filterBook('${book.id}')" class="text-left p-4 rounded-xl border border-borderLight dark:border-gray-800 hover:border-[#0a0a0a] dark:hover:border-white transition group bg-gray-50 dark:bg-[#0f0f0f]">
                        <p class="font-serif text-lg font-medium text-[#0a0a0a] dark:text-white group-hover:text-accent transition">${book.title}</p>
                        <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest">${book.concepts.length} Concepts</p>
                    </button>
                `;
            });
            html += `</div>`;
        }
    }
    
    contentContainer.innerHTML = html;
}

function filterLibrary(type) {
    if (type === 'all') {
        // 'All' clears everything
        currentLibraryFilter.clear();
    } else {
        // Toggle this filter in/out of active set
        if (currentLibraryFilter.has(type)) {
            currentLibraryFilter.delete(type);
        } else {
            currentLibraryFilter.add(type);
        }
    }

    // Update ALL pill visuals
    ['saved', 'completed', 'save_later'].forEach(id => {
        const pill = document.getElementById(`lib-${id}`);
        if (!pill) return;
        if (currentLibraryFilter.has(id)) {
            pill.classList.remove('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
            pill.classList.add('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
        } else {
            pill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
            pill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }
    });

    // 'All' pill: active only when nothing else selected
    const allPill = document.getElementById('lib-all');
    if (allPill) {
        if (currentLibraryFilter.size === 0) {
            allPill.classList.remove('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
            allPill.classList.add('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
        } else {
            allPill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
            allPill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }
    }

    renderExplorer();
}

function resetToDashboard() {
    currentCategoryFilter = 'all';
    currentBookFilter = 'all';
    currentLibraryFilter.clear();
    filterLibrary('all');
    updateMembershipUI();
    closeReader();
}

function renderDashboard() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';

    booksData.forEach(cat => {
        const card = document.createElement('div');
        card.className = `group bg-white dark:bg-darkCard p-8 border border-gray-200 dark:border-transparent cursor-pointer hover:border-[#0a0a0a] dark:hover:border-gray-600 transition-all duration-300 theme-${cat.id}`;
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

    const saveLaterItems = JSON.parse(localStorage.getItem('ka_save_later') || '[]');

    // Apply active library filters with OR logic
    if (currentLibraryFilter.size > 0) {
        filtered = filtered.filter(c => {
            const id = `${c.bookId}-${c.conceptIndex}`;
            return (
                (currentLibraryFilter.has('saved') && savedItems.includes(id)) ||
                (currentLibraryFilter.has('completed') && completedItems.includes(id)) ||
                (currentLibraryFilter.has('save_later') && saveLaterItems.includes(id))
            );
        });
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
    overlay.scrollTop = 0;
    
    // Reset progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = '0%';
    
    updateActionButtonsState();
    renderConceptDisplay();
}

function updateActionButtonsState() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    const saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    const completed = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    const saveLater = JSON.parse(localStorage.getItem('ka_save_later') || '[]');
    
    // Arsenal button (heart icon)
    const sideSaved = document.getElementById('sidebar-btn-saved');
    if (sideSaved) {
        if (saved.includes(conceptId)) {
            sideSaved.classList.add('text-red-500');
            sideSaved.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="currentColor" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>';
        } else {
            sideSaved.classList.remove('text-red-500');
            sideSaved.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>';
        }
    }

    // Save for Later button
    const sideSaveLater = document.getElementById('sidebar-btn-save_later');
    if (sideSaveLater) {
        if (saveLater.includes(conceptId)) {
            sideSaveLater.classList.add('text-purple-600', 'dark:text-purple-400');
        } else {
            sideSaveLater.classList.remove('text-purple-600', 'dark:text-purple-400');
        }
    }

    // Completed button - scalloped verified badge
    const sideCompleted = document.getElementById('sidebar-btn-completed');
    const badgeSvgInner = '<path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />';
    
    if (sideCompleted) {
        if (completed.includes(conceptId)) {
            sideCompleted.classList.add('text-emerald-500');
            sideCompleted.classList.remove('text-secondary', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
            sideCompleted.querySelector('svg').innerHTML = badgeSvgInner;
        } else {
            sideCompleted.classList.remove('text-emerald-500');
            sideCompleted.classList.add('text-secondary', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
            sideCompleted.querySelector('svg').innerHTML = badgeSvgInner;
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

function toggleSaveLater() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let saveLater = JSON.parse(localStorage.getItem('ka_save_later') || '[]');
    if (saveLater.includes(conceptId)) saveLater = saveLater.filter(id => id !== conceptId);
    else saveLater.push(conceptId);
    localStorage.setItem('ka_save_later', JSON.stringify(saveLater));
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

function parseConceptToComponents(markdown, conceptId) {
    let html = '';
    const normalized = markdown.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');
    let currentHeading = '';
    let currentContent = [];

    const flushBlock = () => {
        if (!currentHeading && currentContent.length === 0) return;
        
        const contentStr = currentContent.join('\n\n').trim();
        let rawHeading = currentHeading.replace(/\*\*/g, '').trim();

        if (rawHeading === 'Visual First:') {
            html += renderVisualCard(contentStr);
        } else if (rawHeading === 'Simple Explanation:') {
            html += renderExplanationCard('Simple Explanation', contentStr);
        } else if (rawHeading === 'Why It Matters:') {
            html += renderExplanationCard('Why It Matters', contentStr);
        } else if (rawHeading === 'Real-Life Example:') {
            html += renderExampleCard(contentStr);
        } else if (rawHeading === 'Common Mistake:') {
            html += renderWarningCard(contentStr);
        } else if (rawHeading === 'Reflection Question:') {
            html += renderReflectionCard(contentStr, conceptId);
        } else if (rawHeading.startsWith('Try This Today')) {
            html += renderActionCard(rawHeading, contentStr, conceptId);
        } else if (rawHeading === 'Mental Model:') {
            html += renderMemoryCard('Mental Model', contentStr);
        } else if (rawHeading === 'Key Takeaway:') {
            html += renderTakeawayCard(contentStr);
        } else {
            if (currentHeading) {
                currentContent.unshift(currentHeading);
            }
            if (currentContent.length > 0) {
                const joined = currentContent.join('\n\n');
                const parsed = marked.parse ? marked.parse(joined) : marked(joined);
                html += `
                    <div class="mb-12 prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-headings:font-serif prose-headings:text-[#0a0a0a] dark:prose-headings:text-white prose-hr:border-gray-200 dark:prose-hr:border-gray-800 prose-table:w-full prose-li:text-gray-600 dark:prose-li:text-gray-400">
                        ${parsed}
                    </div>
                `;
            }
        }
        
        currentHeading = '';
        currentContent = [];
    };

    blocks.forEach(block => {
        const match = block.match(/^(\*\*[^*]+:\*\*)\s*(.*)$/s);
        const headingMatch = block.match(/^(#{1,6})\s+(.*)$/s);
        
        if (match) {
            flushBlock();
            currentHeading = match[1]; 
            if (match[2].trim()) {
                currentContent.push(match[2].trim());
            }
        } else if (headingMatch) {
            flushBlock();
            currentHeading = '';
            currentContent.push(block);
        } else {
            currentContent.push(block);
        }
    });
    flushBlock();

    return html;
}

function renderVisualCard(content) {
    const codeMatch = content.match(/```([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : '';
    const captionText = content.replace(/```[\s\S]*?```/, '').trim();
    
    let parsedCaption = captionText;
    if (typeof marked !== 'undefined') {
        parsedCaption = marked.parseInline ? marked.parseInline(captionText) : captionText;
    }

    return `
    <div class="w-full bg-[#0a0a0a] dark:bg-[#111] border border-[#0a0a0a] dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl relative mb-16 group">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-900"></div>
        <div class="p-8 sm:p-12 overflow-x-auto scrollbar-hide">
            <pre class="text-emerald-400 dark:text-emerald-500 font-mono text-[10px] sm:text-xs md:text-sm leading-loose tracking-widest">${code}</pre>
        </div>
        ${captionText ? `<div class="bg-[#111] dark:bg-[#1a1a1a] border-t border-gray-800 p-6 sm:px-12 text-sm text-gray-400 italic">
            ${parsedCaption}
        </div>` : ''}
    </div>
    `;
}

function renderExplanationCard(title, content) {
    return `
    <div class="mb-12">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-500 mb-4">${title}</h3>
        <p class="text-2xl md:text-3xl font-serif text-[#0a0a0a] dark:text-gray-100 leading-snug">
            ${content}
        </p>
    </div>
    `;
}

function renderExampleCard(content) {
    return `
    <div class="bg-gray-50 dark:bg-[#151515] p-8 md:p-10 border border-borderLight dark:border-gray-800 rounded-3xl mb-12 relative overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#0a0a0a] dark:bg-gray-500"></div>
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 pl-2">Real-Life Example</h3>
        <p class="text-lg md:text-xl text-[#0a0a0a] dark:text-gray-300 leading-relaxed font-serif pl-2">
            ${content}
        </p>
    </div>
    `;
}

function renderWarningCard(content) {
    return `
    <div class="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 md:p-8 mb-12 flex items-start gap-4">
        <div class="text-red-500 mt-1 shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <div>
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400 mb-2">Common Mistake</h3>
            <p class="text-base md:text-lg text-red-900 dark:text-red-300 leading-relaxed">
                ${content}
            </p>
        </div>
    </div>
    `;
}

function renderReflectionCard(content, id) {
    const savedText = localStorage.getItem(`reflection_${id}`) || '';
    return `
    <div class="bg-white dark:bg-darkCard border border-borderLight dark:border-gray-800 rounded-[2rem] p-8 md:p-10 mb-12 premium-shadow">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Reflection
        </h3>
        <p class="text-xl md:text-2xl font-serif text-[#0a0a0a] dark:text-white leading-snug mb-6">
            ${content}
        </p>
        <textarea id="reflection_input_${id}" class="w-full bg-gray-50 dark:bg-darkBg border border-borderLight dark:border-gray-800 rounded-xl p-6 text-sm md:text-base text-[#0a0a0a] dark:text-gray-300 focus:outline-none focus:border-[#0a0a0a] dark:focus:border-emerald-500 transition-colors resize-y min-h-[120px]" placeholder="Type your thoughts here...">${savedText}</textarea>
        <div class="flex justify-end mt-4">
            <button onclick="saveReflection('${id}')" class="bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-lg">Save Note</button>
        </div>
    </div>
    `;
}

function saveReflection(id) {
    const val = document.getElementById(`reflection_input_${id}`).value;
    localStorage.setItem(`reflection_${id}`, val);
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerHTML = 'Note saved securely.';
        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 2000);
    }
}

function renderActionCard(title, content, id) {
    const safeTitle = title.replace(/\s+/g, '_');
    const isChecked = localStorage.getItem(`action_${id}_${safeTitle}`) === 'true';
    const opacityState = isChecked ? 'opacity-50 line-through' : '';
    const iconState = isChecked ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' : '';
    
    return `
    <div class="border border-borderLight dark:border-gray-800 rounded-3xl mb-12 bg-white dark:bg-darkCard group cursor-pointer transition hover:border-[#0a0a0a] dark:hover:border-gray-500 premium-shadow" onclick="toggleActionItem('${id}', '${safeTitle}', this)">
        <div class="p-6 md:p-8 flex items-start gap-4 transition-all duration-300 ${opacityState}" id="action_container_${id}_${safeTitle}">
            <div class="w-6 h-6 rounded-full border-2 border-[#0a0a0a] dark:border-gray-500 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${isChecked ? 'bg-[#0a0a0a] dark:bg-emerald-500 border-transparent' : 'bg-transparent'}">
                <svg class="w-4 h-4 text-white dark:text-[#0a0a0a] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconState}</svg>
            </div>
            <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] dark:text-gray-400 mb-2">${title}</h3>
                <p class="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">${content}</p>
            </div>
        </div>
    </div>
    `;
}

function toggleActionItem(id, safeTitle, el) {
    const container = document.getElementById(`action_container_${id}_${safeTitle}`);
    const icon = container.querySelector('svg');
    const box = container.querySelector('.w-6');
    const isChecked = localStorage.getItem(`action_${id}_${safeTitle}`) === 'true';
    
    if (isChecked) {
        localStorage.setItem(`action_${id}_${safeTitle}`, 'false');
        container.classList.remove('opacity-50', 'line-through');
        icon.innerHTML = '';
        box.classList.remove('bg-[#0a0a0a]', 'dark:bg-emerald-500', 'border-transparent');
        box.classList.add('bg-transparent');
    } else {
        localStorage.setItem(`action_${id}_${safeTitle}`, 'true');
        container.classList.add('opacity-50', 'line-through');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        box.classList.remove('bg-transparent');
        box.classList.add('bg-[#0a0a0a]', 'dark:bg-emerald-500', 'border-transparent');
    }
}

function renderMemoryCard(title, content) {
    return `
    <div class="mb-12 mt-16">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">${title}</h3>
        <div class="p-8 sm:p-12 bg-[#0a0a0a] dark:bg-black text-white rounded-[2rem] premium-shadow border border-[#0a0a0a] dark:border-gray-800 relative overflow-hidden">
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <p class="text-xl md:text-2xl font-medium leading-relaxed font-serif relative z-10 italic text-center">
                "${content.replace(/\*/g, '')}"
            </p>
        </div>
    </div>
    `;
}

function renderTakeawayCard(content) {
    return `
    <div class="mb-16 mt-24">
        <div class="border-t border-borderLight dark:border-gray-800 pt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] dark:text-gray-400 mb-4">Key Takeaway</h3>
                <p class="text-2xl md:text-4xl font-serif text-[#0a0a0a] dark:text-white leading-tight font-medium max-w-3xl">
                    ${content.replace(/\*/g, '')}
                </p>
            </div>
            <button onclick="navigator.clipboard.writeText('${content.replace(/\*/g, '').replace(/'/g, "\\'")}'); const t=document.getElementById('toast'); if(t){t.innerHTML='Copied to clipboard'; t.classList.remove('opacity-0'); setTimeout(()=>t.classList.add('opacity-0'),2000);}" class="shrink-0 w-14 h-14 flex items-center justify-center border border-borderLight dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-darkCard transition text-[#0a0a0a] dark:text-white rounded-full shadow-sm hover:shadow-md">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
        </div>
    </div>
    `;
}

function renderConceptDisplay() {
    const book = findBookById(currentBookId).book;
    const display = document.getElementById('reader-display');
    const concept = book.concepts[currentConceptIndex];
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    
    document.getElementById('reader-author').textContent = book.title;

    let mainContentHtml = '';
    if (concept.htmlFile) {
        display.innerHTML = `
            <iframe src="${concept.htmlFile}" class="w-full min-h-[85vh] border-0 rounded-b-2xl" title="${concept.title}"></iframe>
        `;
        return;
    } else if (concept.markdown) {
        mainContentHtml = parseConceptToComponents(concept.markdown, conceptId);
    } else {
        const sentences = concept.explanation.match(/[^.!?]+[.!?]+/g) || [concept.explanation];
        let premise = sentences[0] || '';
        if (sentences.length > 1 && premise.length < 50) premise += sentences[1];
        let mechanism = concept.explanation.replace(premise, '').trim();
        let steps = concept.approach.split('. ').filter(s => s.trim().length > 0);
        if (steps.length === 1) steps = concept.approach.split(', ').filter(s => s.trim().length > 0);
        
        mainContentHtml = renderExplanationCard('The Core Premise', premise) + 
                          renderExplanationCard('The Mechanism', mechanism) + 
                          renderActionCard('Actionable Pivot', steps.join('<br>'), conceptId);
    }

    display.innerHTML = `
        <div class="animate-fade pt-4 md:pt-12">
            ${concept.premium || concept.isPremium ? '<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-500 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-12 inline-flex shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Premium Framework Unlocked</div>' : ''}
            
            <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold font-serif text-[#0a0a0a] dark:text-white leading-[1.1] tracking-tight mb-20 text-balance">
                ${concept.title}
            </h1>

            ${mainContentHtml}
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
    
    // Create shareable link
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const shareUrl = `${baseUrl}?concept=${book.id}-${currentConceptIndex}`;
    
    const textToShare = `💡 ${concept.title}\n\n"${premise.trim()}"\n\nRead the full execution framework at: ${shareUrl}`;
    
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
    
    // Reader Progress Bar & Text
    document.getElementById('reader-overlay').addEventListener('scroll', function() {
        const overlay = this;
        const progress = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if(overlay.scrollHeight > overlay.clientHeight) {
            let scrolled = (overlay.scrollTop / (overlay.scrollHeight - overlay.clientHeight)) * 100;
            // Cap it between 0 and 100
            scrolled = Math.max(0, Math.min(100, scrolled));
            
            if (progress) progress.style.width = scrolled + '%';
            if (progressText) progressText.textContent = Math.round(scrolled) + '%';
        }
    });

    // Check for shared concept in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedConcept = urlParams.get('concept');
    if (sharedConcept) {
        // Concept ID format: "bookId-conceptIndex"
        const parts = sharedConcept.split('-');
        if (parts.length >= 2) {
            const conceptIndex = parseInt(parts.pop());
            const bookId = parts.join('-');
            
            // Find global index
            const item = allConcepts.find(c => c.bookId === bookId && c.conceptIndex === conceptIndex);
            if (item) {
                openReader(bookId, conceptIndex, item.globalIndex);
            }
        }
        
        // Clean URL to prevent infinite re-opens if they refresh
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
    
    // Initial routing based on hash
    const initialHash = window.location.hash.replace('#', '');
    const validViews = ['dashboard', 'explorer', 'admin', 'profile'];
    if (validViews.includes(initialHash)) {
        navTo(initialHash, false);
    } else {
        navTo('dashboard', false); // Default view
    }
};

window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '');
    const validViews = ['dashboard', 'explorer', 'admin', 'profile'];
    if (validViews.includes(newHash)) {
        navTo(newHash, false);
    } else {
        navTo('dashboard', false);
    }
});

document.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape' && !document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(); 
    }
});
