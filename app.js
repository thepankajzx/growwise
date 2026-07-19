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
                
                // Restore admin status if marked in profile
                if (userProfile.isAdmin === true) {
                    localStorage.setItem('tc_admin', 'true');
                    localStorage.setItem('tlp_role', 'admin');
                }
            } else {
                userProfile = { isPremium: false, isAdmin: false, saved: [], bookmarks: [], completed: [], saveLater: [] };
                await docRef.set(userProfile);
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    } else {
        userProfile = null;
        localStorage.removeItem('tc_admin');
        localStorage.removeItem('tlp_role');
    }
    updateMembershipUI();
    checkAdminStatus();
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
    const val = input.value.trim().toLowerCase();
    
    if (val === 'pankaj@pro') {
        if (!currentUser) {
            input.value = '';
            input.placeholder = 'Please Log In First';
            input.classList.add('border-red-500');
            setTimeout(() => {
                input.placeholder = 'Enter Access Code';
                input.classList.remove('border-red-500');
            }, 2000);
            return;
        }
        
        btn.textContent = 'VERIFYING...';
        try {
            await db.collection('users').doc(currentUser.uid).update({ isAdmin: true, isPremium: true });
            userProfile.isAdmin = true;
            userProfile.isPremium = true;
            
            localStorage.setItem('tc_admin', 'true');
            localStorage.setItem('tlp_role', 'admin');
            localStorage.setItem('tc_premium', 'true');
            
            btn.textContent = 'ADMIN ACCESS GRANTED';
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
                checkAdminStatus();
                setPremiumFilter(true);
            }, 1500);
        } catch (err) {
            console.error(err);
            btn.textContent = 'ERROR';
        }
    } else if(val === 'pankaj@') {
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

function checkAdminStatus() {
    const adminBtn = document.getElementById('btn-admin');
    if (!adminBtn) return;
    const isAdmin = localStorage.getItem('tc_admin') === 'true' || localStorage.getItem('tlp_role') === 'admin';
    if(isAdmin) {
        adminBtn.style.display = 'flex';
    } else {
        adminBtn.style.display = 'none';
        const viewAdmin = document.getElementById('view-admin');
        if(viewAdmin && !viewAdmin.classList.contains('hidden')) {
            navTo('explorer');
        }
    }
}
checkAdminStatus();


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
    const emailInput = document.getElementById('login-email').value.trim().toLowerCase();
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
        localStorage.removeItem('tc_admin');
        checkAdminStatus();
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
    checkAdminStatus();

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
    const btnDesktop = document.getElementById('mega-menu-btn');
    const btnMobile = document.getElementById('mega-menu-btn-mobile');
    if (menu && !menu.classList.contains('hidden')) {
        const outsideMenu = !menu.contains(event.target);
        const outsideDesktop = !btnDesktop || !btnDesktop.contains(event.target);
        const outsideMobile = !btnMobile || !btnMobile.contains(event.target);
        if (outsideMenu && outsideDesktop && outsideMobile) {
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
    
    // Save current hash so back button knows where to go
    if (!window._hashBeforeReader) {
        const h = window.location.hash.replace('#', '');
        window._hashBeforeReader = (h && !h.startsWith('read=')) ? h : 'explorer';
    }

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
                    <section class="block prose">
                        ${parsed}
                    </section>
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
    <section class="block" id="visual" data-title="Visual Framework">
        <p class="block__label">Visual Framework</p>
        <div class="diagram" style="padding: 1.5rem; overflow-x: auto;">
            <pre class="font-mono text-[11px] sm:text-sm text-emerald-400 leading-[2]">${code}</pre>
            ${captionText ? `<div class="mt-4 pt-4 border-t border-[#2B291F] text-xs text-[#8A8578] italic">${parsedCaption}</div>` : ''}
        </div>
    </section>`;
}

function renderExplanationCard(title, content) {
    let parsedContent = content;
    if (typeof marked !== 'undefined') {
        parsedContent = marked.parse ? marked.parse(content) : content;
    }
    
    if (title === 'Why It Matters') {
        return `
        <section class="block" id="matters" data-title="Why It Matters">
            <p class="block__label">Why It Matters</p>
            <div class="pullquote">
                ${parsedContent}
            </div>
        </section>`;
    }
    
    return `
    <section class="block prose" id="explanation" data-title="Simple Explanation">
        <p class="block__label">Simple Explanation</p>
        ${parsedContent}
    </section>`;
}

function renderExampleCard(content) {
    let parsedContent = content;
    if (typeof marked !== 'undefined') {
        parsedContent = marked.parse ? marked.parse(content) : content;
    }
    return `
    <section class="block" id="example" data-title="Real-Life Example">
        <p class="block__label">Real-Life Example</p>
        <div class="card prose prose-p:mb-0">
            ${parsedContent}
        </div>
    </section>`;
}

function renderWarningCard(content) {
    let parsedContent = content;
    if (typeof marked !== 'undefined') {
        parsedContent = marked.parseInline ? marked.parseInline(content) : content;
    }
    return `
    <section class="block" id="mistake" data-title="Common Mistake">
        <p class="block__label">Common Mistake</p>
        <div class="callout">
            <svg class="callout__icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <p>${parsedContent}</p>
        </div>
    </section>`;
}

function renderReflectionCard(content, id) {
    const savedText = localStorage.getItem(`reflection_${id}`) || '';
    return `
    <section class="block" id="reflect" data-title="Reflect">
        <p class="block__label">Reflect</p>
        <div class="reflect">
            <p>${content}</p>
            <textarea
                id="reflection_input_${id}"
                oninput="this.style.height='auto'; this.style.height=this.scrollHeight+'px'; autoSaveReflection('${id}')"
                placeholder="Write your thoughts here..."
            >${savedText}</textarea>
            <div style="text-align: right; margin-top: 0.25rem;">
                <span id="reflection_status_${id}" style="font-size: 0.75rem; color: var(--ink-faint);">${savedText ? 'Saved' : ''}</span>
            </div>
        </div>
    </section>`;
}

function renderActionCard(title, content, id) {
    const safeTitle = title.replace(/\s+/g, '_');
    
    let items = [];
    if (content.includes('- ')) {
        items = content.split('- ').filter(i => i.trim().length > 0).map(i => i.trim());
    } else {
        items = [content.trim()];
    }
    
    let html = `
    <section class="block" id="try" data-title="Try This Today">
        <p class="block__label">Try This Today (5 minutes)</p>
        <ul class="checklist">
    `;
    
    items.forEach((item, index) => {
        const itemSafeTitle = `${safeTitle}_${index}`;
        const isChecked = localStorage.getItem(`action_${id}_${itemSafeTitle}`) === 'true';
        const checkedClass = isChecked ? 'is-checked' : '';
        
        let parsedItem = item;
        if (typeof marked !== 'undefined' && marked.parseInline) {
            parsedItem = marked.parseInline(item);
        }
        
        html += `
            <li class="checklist__item ${checkedClass}" onclick="toggleChecklist(this, '${id}', '${itemSafeTitle}')">
                <span class="checklist__box"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span>${parsedItem}</span>
            </li>
        `;
    });
    
    html += `</ul></section>`;
    return html;
}

window.toggleChecklist = function(el, id, safeTitle) {
    el.classList.toggle('is-checked');
    const isChecked = el.classList.contains('is-checked');
    localStorage.setItem(`action_${id}_${safeTitle}`, isChecked ? 'true' : 'false');
};

function renderMemoryCard(title, content) {
    const clean = content.replace(/\*/g, '').trim();
    return `
    <section class="block" id="mental-model" data-title="Mental Model">
        <p class="block__label">Mental Model</p>
        <div class="card" style="text-align: center; font-style: italic; font-family: 'Fraunces', serif; font-size: 1.25rem; line-height: 1.6;">
            &ldquo;${clean}&rdquo;
        </div>
    </section>`;
}

function renderTakeawayCard(content) {
    const clean = content.replace(/\*/g, '').replace(/'/g, "\\'");
    const display = content.replace(/\*/g, '');
    const copyFn = `(function(){
        navigator.clipboard.writeText('${clean}');
        alert('Copied to clipboard!');
    })()`;
    return `
    <section class="block" id="takeaway" data-title="Key Takeaway">
        <p class="block__label">Key Takeaway</p>
        <div class="card">
            <p style="font-family: 'Fraunces', serif; font-size: 1.4rem; font-weight: 500; line-height: 1.6; margin-bottom: 1rem;">${display}</p>
            <button onclick="${copyFn}" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--accent); cursor: pointer; border: none; background: transparent; padding: 0;">Copy text</button>
        </div>
    </section>`;
}

function renderConceptDisplay() {
    const book = findBookById(currentBookId).book;
    const display = document.getElementById('reader-content');
    const tocList = document.getElementById('toc-list');
    
    const concept = book.concepts[currentConceptIndex];
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    
    // Set headers
    const eyebrow = document.getElementById('hero-eyebrow');
    const titleEl = document.getElementById('hero-title');
    const meta = document.getElementById('hero-meta');
    
    if (eyebrow) eyebrow.innerHTML = `From <strong>${book.title}</strong>`;
    if (titleEl) titleEl.textContent = concept.title;
    
    const wordCount = (concept.markdown || concept.explanation).split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    if (meta) {
        meta.innerHTML = `<span><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>${readTime} min read</span>`;
    }

    let mainContentHtml = '';
    if (concept.htmlFile) {
        if (display) {
            display.innerHTML = `
                <iframe src="${concept.htmlFile}" class="w-full min-h-[85vh] border-0 rounded-b-2xl" title="${concept.title}"></iframe>
            `;
        }
        if (tocList) tocList.innerHTML = '';
        return;
    } else if (concept.markdown) {
        mainContentHtml = parseConceptToComponents(concept.markdown, conceptId);
    } else {
        const sentences = concept.explanation.match(/[^.!?]+[.!?]+/g) || [concept.explanation];
        let premise = sentences[0] || '';
        if (sentences.length > 1 && premise.length < 50) premise += sentences[1];
        let mechanism = concept.explanation.replace(premise, '').trim();
        let steps = concept.approach.split('. ').filter(s => s.trim().length > 0);
        
        mainContentHtml = `
            <section class="block prose" id="explanation" data-title="Explanation">
                <p class="block__label">Explanation</p>
                <p><strong>${premise}</strong></p>
                <p>${mechanism}</p>
            </section>
            <section class="block prose" id="try" data-title="Try This Today">
                <p class="block__label">Try This Today</p>
                <ul class="checklist">
                    ${steps.map(s => `<li class="checklist__item"><span>${s}</span></li>`).join('')}
                </ul>
            </section>
        `;
    }
    
    if (display) display.innerHTML = mainContentHtml;
    
    const isSaved = arsenalState.some(a => a.bookId === currentBookId && a.conceptIndex === currentConceptIndex);
    const favToggle = document.getElementById('sidebar-btn-saved');
    if (favToggle) {
        if (isSaved) favToggle.classList.add('is-active');
        else favToggle.classList.remove('is-active');
    }

    const hasPrev = currentConceptIndex > 0;
    const hasNext = currentConceptIndex < book.concepts.length - 1;
    let navHtml = '';
    if (hasPrev) {
        const prevC = book.concepts[currentConceptIndex - 1];
        navHtml += `
            <a href="#" class="prev" onclick="openReader('${currentBookId}', ${currentConceptIndex - 1}); return false;">
                <span class="concept-nav__dir">← Previous</span>
                <span class="concept-nav__title">${prevC.title}</span>
            </a>
        `;
    } else {
        navHtml += `<div></div>`;
    }
    
    if (hasNext) {
        const nextC = book.concepts[currentConceptIndex + 1];
        navHtml += `
            <a href="#" class="next" onclick="openReader('${currentBookId}', ${currentConceptIndex + 1}); return false;">
                <span class="concept-nav__dir">Next →</span>
                <span class="concept-nav__title">${nextC.title}</span>
            </a>
        `;
    } else {
        navHtml += `<div></div>`;
    }
    
    const navEl = document.getElementById('concept-nav');
    if (navEl) navEl.innerHTML = navHtml;

    if (tocList && display) {
        tocList.innerHTML = '';
        const blocks = display.querySelectorAll('section.block[id]');
        blocks.forEach(block => {
            const title = block.getAttribute('data-title');
            if (title) {
                const li = document.createElement('li');
                li.innerHTML = `<a class="toc__link" data-target="${block.id}"><span class="toc__dot"></span>${title}</a>`;
                tocList.appendChild(li);
            }
        });
        
        const links = tocList.querySelectorAll('.toc__link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(link.dataset.target);
                if (target) {
                    const offset = 80;
                    const readerOverlay = document.getElementById('reader-overlay');
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = readerOverlay.scrollTop + elementPosition - offset;
                    
                    readerOverlay.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
                const toc = document.getElementById('toc');
                if (window.innerWidth <= 900 && toc) toc.classList.remove('is-open');
            });
        });
        
        const tocToggle = document.getElementById('tocToggle');
        if (tocToggle) {
            const newToggle = tocToggle.cloneNode(true);
            tocToggle.parentNode.replaceChild(newToggle, tocToggle);
            newToggle.addEventListener('click', () => {
                const toc = document.getElementById('toc');
                if (toc) toc.classList.toggle('is-open');
            });
        }
    }
    
    if (typeof onReaderScroll === 'function') onReaderScroll();
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

    if (updateHistory) {
        // Use the hash that was saved when the reader was opened
        const targetHash = window._hashBeforeReader || 'explorer';
        window.location.hash = '#' + targetHash;
        window._hashBeforeReader = null;
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
function initializeApp() {
    updateMembershipUI();
    flattenData();
    updateSourceDropdown('all');
    renderDashboard();
    renderExplorer();
    
    // Auto-Save variables
    let progressSaveTimeout = null;
    let lastSavedPct = 0;

    // Reader Progress Bar, TOC Spy & Text
    window.onReaderScroll = function() {
        const overlay = document.getElementById('reader-overlay');
        if (!overlay) return;
        const progressFill = document.querySelector('.progress-rail__fill');
        const progressText = document.querySelector('.percent-dial__label');
        const percentDial = document.getElementById('percentDial');
        
        let scrolled = 0;
        if(overlay.scrollHeight > overlay.clientHeight) {
            scrolled = (overlay.scrollTop / (overlay.scrollHeight - overlay.clientHeight)) * 100;
            scrolled = Math.max(0, Math.min(100, scrolled));
            
            if (progressFill) progressFill.style.width = scrolled + '%';
            if (progressText) progressText.textContent = Math.round(scrolled) + '%';
            if (percentDial) percentDial.style.setProperty('--pct', scrolled + '%');
            
            // TOC active dot logic
            const blocks = document.querySelectorAll('section.block[id]');
            let activeId = null;
            blocks.forEach(block => {
                if (block.getBoundingClientRect().top < 300) {
                    activeId = block.id;
                }
            });
            if (activeId) {
                document.querySelectorAll('.toc__link').forEach(link => {
                    if (link.dataset.target === activeId) link.classList.add('is-active');
                    else link.classList.remove('is-active');
                });
            }
        }

        // Auto Save Progress to Firebase
        if (typeof currentUser !== 'undefined' && currentUser && currentBookId) {
            // Save if scrolled 10% more, or after 10 seconds of stopping
            if (Math.abs(scrolled - lastSavedPct) > 10) {
                lastSavedPct = scrolled;
                if (typeof saveReadingProgress === 'function') saveReadingProgress(overlay.scrollTop, scrolled);
            } else {
                clearTimeout(progressSaveTimeout);
                progressSaveTimeout = setTimeout(() => {
                    lastSavedPct = scrolled;
                    if (typeof saveReadingProgress === 'function') saveReadingProgress(overlay.scrollTop, scrolled);
                }, 10000);
            }
        }
    };
    document.getElementById('reader-overlay').addEventListener('scroll', window.onReaderScroll);


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
}

initializeApp();

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
