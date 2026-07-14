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
    // Base date for simulated chronological order (e.g., first concept added Jan 2024, rest follow)
    const baseDateMs = new Date('2024-01-01T10:00:00Z').getTime();
    const msPerItem = 86400000 * 1.5; // Add 1.5 days per concept to spread them out

    booksData.forEach(cat => {
        cat.books.forEach(book => {
            book.concepts.forEach((concept, idx) => {
                const itemDateMs = baseDateMs + (globalIndex * msPerItem);
                const itemDateStr = new Date(itemDateMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                allConcepts.push({
                    globalIndex: globalIndex++,
                    categoryId: cat.id,
                    categoryName: cat.category,
                    bookId: book.id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    conceptIndex: idx,
                    concept: concept,
                    dateAddedMs: itemDateMs,
                    dateAddedStr: itemDateStr
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

// ----------------------------------------------------
// FIREBASE AUTH & PREMIUM LOGIC
// ----------------------------------------------------

let currentUser = null;
let userProfile = null;

// Listen for auth state changes
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        try {
            const docRef = db.collection('users').doc(user.uid);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                userProfile = docSnap.data();
                // Load synced data into localStorage for seamless UI integration
                localStorage.setItem('ka_saved', JSON.stringify(userProfile.saved || []));
                localStorage.setItem('ka_bookmarks', JSON.stringify(userProfile.bookmarks || []));
                localStorage.setItem('ka_completed', JSON.stringify(userProfile.completed || []));
                localStorage.setItem('ka_save_later', JSON.stringify(userProfile.saveLater || []));
            } else {
                userProfile = { isPremium: false, saved: [], bookmarks: [], completed: [], saveLater: [] };
                await docRef.set(userProfile);
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    } else {
        userProfile = null;
    }
    updateMembershipUI();
});

function isLoggedIn() {
    return !!currentUser;
}

function hasPremium() {
    return userProfile && userProfile.isPremium === true;
}

function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('login-error').classList.add('hidden');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

let isSignUpMode = false;
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const btn = document.getElementById('login-submit-btn');
    const toggle = document.getElementById('auth-mode-toggle');
    const err = document.getElementById('login-error');
    err.classList.add('hidden');
    
    if (isSignUpMode) {
        btn.textContent = 'Sign Up';
        toggle.textContent = 'Already have an account? Log In';
    } else {
        btn.textContent = 'Log In';
        toggle.textContent = 'Need an account? Sign Up';
    }
}

async function checkAccessCodeModal() {
    const input = document.getElementById('modalSecretCodeInput');
    const btn = document.getElementById('codeSubmitBtn');
    
    if(input.value === 'pankaj@') {
        if (!currentUser) return;
        
        btn.textContent = 'VERIFYING...';
        try {
            await db.collection('users').doc(currentUser.uid).update({ isPremium: true });
            userProfile.isPremium = true;
            
            btn.textContent = 'ACCESS GRANTED';
            btn.classList.remove('bg-gray-100', 'text-[#0a0a0a]', 'dark:bg-darkBg', 'dark:text-white');
            btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
            
            // Confetti burst!
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#059669', '#10b981', '#34d399', '#ffffff']
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
        } catch (err) {
            console.error(err);
            btn.textContent = 'ERROR';
        }
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
    if (view === 'explorer-premium') {
        if (updateHash && window.location.hash !== `#explorer-premium`) {
            window.history.pushState(null, null, `#explorer-premium`);
        }
        document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
        document.getElementById(`view-explorer`).classList.remove('hidden');
        
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
        const btn = document.getElementById(`btn-explorer`);
        if (btn) btn.classList.add('nav-active');
        
        const footer = document.getElementById('main-footer');
        if (footer) footer.classList.add('hidden');
        
        currentLibraryFilter.clear();
        currentLibraryFilter.add('premium');
        
        // Update pills UI
        ['saved', 'completed', 'save_later', 'premium'].forEach(id => {
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
        
        const allPill = document.getElementById('lib-all');
        if (allPill) {
            allPill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
            allPill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
        }

        if (typeof renderExplorer === 'function') renderExplorer();
        window.scrollTo(0, 0);
        return;
    }

    if (updateHash && window.location.hash !== `#${view}`) {
        window.history.pushState(null, null, `#${view}`);
    }

    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const targetSection = document.getElementById(`view-${view}`);
    if (targetSection) targetSection.classList.remove('hidden');
    
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
    
    if (view === 'profile') {
        window.location.href = 'profile.html';
        return;
    }
    
    if (view === 'explorer') {
        if (updateHash) { // Reset filters if navigated manually (not from back button)
            currentLibraryFilter.clear();
            currentCategoryFilter = 'all';
            currentBookFilter = 'all';
            
            ['saved', 'completed', 'save_later', 'premium'].forEach(id => {
                const pill = document.getElementById(`lib-${id}`);
                if (pill) {
                    pill.classList.remove('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
                    pill.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
                }
            });
            const allPill = document.getElementById('lib-all');
            if (allPill) {
                allPill.classList.remove('border-transparent', 'text-gray-600', 'dark:text-gray-400', 'hover:text-[#0a0a0a]', 'dark:hover:text-white');
                allPill.classList.add('bg-[#0a0a0a]', 'dark:bg-white', 'text-white', 'dark:text-[#0a0a0a]', 'border-[#0a0a0a]', 'dark:border-white');
            }
        }
        if (typeof renderExplorer === 'function') renderExplorer();
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

async function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email').value;
    const passwordInput = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');
    const err = document.getElementById('login-error');
    
    btn.textContent = 'PLEASE WAIT...';
    err.classList.add('hidden');
    
    try {
        if (isSignUpMode) {
            await auth.createUserWithEmailAndPassword(emailInput, passwordInput);
        } else {
            await auth.signInWithEmailAndPassword(emailInput, passwordInput);
        }
        
        closeLoginModal();
        if (pendingConceptToOpen) {
            const { bookId, conceptIndex, globalIndex } = pendingConceptToOpen;
            pendingConceptToOpen = null;
            openReader(bookId, conceptIndex, globalIndex);
        }
    } catch (error) {
        if (error.code === 'auth/invalid-credential') {
            err.textContent = "Invalid email or password. If you don't have an account, please Sign Up first.";
        } else if (error.code === 'auth/email-already-in-use') {
            err.textContent = "This email is already in use. Please Log In instead.";
        } else if (error.code === 'auth/weak-password') {
            err.textContent = "Password should be at least 6 characters.";
        } else {
            err.textContent = error.message;
        }
        err.classList.remove('hidden');
    } finally {
        btn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    }
}

async function logout() {
    try {
        await auth.signOut();
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
        }
        if (window.location.hash === '#admin') navTo('explorer');
    } catch (error) {
        console.error("Logout error", error);
    }
}

function updateMembershipUI() {
    const email = currentUser ? currentUser.email : null;
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

    // Sort by latest added first
    filtered = filtered.slice().sort((a, b) => b.dateAddedMs - a.dateAddedMs);

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
            <div class="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800/50 flex justify-between items-center">
                <p class="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 leading-relaxed italic truncate">Extracted from ${item.bookTitle}</p>
                <p class="text-[9px] font-bold tracking-widest text-gray-400 uppercase shrink-0 ml-2">${item.dateAddedStr}</p>
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

function openReader(bookId, conceptIndex, globalIndex, updateHistory = true) {
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
    
    if (updateHistory && window.location.hash !== `#read=${bookId}-${conceptIndex}`) {
        window.history.pushState(null, null, `#read=${bookId}-${conceptIndex}`);
    }
    
    // Check if we were passed a specific scroll position via URL (from Profile)
    const urlParams = new URLSearchParams(window.location.search);
    const resumeBook = urlParams.get('resumeBook');
    const resumeConcept = urlParams.get('resumeConcept');
    const scrollPos = urlParams.get('scroll');
    if (resumeBook === bookId && parseInt(resumeConcept) === conceptIndex && scrollPos) {
        // Wait for render to finish before scrolling
        setTimeout(() => {
            overlay.scrollTop = parseInt(scrollPos);
        }, 100);
        // Clear params to prevent re-triggering
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
    
    // Reset progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = '0%';
    
    updateActionButtonsState();
    renderConceptDisplay();
    startReadingTimer();
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

async function syncToFirestore(field, data) {
    if (currentUser) {
        try {
            await db.collection('users').doc(currentUser.uid).update({ [field]: data });
            if (userProfile) userProfile[field] = data;
        } catch (err) {
            console.error("Sync error:", err);
        }
    }
}

async function toggleSaved() {
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
    await syncToFirestore('saved', saved);
}

async function toggleBookmark() {
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
    await syncToFirestore('bookmarks', bookmarks);
}

async function toggleCompleted() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let completed = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    let isAdding = false;
    
    if (completed.includes(conceptId)) {
        completed = completed.filter(id => id !== conceptId);
    } else {
        completed.push(conceptId);
        isAdding = true;
    }
    
    localStorage.setItem('ka_completed', JSON.stringify(completed));
    updateActionButtonsState();
    renderExplorer();
    
    // Sync array (backward compat)
    await syncToFirestore('completed', completed);
    
    // Sync subcollections (New Architecture)
    if (currentUser) {
        try {
            const result = findBookById(currentBookId);
            if (!result) return;
            const concept = result.book.concepts[currentConceptIndex];
            
            const userRef = db.collection('users').doc(currentUser.uid);
            if (isAdding) {
                if (concept.isPremium) {
                    await userRef.collection('completedFrameworks').doc(conceptId).set({
                        frameworkId: conceptId,
                        bookId: currentBookId,
                        completedAt: new Date().toISOString(),
                        lastOpenedAt: new Date().toISOString(),
                        readingTime: 0,
                        completionPercentage: 100
                    });
                } else {
                    await userRef.collection('completedConcepts').doc(conceptId).set({
                        conceptId: conceptId,
                        bookId: currentBookId,
                        completedAt: new Date().toISOString(),
                        lastOpenedAt: new Date().toISOString(),
                        readingTime: 0,
                        completionPercentage: 100
                    });
                }
            } else {
                if (concept.isPremium) {
                    await userRef.collection('completedFrameworks').doc(conceptId).delete();
                } else {
                    await userRef.collection('completedConcepts').doc(conceptId).delete();
                }
            }
        } catch (e) {
            console.error("Error syncing completed subcollections", e);
        }
    }
}

async function toggleSaveLater() {
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
    await syncToFirestore('saveLater', saveLater);
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

// ─────────────────────────────────────────────────────────────────────────────
// READING EXPERIENCE RENDERER — Premium Editorial System
// Philosophy: Less Interface. More Reading. Every element must earn its place.
// ─────────────────────────────────────────────────────────────────────────────

// Full-width reading layout
const READING_COL = 'w-full';
const WIDE_COL = 'w-full';

function renderVisualCard(content) {
    const codeMatch = content.match(/```([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : '';
    const captionText = content.replace(/```[\s\S]*?```/, '').trim();
    let parsedCaption = captionText;
    if (typeof marked !== 'undefined') {
        parsedCaption = marked.parseInline ? marked.parseInline(captionText) : captionText;
    }
    return `
    <div class="reader-section" data-section="Visual Framework">
        <div class="section-label"><span class="section-dot" style="background:#059669"></span>Visual Framework</div>
        <div class="section-body">
            <div class="w-full bg-[#0a0a0a] dark:bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-lg">
                <div class="w-full h-[2px] bg-emerald-600"></div>
                <div class="px-6 py-8 sm:px-10 overflow-x-auto">
                    <pre class="text-emerald-400 font-mono text-[11px] sm:text-sm leading-[2] tracking-wide whitespace-pre">${code}</pre>
                </div>
                ${captionText ? `<div class="border-t border-white/10 px-6 sm:px-10 py-4 text-sm text-gray-400 italic">${parsedCaption}</div>` : ''}
            </div>
        </div>
    </div>`;
}

function renderExplanationCard(title, content) {
    let parsedContent = content;
    if (typeof marked !== 'undefined') {
        parsedContent = marked.parse ? marked.parse(content) : content;
    }
    const dotColor = title === 'Simple Explanation' ? '#166534' : title === 'Why It Matters' ? '#1d4ed8' : '#374151';
    return `
    <div class="reader-section" data-section="${title}">
        <div class="section-label"><span class="section-dot" style="background:${dotColor}"></span>${title}</div>
        <div class="section-body">
            <div class="text-[1.1rem] md:text-[1.25rem] font-serif text-[#111] dark:text-gray-100 leading-[1.85] prose prose-lg dark:prose-invert max-w-none prose-p:mb-4">${parsedContent}</div>
        </div>
    </div>`;
}

function renderExampleCard(content) {
    let parsedContent = content;
    if (typeof marked !== 'undefined') {
        parsedContent = marked.parse ? marked.parse(content) : content;
    }
    return `
    <div class="reader-section" data-section="Real-Life Example">
        <div class="section-label"><span class="section-dot" style="background:#d97706"></span>Real-Life Example</div>
        <div class="section-body">
            <div class="border-l-2 border-[#d97706] pl-5">
                <div class="text-[1.05rem] md:text-[1.15rem] font-serif text-[#222] dark:text-gray-300 leading-[1.85] prose dark:prose-invert max-w-none prose-p:mb-4">${parsedContent}</div>
            </div>
        </div>
    </div>`;
}

function renderWarningCard(content) {
    let parsedContent = content;
    if (typeof marked !== 'undefined') {
        parsedContent = marked.parse ? marked.parse(content) : content;
    }
    return `
    <div class="reader-section" data-section="Common Mistake">
        <div class="section-label"><span class="section-dot" style="background:#dc2626"></span>Common Mistake</div>
        <div class="section-body">
            <div class="flex items-start gap-3">
                <svg class="w-4 h-4 mt-1 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <div class="text-base md:text-[1.05rem] text-[#333] dark:text-red-200 leading-[1.85] prose dark:prose-invert max-w-none prose-p:mb-4">${parsedContent}</div>
            </div>
        </div>
    </div>`;
}

function renderReflectionCard(content, id) {
    const savedText = localStorage.getItem(`reflection_${id}`) || '';
    return `
    <div class="reader-section" data-section="Reflect">
        <div class="section-label"><span class="section-dot" style="background:#4f46e5"></span>Reflect</div>
        <div class="section-body">
            <p class="text-[1.05rem] md:text-[1.15rem] font-serif text-[#111] dark:text-gray-100 leading-[1.8] mb-5">${content}</p>
            <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <textarea
                    id="reflection_input_${id}"
                    oninput="this.style.height='auto'; this.style.height=this.scrollHeight+'px'; autoSaveReflection('${id}')"
                    class="w-full bg-white dark:bg-[#111] px-5 py-4 text-sm text-[#333] dark:text-gray-300 focus:outline-none resize-none leading-relaxed placeholder-gray-300 dark:placeholder-gray-700 min-h-[80px]"
                    placeholder="Write your thoughts here…"
                    style="height: auto"
                >${savedText}</textarea>
                <div class="px-5 py-2 bg-gray-50 dark:bg-[#0e0e0e] border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <span id="reflection_status_${id}" class="text-[11px] text-gray-400 font-medium">${savedText ? 'Saved' : ''}</span>
                </div>
            </div>
        </div>
    </div>`;
}

let _reflectionTimers = {};
function autoSaveReflection(id) {
    clearTimeout(_reflectionTimers[id]);
    const statusEl = document.getElementById(`reflection_status_${id}`);
    if (statusEl) statusEl.textContent = '';
    _reflectionTimers[id] = setTimeout(() => {
        const val = document.getElementById(`reflection_input_${id}`)?.value || '';
        localStorage.setItem(`reflection_${id}`, val);
        if (statusEl) {
            statusEl.textContent = 'Saved just now';
            setTimeout(() => { if(statusEl) statusEl.textContent = ''; }, 2000);
        }
    }, 800);
}

function saveReflection(id) {
    const val = document.getElementById(`reflection_input_${id}`)?.value || '';
    localStorage.setItem(`reflection_${id}`, val);
    const statusEl = document.getElementById(`reflection_status_${id}`);
    if (statusEl) { statusEl.textContent = 'Saved just now'; setTimeout(()=>{ statusEl.textContent=''; }, 2000); }
}

function renderActionCard(title, content, id) {
    const safeTitle = title.replace(/\s+/g, '_');
    const isChecked = localStorage.getItem(`action_${id}_${safeTitle}`) === 'true';
    const textClass = isChecked ? 'opacity-50 line-through' : '';
    const iconPath = isChecked ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>' : '';
    const boxClass = isChecked ? 'bg-[#0a0a0a] dark:bg-emerald-500 border-transparent' : 'border-gray-300 dark:border-gray-600';
    return `
    <div class="reader-section" data-section="${title}">
        <div class="section-label"><span class="section-dot" style="background:#0a0a0a"></span>${title}</div>
        <div class="section-body">
            <button type="button" onclick="toggleActionItem('${id}', '${safeTitle}', this)" class="w-full text-left flex items-start gap-4 group">
                <div class="w-5 h-5 mt-[3px] shrink-0 rounded-full border-2 ${boxClass} flex items-center justify-center transition-all duration-200">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconPath}</svg>
                </div>
                <div id="action_container_${id}_${safeTitle}" class="flex-1 ${textClass} transition-all duration-200">
                    <p class="text-base text-[#333] dark:text-gray-300 leading-[1.8] group-hover:text-[#0a0a0a] dark:group-hover:text-white transition-colors">${content}</p>
                </div>
            </button>
        </div>
    </div>`;
}

function toggleActionItem(id, safeTitle, el) {
    const container = document.getElementById(`action_container_${id}_${safeTitle}`);
    const btn = el.closest ? el.closest('button') || el : el;
    const box = btn.querySelector('.rounded-full');
    const icon = btn.querySelector('svg');
    const isChecked = localStorage.getItem(`action_${id}_${safeTitle}`) === 'true';
    
    if (isChecked) {
        localStorage.setItem(`action_${id}_${safeTitle}`, 'false');
        if(container) { container.classList.remove('opacity-50', 'line-through'); }
        if(icon) icon.innerHTML = '';
        if(box) { box.classList.remove('bg-[#0a0a0a]', 'dark:bg-emerald-500', 'border-transparent'); box.classList.add('border-gray-300', 'dark:border-gray-600'); }
    } else {
        localStorage.setItem(`action_${id}_${safeTitle}`, 'true');
        if(container) { container.classList.add('opacity-50', 'line-through'); }
        if(icon) icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>';
        if(box) { box.classList.add('bg-[#0a0a0a]', 'dark:bg-emerald-500', 'border-transparent'); box.classList.remove('border-gray-300', 'dark:border-gray-600'); }
    }
}

function renderMemoryCard(title, content) {
    const clean = content.replace(/\*/g, '').trim();
    return `
    <div class="reader-section" data-section="Mental Model">
        <div class="section-label"><span class="section-dot" style="background:#0a0a0a"></span>Mental Model</div>
        <div class="section-body">
            <div class="bg-[#0a0a0a] dark:bg-[#0e0e0e] text-white rounded-xl px-8 sm:px-12 py-10 border border-[#1a1a1a]">
                <p class="text-[1.2rem] sm:text-[1.35rem] font-serif leading-[1.8] italic text-gray-100 text-center">&ldquo;${clean}&rdquo;</p>
            </div>
        </div>
    </div>`;
}

function renderTakeawayCard(content) {
    const clean = content.replace(/\*/g, '').replace(/'/g, "\\'");
    const display = content.replace(/\*/g, '');
    const copyFn = `(function(){
        navigator.clipboard.writeText('${clean}');
        const t=document.getElementById('toast');
        if(t){t.innerHTML='Copied to clipboard';t.classList.remove('opacity-0');setTimeout(()=>t.classList.add('opacity-0'),2000);}
    })()`;
    return `
    <div class="reader-section" data-section="Key Takeaway">
        <div class="section-label"><span class="section-dot" style="background:#166534"></span>Key Takeaway</div>
        <div class="section-body">
            <p class="text-[1.4rem] sm:text-[1.6rem] font-serif text-[#0a0a0a] dark:text-white leading-[1.65] font-medium mb-6">${display}</p>
            <button onclick="${copyFn}" class="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Copy
            </button>
        </div>
    </div>`;
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

    // Build sections outline from the content
    const sectionOrder = ['Visual Framework','Simple Explanation','Why It Matters','Real-Life Example','Common Mistake','Reflect','Try This Today','Mental Model','Key Takeaway'];

    const premiumBadge = (concept.premium || concept.isPremium) ? `
        <span class="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Premium Framework
        </span>` : '';

    display.innerHTML = `
        <style>
            .reader-layout { display: flex; width: 100%; min-height: 100vh; }
            .reader-sidebar {
                display: none;
                width: 220px;
                min-width: 220px;
                flex-shrink: 0;
                padding: 2.5rem 1.5rem 2.5rem 2rem;
                border-right: 1px solid #f0f0f0;
                position: sticky;
                top: 64px;
                height: calc(100vh - 64px);
                overflow-y: auto;
            }
            .dark .reader-sidebar { border-color: #1f1f1f; }
            @media (min-width: 1024px) { .reader-sidebar { display: block; } }
            .sidebar-outline-title {
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #9ca3af;
                margin-bottom: 1rem;
            }
            .sidebar-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                cursor: pointer;
                transition: all 0.15s;
                margin-bottom: 2px;
                text-decoration: none;
            }
            .sidebar-item:hover { background: #f9fafb; color: #0a0a0a; }
            .dark .sidebar-item:hover { background: #1a1a1a; color: #fff; }
            .sidebar-item.active { background: #f0fdf4; color: #166534; font-weight: 700; }
            .dark .sidebar-item.active { background: #052e16; color: #4ade80; }
            .sidebar-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
            .reader-main { flex: 1; min-width: 0; padding: 2.5rem 2rem 6rem; }
            @media (min-width: 768px) { .reader-main { padding: 2.5rem 3rem 6rem; } }
            @media (min-width: 1280px) { .reader-main { padding: 2.5rem 4rem 6rem; } }
            .reader-section { margin-bottom: 0; border-bottom: 1px solid #f3f4f6; }
            .dark .reader-section { border-color: #1a1a1a; }
            .reader-section:last-child { border-bottom: none; }
            .section-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #9ca3af;
                padding: 1.25rem 0 0.75rem;
                cursor: pointer;
                user-select: none;
            }
            .section-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
            .section-body { padding: 0.5rem 0 2rem 1.25rem; }
            @media (max-width: 640px) { .section-body { padding-left: 0; } }
        </style>
        <div class="animate-fade">
            <!-- Concept Header -->
            <div style="padding: 2.5rem 2rem 0; border-bottom: 1px solid #f3f4f6;" class="dark:border-b-[#1a1a1a]">
                ${premiumBadge}
                <h1 class="text-[1.9rem] sm:text-[2.4rem] md:text-[2.9rem] font-bold font-serif text-[#0a0a0a] dark:text-white leading-[1.15] tracking-tight mb-6">
                    ${concept.title}
                </h1>
                <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">From <span class="text-[#0a0a0a] dark:text-gray-200">${book.title}</span></p>
            </div>

            <!-- Two Column: Sidebar + Content -->
            <div class="reader-layout">
                <!-- Left Outline Sidebar -->
                <aside class="reader-sidebar" id="reader-outline-sidebar">
                    <div class="sidebar-outline-title">In this concept</div>
                    <nav id="reader-outline-nav"></nav>
                </aside>

                <!-- Main Content -->
                <div class="reader-main">
                    ${mainContentHtml}
                </div>
            </div>
        </div>
    `;

    // Build outline nav from rendered sections
    setTimeout(() => {
        const nav = document.getElementById('reader-outline-nav');
        const sections = document.querySelectorAll('#reader-display .reader-section');
        if (!nav || !sections.length) return;
        const dotColors = {
            'Visual Framework': '#059669',
            'Simple Explanation': '#166534',
            'Why It Matters': '#1d4ed8',
            'Real-Life Example': '#d97706',
            'Common Mistake': '#dc2626',
            'Reflect': '#4f46e5',
            'Mental Model': '#0a0a0a',
            'Key Takeaway': '#166534'
        };
        let html = '';
        sections.forEach((sec, i) => {
            const name = sec.getAttribute('data-section') || `Section ${i+1}`;
            const color = dotColors[name] || '#6b7280';
            sec.setAttribute('id', `reader-sec-${i}`);
            html += `<a class="sidebar-item" href="#reader-sec-${i}" onclick="highlightSidebarItem(this); return true;">
                <span class="sidebar-dot" style="background:${color}"></span>${name}
            </a>`;
        });
        nav.innerHTML = html;

        // Scroll spy
        const overlay = document.getElementById('reader-overlay');
        if (overlay) {
            overlay._spyFn && overlay.removeEventListener('scroll', overlay._spyFn);
            overlay._spyFn = function() {
                let active = 0;
                sections.forEach((sec, i) => {
                    if (sec.getBoundingClientRect().top < 200) active = i;
                });
                document.querySelectorAll('#reader-outline-nav .sidebar-item').forEach((a, i) => {
                    a.classList.toggle('active', i === active);
                });
            };
            overlay.addEventListener('scroll', overlay._spyFn);
        }
    }, 50);
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

function highlightSidebarItem(el) {
    document.querySelectorAll('#reader-outline-nav .sidebar-item').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
}

function closeReader(updateHistory = true) {
    stopReadingTimer();
    document.getElementById('reader-overlay').classList.add('hidden');
    document.body.style.overflow = ''; 

    if (updateHistory && window.location.hash.startsWith('#read=')) {
        window.history.back();
    }
}

function navigateConcept(direction) {
    const result = findBookById(currentBookId);
    if (!result) return;
    const { book } = result;
    const newIndex = currentConceptIndex + direction;
    if (newIndex < 0 || newIndex >= book.concepts.length) return;
    const item = allConcepts.find(c => c.bookId === currentBookId && c.conceptIndex === newIndex);
    if (!item) return;
    // Scroll reader to top
    const overlay = document.getElementById('reader-overlay');
    if (overlay) overlay.scrollTop = 0;
    // Re-open with new index
    window.history.replaceState(null, null, `#read=${currentBookId}-${newIndex}`);
    openReader(currentBookId, newIndex, item.globalIndex, false);
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
    
    // Auto-Save variables
    let progressSaveTimeout = null;
    let lastSavedPct = 0;

    // Reader Progress Bar & Text
    document.getElementById('reader-overlay').addEventListener('scroll', function() {
        const overlay = this;
        const progress = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        let scrolled = 0;
        if(overlay.scrollHeight > overlay.clientHeight) {
            scrolled = (overlay.scrollTop / (overlay.scrollHeight - overlay.clientHeight)) * 100;
            scrolled = Math.max(0, Math.min(100, scrolled));
            
            if (progress) progress.style.width = scrolled + '%';
            if (progressText) progressText.textContent = Math.round(scrolled) + '%';
        }

        // Auto Save Progress to Firebase
        if (currentUser && currentBookId) {
            // Save if scrolled 10% more, or after 10 seconds of stopping
            if (Math.abs(scrolled - lastSavedPct) > 10) {
                lastSavedPct = scrolled;
                saveReadingProgress(overlay.scrollTop, scrolled);
            } else {
                clearTimeout(progressSaveTimeout);
                progressSaveTimeout = setTimeout(() => {
                    lastSavedPct = scrolled;
                    saveReadingProgress(overlay.scrollTop, scrolled);
                }, 10000);
            }
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
    handleHashRoute();
};

window.addEventListener('hashchange', () => {
    handleHashRoute();
});

function handleHashRoute() {
    const hash = window.location.hash.replace('#', '');
    
    if (hash.startsWith('read=')) {
        const parts = hash.replace('read=', '').split('-');
        if (parts.length >= 2) {
            const conceptIndex = parseInt(parts.pop());
            const bookId = parts.join('-');
            const item = allConcepts.find(c => c.bookId === bookId && c.conceptIndex === conceptIndex);
            if (item) {
                // Ensure underlying view is rendered (default to explorer if coming from external link/refresh without prior state)
                const currentView = document.querySelector('main > section:not(.hidden)');
                if (!currentView || currentView.id === 'view-dashboard') {
                   navTo('explorer', false);
                }
                
                if (document.getElementById('reader-overlay').classList.contains('hidden')) {
                    openReader(bookId, conceptIndex, item.globalIndex, false);
                }
            }
        }
        return;
    }

    // Navigating back to a main view, close reader if open
    if (!document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(false);
    }

    const validViews = ['dashboard', 'explorer', 'explorer-premium', 'admin', 'profile'];
    if (validViews.includes(hash)) {
        navTo(hash, false);
    } else {
        navTo('dashboard', false);
    }
}

document.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape' && !document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(); 
    }
});

// ----------------------------------------------------
// FIREBASE READING TRACKING & HISTORY
// ----------------------------------------------------

let readingSessionTimer = null;

function startReadingTimer() {
    if (readingSessionTimer) clearInterval(readingSessionTimer);
    readingSessionTimer = setInterval(() => {
        // Every 1 minute, if the reader is open and page is focused, log a minute
        if (!document.getElementById('reader-overlay').classList.contains('hidden') && document.hasFocus()) {
            saveReadingMinutesToHistory(1);
        }
    }, 60000); // 1 minute
}

function stopReadingTimer() {
    if (readingSessionTimer) clearInterval(readingSessionTimer);
}

async function saveReadingProgress(scrollTop, percentage) {
    if (!currentUser || !currentBookId) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('progress').doc('current').set({
            bookId: currentBookId,
            conceptIndex: currentConceptIndex,
            globalContentIndex: currentGlobalIndex,
            scrollPosition: scrollTop,
            readingPercentage: percentage,
            lastReadTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error("Failed to save reading progress:", err);
    }
}

async function saveReadingMinutesToHistory(minutes) {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    try {
        const docRef = db.collection('users').doc(currentUser.uid).collection('history').doc(today);
        await docRef.set({
            readingMinutes: firebase.firestore.FieldValue.increment(minutes),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error("Failed to update history:", err);
    }
}
