// Global state
let allConcepts = [];
let currentCategoryFilter = 'all';
let currentBookFilter = 'all';
let currentLibraryFilter = 'all'; // 'all', 'saved', 'bookmarked', 'completed'

let currentBookId = null;
let currentConceptIndex = 0; // 0 to 9 are concepts, 10 is Master Flowchart
let currentReaderTab = 'concept'; // 'concept' or 'application'
let currentThemeClass = '';
let isNightMode = false;

function flattenData() {
    allConcepts = [];
    booksData.forEach(cat => {
        cat.books.forEach(book => {
            book.concepts.forEach((concept, idx) => {
                allConcepts.push({
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
    // clear options except "all"
    select.innerHTML = '<option value="all">All Books</option>';
    
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

function navTo(view) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('nav-active'));
    document.getElementById(`btn-${view}`).classList.add('nav-active');
    window.scrollTo(0, 0);
}

function filterCategory(catId) {
    currentCategoryFilter = catId;
    currentBookFilter = 'all';
    document.getElementById('bookSelect').value = 'all';
    
    // Update pill styles
    const pills = document.querySelectorAll('#filterPills button');
    pills.forEach(pill => {
        pill.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
        pill.classList.add('border-slate-200');
    });
    
    const activePill = document.getElementById(`pill-${catId}`);
    if(activePill) {
        activePill.classList.remove('border-slate-200');
        activePill.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
    }
    
    renderExplorer();
}

function filterBook() {
    currentBookFilter = document.getElementById('bookSelect').value;
    // We could automatically set category filter to 'all' if a book is selected to avoid confusion
    if(currentBookFilter !== 'all') {
        currentCategoryFilter = 'all';
        // Reset pills UI
        const pills = document.querySelectorAll('#filterPills button');
        pills.forEach(pill => {
            pill.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
            pill.classList.add('border-slate-200');
        });
        document.getElementById(`pill-all`).classList.add('bg-slate-900', 'text-white', 'border-slate-900');
    }
    renderExplorer();
}

function filterLibrary(type) {
    currentLibraryFilter = type;
    
    // Update pills UI
    const pills = document.querySelectorAll('#libraryFilters button');
    pills.forEach(pill => {
        pill.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
        pill.classList.add('border-slate-200');
        // keep their base text color class intact except the active one
    });
    
    const activePill = document.getElementById(`lib-${type}`);
    if (activePill) {
        activePill.classList.remove('border-slate-200');
        activePill.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
    }
    
    renderExplorer();
}

function resetToDashboard() {
    // Reset all filters
    currentCategoryFilter = 'all';
    currentBookFilter = 'all';
    currentLibraryFilter = 'all';
    
    // Reset UI Pills
    filterCategory('all');
    filterLibrary('all');
    
    // Close reader if open
    closeReader();
}

function renderDashboard() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';

    booksData.forEach(cat => {
        const card = document.createElement('div');
        card.className = `group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 theme-${cat.id}`;
        card.onclick = () => {
            navTo('explorer');
            filterCategory(cat.id);
        };
        card.innerHTML = `
            <div class="absolute -right-12 -top-12 w-40 h-40 niche-bg opacity-5 group-hover:opacity-10 rounded-full blur-[40px] transition-opacity duration-300 pointer-events-none"></div>
            
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 niche-bg-light niche-text group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 border niche-border">
                <span class="font-black text-2xl">${cat.category.charAt(0)}</span>
            </div>
            
            <div class="space-y-2">
                <h3 class="text-2xl font-bold text-slate-900 group-hover:niche-text transition-colors duration-300">${cat.category}</h3>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full niche-bg"></span>
                    <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">${cat.books.length * 10} Concepts</p>
                </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between group-hover:niche-border transition-colors">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:niche-text transition-colors">Explore Domain →</span>
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
    
    // Library Filters
    if (currentLibraryFilter === 'saved') {
        filtered = filtered.filter(c => savedItems.includes(`${c.bookId}-${c.conceptIndex}`));
    } else if (currentLibraryFilter === 'bookmarked') {
        filtered = filtered.filter(c => bookmarkedItems.includes(`${c.bookId}-${c.conceptIndex}`));
    } else if (currentLibraryFilter === 'completed') {
        filtered = filtered.filter(c => completedItems.includes(`${c.bookId}-${c.conceptIndex}`));
    }
    
    // Niche/Book Filters
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(c => c.categoryId === currentCategoryFilter);
    }
    if (currentBookFilter !== 'all') {
        filtered = filtered.filter(c => c.bookId === currentBookFilter);
    }
    
    if (filtered.length === 0) {
        let msg = "No concepts found for the current filters.";
        if (currentLibraryFilter === 'saved') msg = "You haven't added any concepts to Read Later yet. Explore and click the save icon!";
        if (currentLibraryFilter === 'bookmarked') msg = "You don't have any Favourites yet. Start building your library!";
        if (currentLibraryFilter === 'completed') msg = "You haven't completed any concepts yet. Read a concept and mark it as read!";
        
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="w-16 h-16 mx-auto bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-700 mb-2">It's pretty empty here</h3>
                <p class="text-slate-500">${msg}</p>
                <button onclick="resetToDashboard()" class="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition">View All Concepts</button>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const conceptId = `${item.bookId}-${item.conceptIndex}`;
        const isSaved = savedItems.includes(conceptId);
        const isBookmarked = bookmarkedItems.includes(conceptId);
        const isCompleted = completedItems.includes(conceptId);

        const card = document.createElement('div');
        card.className = `glass-panel p-8 rounded-3xl relative cursor-pointer hover:shadow-xl transition-all group flex flex-col h-full bg-white theme-${item.categoryId}`;
        card.onclick = () => openReader(item.bookId, item.conceptIndex);
        
        let statusIconsHtml = '';
        if (isCompleted) statusIconsHtml += `<div title="Completed" class="flex-shrink-0 flex items-center justify-center"><svg class="w-5 h-5 text-green-500 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg></div>`;
        if (isBookmarked) statusIconsHtml += `<div title="Favourite" class="flex-shrink-0 flex items-center justify-center"><svg class="w-5 h-5 text-red-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg></div>`;
        if (isSaved) statusIconsHtml += `<div title="Read Later" class="flex-shrink-0 flex items-center justify-center"><svg class="w-5 h-5 text-blue-500 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`;

        card.innerHTML = `
            <!-- Quick Save Button on Hover -->
            <button onclick="event.stopPropagation(); toggleSavedDirect('${item.bookId}', ${item.conceptIndex})" class="absolute top-4 right-4 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:scale-110" title="${isSaved ? 'Remove from Read Later' : 'Read Later'}">
                <svg class="w-4 h-4" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
            
            <div class="flex justify-between items-start mb-6 pr-8">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase tracking-widest niche-text niche-bg-light px-3 py-1 rounded-full">${item.categoryName}</span>
                    <div class="flex gap-1">${statusIconsHtml}</div>
                </div>
            </div>
            <div class="flex-1">
                <h4 class="text-2xl font-bold text-slate-900 group-hover:niche-text transition leading-tight mb-3 serif">${item.concept.title}</h4>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wide leading-relaxed">Concept 0${item.conceptIndex + 1} &nbsp;&mdash;&nbsp; from <span class="italic font-extrabold text-slate-700">${item.bookTitle}</span></p>
            </div>
            <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between group-hover:niche-border transition-colors">
                <span class="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:niche-text transition-colors">Read Concept →</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleSavedDirect(bookId, conceptIndex) {
    const conceptId = `${bookId}-${conceptIndex}`;
    let saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    if (saved.includes(conceptId)) {
        saved = saved.filter(id => id !== conceptId);
    } else {
        saved.push(conceptId);
    }
    localStorage.setItem('ka_saved', JSON.stringify(saved));
    renderExplorer(); // Refresh to show/hide badge
}

function findBookById(id) {
    for (const cat of booksData) {
        for (const book of cat.books) {
            if (book.id === id) return { book, cat };
        }
    }
    return null;
}

function openReader(bookId, conceptIndex) {
    currentBookId = bookId;
    currentConceptIndex = conceptIndex;
    currentReaderTab = 'concept';
    
    const result = findBookById(bookId);
    if(!result) return;
    const { book, cat } = result;

    const overlay = document.getElementById('reader-overlay');
    
    // Set Theme
    if (currentThemeClass) {
        overlay.classList.remove(currentThemeClass);
    }
    currentThemeClass = `theme-${cat.id}`;
    overlay.classList.add(currentThemeClass);
    
    // Style the close button with the current theme
    const closeBtn = document.getElementById('reader-close-btn');
    if (closeBtn) {
        closeBtn.className = "hover:opacity-90 flex items-center gap-2 transition px-3 py-1.5 rounded-full border shadow-lg niche-bg text-white border-transparent";
    }

    // We update title in renderConceptDisplay now since it changes per tab
    document.getElementById('reader-category').textContent = cat.category;

    document.body.style.overflow = 'hidden'; 
    overlay.classList.remove('hidden');
    
    // Update Action Buttons State
    updateActionButtonsState();
    
    // Set initial tab styling
    switchReaderTab('concept');
    
    // Render the concept directly
    renderConceptDisplay();
}

function updateActionButtonsState() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    
    // Check local storage
    const saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    const completed = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    
    const btnSaved = document.getElementById('btn-saved');
    const txtSaved = document.getElementById('text-saved');
    if (btnSaved) {
        if (saved.includes(conceptId)) {
            btnSaved.classList.add('border-blue-500', 'text-blue-500', 'bg-blue-500/10');
            btnSaved.classList.remove('border-slate-700', 'text-slate-400');
            txtSaved.textContent = 'Saved';
        } else {
            btnSaved.classList.remove('border-blue-500', 'text-blue-500', 'bg-blue-500/10');
            btnSaved.classList.add('border-slate-700', 'text-slate-400');
            txtSaved.textContent = 'Read Later';
        }
    }

    const btnBookmark = document.getElementById('btn-bookmark');
    const txtBookmark = document.getElementById('text-bookmark');
    if (btnBookmark) {
        if (bookmarks.includes(conceptId)) {
            btnBookmark.classList.add('border-red-500', 'text-red-500', 'bg-red-500/10');
            btnBookmark.classList.remove('border-slate-700', 'text-slate-400');
            txtBookmark.textContent = 'Favourited';
        } else {
            btnBookmark.classList.remove('border-red-500', 'text-red-500', 'bg-red-500/10');
            btnBookmark.classList.add('border-slate-700', 'text-slate-400');
            txtBookmark.textContent = 'Favourite';
        }
    }
    
    const btnCompleted = document.getElementById('btn-completed');
    const txtCompleted = document.getElementById('text-completed');
    if (btnCompleted) {
        if (completed.includes(conceptId)) {
            btnCompleted.classList.add('border-green-500', 'text-green-500', 'bg-green-500/10');
            btnCompleted.classList.remove('border-slate-700', 'text-slate-400');
            txtCompleted.textContent = 'Completed';
        } else {
            btnCompleted.classList.remove('border-green-500', 'text-green-500', 'bg-green-500/10');
            btnCompleted.classList.add('border-slate-700', 'text-slate-400');
            txtCompleted.textContent = 'Mark as Read';
        }
    }
}

function toggleSaved() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let saved = JSON.parse(localStorage.getItem('ka_saved') || '[]');
    
    if (saved.includes(conceptId)) {
        saved = saved.filter(id => id !== conceptId);
    } else {
        saved.push(conceptId);
    }
    
    localStorage.setItem('ka_saved', JSON.stringify(saved));
    updateActionButtonsState();
    renderExplorer(); // update background grid state
}

function toggleBookmark() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let bookmarks = JSON.parse(localStorage.getItem('ka_bookmarks') || '[]');
    
    if (bookmarks.includes(conceptId)) {
        bookmarks = bookmarks.filter(id => id !== conceptId);
    } else {
        bookmarks.push(conceptId);
    }
    
    localStorage.setItem('ka_bookmarks', JSON.stringify(bookmarks));
    updateActionButtonsState();
    renderExplorer(); // update background grid state
}

function toggleCompleted() {
    const conceptId = `${currentBookId}-${currentConceptIndex}`;
    let completed = JSON.parse(localStorage.getItem('ka_completed') || '[]');
    
    if (completed.includes(conceptId)) {
        completed = completed.filter(id => id !== conceptId);
    } else {
        completed.push(conceptId);
    }
    
    localStorage.setItem('ka_completed', JSON.stringify(completed));
    updateActionButtonsState();
    renderExplorer(); // update background grid state
}

function getConsistentScore(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return 75 + (Math.abs(hash) % 25);
}

function getEffortLevel(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const levels = [
        { label: '⚡ Low Effort', color: 'text-green-500' },
        { label: '⏳ Medium Effort', color: 'text-yellow-500' },
        { label: '🔴 High Effort', color: 'text-red-500' }
    ];
    return levels[Math.abs(hash) % 3];
}

function toggleChecklist(el) {
    const icon = el.querySelector('svg');
    const text = el.querySelector('span');
    if (el.classList.contains('opacity-50')) {
        el.classList.remove('opacity-50', 'line-through');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        icon.classList.remove('text-green-500');
        icon.classList.add('text-transparent');
    } else {
        el.classList.add('opacity-50', 'line-through');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        icon.classList.add('text-green-500');
        icon.classList.remove('text-transparent');
    }
}

function renderConceptDisplay() {
    const book = findBookById(currentBookId).book;
    const display = document.getElementById('reader-display');
    
    // Trigger reflow for animation
    display.classList.remove('animate-fade');
    void display.offsetWidth;
    display.classList.add('animate-fade');

    const concept = book.concepts[currentConceptIndex];
    
    document.getElementById('reader-main-title').textContent = concept.title;
    document.getElementById('reader-subtitle').innerHTML = `Concept 0${currentConceptIndex + 1} &nbsp;&mdash;&nbsp; from <span class="font-bold italic ${isNightMode ? 'text-white' : 'text-slate-900'}">${book.title}</span>`;
    document.getElementById('reader-title').textContent = concept.title;

    const impactScore = getConsistentScore(concept.title);
    const effort = getEffortLevel(concept.title);

    // Impact Bar HTML (Minimal & Premium)
    const impactHtml = `
        <div class="flex items-center justify-end gap-3 mb-6">
            <span class="${effort.color} text-xs font-bold uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">${effort.label}</span>
            <div class="flex items-center gap-2 bg-slate-900 pl-3 pr-4 py-1 rounded-full border border-slate-800">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</span>
                <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div class="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" style="width: ${impactScore}%"></div>
                </div>
                <span class="text-xs font-black text-white">${impactScore}%</span>
            </div>
        </div>
    `;

    // Render based on currentReaderTab
    if (currentReaderTab === 'concept') {
        display.innerHTML = `
            <div class="max-w-4xl mx-auto">
                ${impactHtml}
                <!-- Masterclass Theory Card -->
                <div class="bg-slate-900 rounded-[2rem] p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden group hover:border-slate-700 transition duration-500 animate-fade">
                    <div class="absolute top-0 right-0 w-64 h-64 niche-bg opacity-5 rounded-full blur-[80px] -z-10 group-hover:opacity-10 transition duration-500"></div>
                    
                    <div class="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                        <div class="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black niche-text shadow-inner">01</div>
                        <div>
                            <h4 class="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Theoretical Framework</h4>
                            <h3 class="text-xl font-bold text-white serif">Concept Overview</h3>
                        </div>
                    </div>
                    
                    <!-- Key Takeaway Quote -->
                    <blockquote class="border-l-4 niche-border pl-6 mb-8 italic text-white text-2xl serif leading-relaxed opacity-90">
                        "${concept.explanation.split('.')[0]}."
                    </blockquote>
                    
                    <div class="relative z-10">
                        <p class="text-slate-400 text-lg leading-relaxed font-light">${concept.explanation}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Parse approach into checklist if it contains sentences
        let steps = concept.approach.split('. ').filter(s => s.trim().length > 0);
        if (steps.length === 1) steps = concept.approach.split(', ').filter(s => s.trim().length > 0);
        
        let checklistHtml = steps.map((step, idx) => `
            <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-black/5 cursor-pointer transition border border-transparent hover:border-black/10 group" onclick="toggleChecklist(this)">
                <div class="w-6 h-6 rounded-md border-2 border-slate-400 group-hover:border-slate-600 flex items-center justify-center flex-shrink-0 mt-1 bg-white">
                    <svg class="w-4 h-4 text-transparent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
                </div>
                <span class="text-slate-800 text-lg md:text-xl font-bold leading-relaxed serif transition-all">${step}${step.endsWith('.') ? '' : '.'}</span>
            </div>
        `).join('');

        display.innerHTML = `
            <div class="max-w-4xl mx-auto">
                ${impactHtml}
                <!-- Masterclass Action Card -->
                <div class="niche-bg-light rounded-[2rem] p-8 md:p-12 border niche-border shadow-xl relative overflow-hidden practical-box animate-fade">
                    <div class="flex items-center gap-4 mb-8 border-b border-black/10 pb-6">
                        <div class="w-12 h-12 rounded-xl niche-bg text-white flex items-center justify-center font-black shadow-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        </div>
                        <div>
                            <h4 class="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Execution Plan</h4>
                            <h3 class="text-xl font-bold serif text-slate-900">Interactive Checklist</h3>
                        </div>
                    </div>
                    
                    <div class="relative z-10 space-y-2">
                        ${checklistHtml}
                    </div>
                </div>
            </div>
        `;
    }
}

function switchReaderTab(tab) {
    currentReaderTab = tab;
    
    const btnConcept = document.getElementById('rtab-concept');
    const btnApp = document.getElementById('rtab-application');
    
    if (tab === 'concept') {
        btnConcept.className = "px-8 py-3 rounded-full text-sm font-bold niche-bg text-white shadow-lg transition";
        btnApp.className = "px-8 py-3 rounded-full text-sm font-bold text-slate-400 hover:text-slate-200 transition";
    } else {
        btnApp.className = "px-8 py-3 rounded-full text-sm font-bold niche-bg text-white shadow-lg transition";
        btnConcept.className = "px-8 py-3 rounded-full text-sm font-bold text-slate-400 hover:text-slate-200 transition";
    }
    
    renderConceptDisplay();
}

function closeReader() {
    document.getElementById('reader-overlay').classList.add('hidden');
    document.body.style.overflow = ''; // Restore background scrolling
}

function toggleTheme() {
    const overlay = document.getElementById('reader-overlay');
    const icon = document.getElementById('theme-icon');
    
    isNightMode = !isNightMode;
    
    if (isNightMode) {
        overlay.classList.remove('light-reader');
        // Sun Icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
    } else {
        overlay.classList.add('light-reader');
        // Moon Icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
    }
}

async function downloadAsImage() {
    // We capture the exportable-content area
    const element = document.getElementById('exportable-content');
    if (!element) return;
    
    // Temporarily adjust styles for clean export if needed
    const oldRadius = element.style.borderRadius;
    element.style.borderRadius = "0px";
    
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            backgroundColor: isNightMode ? "#020617" : "#f8fafc", // matches background
            logging: false,
            useCORS: true
        });
        
        // Restore styles
        element.style.borderRadius = oldRadius;
        
        // Trigger download
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        
        const book = findBookById(currentBookId).book;
        const title = currentConceptIndex === 10 ? "master-flowchart" : book.concepts[currentConceptIndex].title;
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        link.download = `knowledge-asset-${safeTitle}.png`;
        link.href = image;
        link.click();
    } catch (e) {
        console.error("Failed to generate image", e);
        element.style.borderRadius = oldRadius;
        alert("Sorry, an error occurred while generating the image.");
    }
}

// Initialize
window.onload = () => {
    flattenData();
    initBookFilter();
    renderDashboard();
    renderExplorer();
};

// Close on escape
document.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape' && !document.getElementById('reader-overlay').classList.contains('hidden')) {
        closeReader(); 
    }
});
