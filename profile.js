// profile.js

let currentUser = null;
let userProfile = null;

let allConcepts = [];
if (typeof booksData !== 'undefined') {
    booksData.forEach(category => {
        category.books.forEach(book => {
            book.concepts.forEach((concept, idx) => {
                allConcepts.push({
                    bookId: book.id,
                    conceptIndex: idx,
                    book: book,
                    concept: concept,
                    globalIndex: allConcepts.length
                });
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Check Auth State
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadProfileData(user.uid);
            await loadLearningSnapshot(user.uid);
            await loadReadingStreak(user.uid);
            await loadContinueJourney(user.uid);
            await loadLearningStats(user.uid);
        } else {
            // Redirect to index if not logged in
            window.location.href = 'index.html';
        }
    });

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await auth.signOut();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Edit Profile Logic
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const btnSaveEdit = document.getElementById('btn-save-edit');

    if (btnEditProfile && viewMode && editMode) {
        btnEditProfile.addEventListener('click', () => {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            editMode.classList.add('flex');
            
            // Populate inputs
            document.getElementById('edit-name').value = document.getElementById('display-name').textContent;
            document.getElementById('edit-email').value = document.getElementById('display-email').textContent;
            
            const phone = document.getElementById('display-phone').textContent;
            document.getElementById('edit-phone').value = phone === 'Not Set' ? '' : phone;
            
            const dob = document.getElementById('display-dob').getAttribute('data-raw') || '';
            document.getElementById('edit-dob').value = dob;
        });
        
        btnCancelEdit.addEventListener('click', () => {
            editMode.classList.add('hidden');
            editMode.classList.remove('flex');
            viewMode.classList.remove('hidden');
        });

        btnSaveEdit.addEventListener('click', async () => {
            const spinner = document.getElementById('save-spinner');
            spinner.classList.remove('hidden');
            btnSaveEdit.disabled = true;

            const name = document.getElementById('edit-name').value;
            const phone = document.getElementById('edit-phone').value;
            const dob = document.getElementById('edit-dob').value;

            try {
                // Update Firestore
                await db.collection('users').doc(currentUser.uid).set({
                    fullName: name,
                    phoneNumber: phone,
                    dob: dob
                }, { merge: true });
                
                // Update UI
                updateProfileUI(name, currentUser.email, phone, dob);
                
                editMode.classList.add('hidden');
                editMode.classList.remove('flex');
                viewMode.classList.remove('hidden');
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Failed to update profile. Please try again.");
            } finally {
                spinner.classList.add('hidden');
                btnSaveEdit.disabled = false;
            }
        });
    }
});

async function loadProfileData(uid) {
    try {
        const docRef = db.collection('users').doc(uid);
        const docSnap = await docRef.get();
        
        let name = "User";
        let phone = "";
        let dob = "";
        let isPremium = false;

        if (docSnap.exists) {
            const data = docSnap.data();
            name = data.fullName || "User";
            phone = data.phoneNumber || "";
            dob = data.dob || "";
            isPremium = data.isPremium || false;
        }

        updateProfileUI(name, currentUser.email, phone, dob);
        
        // Update Membership Badge
        const badgeContainer = document.getElementById('membership-badge');
        if (badgeContainer) {
            if (isPremium) {
                badgeContainer.innerHTML = `
                    <svg class="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                    </svg>
                    <span class="font-sans text-[10px] uppercase tracking-widest font-bold text-secondary">Premium Member</span>
                `;
            } else {
                badgeContainer.innerHTML = `
                    <span class="font-sans text-[10px] uppercase tracking-widest font-bold text-secondary bg-gray-200 px-2 py-1 rounded-sm">Free Account</span>
                `;
            }
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
}

function updateProfileUI(name, email, phone, dob) {
    document.getElementById('display-name').textContent = name;
    document.getElementById('hero-welcome').textContent = `Welcome back, ${name.split(' ')[0]}.`;
    document.getElementById('avatar-name').textContent = name;
    
    // Dicebear avatar
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=f8f9fa`;
    document.getElementById('avatar-img').src = avatarUrl;

    document.getElementById('display-email').textContent = email;
    document.getElementById('display-phone').textContent = phone || 'Not Set';
    
    if (dob) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('display-dob').textContent = new Date(dob).toLocaleDateString(undefined, options);
        document.getElementById('display-dob').setAttribute('data-raw', dob);
    } else {
        document.getElementById('display-dob').textContent = 'Not Set';
        document.getElementById('display-dob').removeAttribute('data-raw');
    }
}

async function loadLearningStats(uid) {
    try {
        const conceptsRef = db.collection('users').doc(uid).collection('completedConcepts');
        const frameworksRef = db.collection('users').doc(uid).collection('completedFrameworks');
        
        const conceptsSnap = await conceptsRef.get();
        const frameworksSnap = await frameworksRef.get();
        
        const ideas = conceptsSnap.size;
        const systems = frameworksSnap.size;
        
        document.getElementById('stat-ideas').setAttribute('data-target', ideas);
        document.getElementById('stat-ideas').textContent = ideas; // Instant fallback
        
        document.getElementById('stat-systems').setAttribute('data-target', systems);
        document.getElementById('stat-systems').textContent = systems;
        
        const streak = parseInt(document.getElementById('streak-current').textContent || 0);
        document.getElementById('hero-subtitle').innerHTML = `You've internalized <span class="font-medium text-primary">${ideas} ideas</span>. Keep your <span class="font-medium text-primary">${streak}-day streak</span> alive.<br><span class="italic text-accent mt-2 block">Continue where you left off.</span>`;
        
    } catch(err) {
        console.error("Error loading stats:", err);
    }
}

async function loadLearningSnapshot(uid) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const docRef = db.collection('users').doc(uid).collection('history').doc(todayStr);
        const docSnap = await docRef.get();
        
        let mins = 0;
        let concepts = 0;
        
        if (docSnap.exists) {
            const data = docSnap.data();
            mins = data.readingMinutes || 0;
            concepts = data.conceptsCompleted || 0;
        }
        
        document.getElementById('snap-mins').innerHTML = `${mins}<span class="text-xs text-secondary font-sans ml-0.5">m</span>`;
        document.getElementById('snap-concepts').textContent = concepts;
    } catch(err) {
        console.error("Error loading snapshot:", err);
    }
}

async function loadReadingStreak(uid) {
    const grid = document.getElementById('streak-grid');
    const monthTitle = document.getElementById('streak-month-title');
    
    const now = new Date(); 
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthTitle.textContent = `${monthNames[month]} ${year}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    function getReadingStatus(mins) {
        if (mins === 0) return { status: 'No Reading', color: 'bg-heatNone' };
        if (mins <= 5) return { status: 'Light Reading', color: 'bg-heatLow' };
        if (mins <= 10) return { status: 'Moderate', color: 'bg-heatMed' };
        if (mins <= 20) return { status: 'Consistent', color: 'bg-heatHigh' };
        return { status: 'Exceptional', color: 'bg-heatMax' };
    }

    try {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        
        const startStr = startOfMonth.toISOString().split('T')[0];
        const endStr = endOfMonth.toISOString().split('T')[0];
        
        const historyRef = db.collection('users').doc(uid).collection('history')
                             .where(firebase.firestore.FieldPath.documentId(), '>=', startStr)
                             .where(firebase.firestore.FieldPath.documentId(), '<=', endStr);
                             
        const snap = await historyRef.get();
        const historyMap = {};
        snap.forEach(doc => {
            historyMap[doc.id] = doc.data().readingMinutes || 0;
        });

        // Current Streak Calculation (simplistic backward crawl)
        let currentStreak = 0;
        let crawlDate = new Date();
        while (true) {
            const cStr = crawlDate.toISOString().split('T')[0];
            const m = historyMap[cStr] || 0;
            if (m > 0 || (cStr === now.toISOString().split('T')[0] && m === 0)) {
                if (m > 0) currentStreak++;
                crawlDate.setDate(crawlDate.getDate() - 1);
            } else {
                break;
            }
        }
        document.getElementById('streak-current').textContent = currentStreak;
        document.getElementById('streak-longest').textContent = currentStreak; // Placeholder for longest

        // Weekly Calculation
        let weekMins = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            weekMins += (historyMap[dStr] || 0);
        }
        const wHours = Math.floor(weekMins / 60);
        const wRemMins = weekMins % 60;
        document.getElementById('weekly-time').textContent = `${wHours}h ${wRemMins}m`;
        document.getElementById('weekly-progress').style.width = Math.min((weekMins / 300) * 100, 100) + '%'; // assuming 5 hours is 100%

        let htmlContent = '';
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            const cellDateStr = cellDate.toISOString().split('T')[0];
            const dateStr = `${day} ${monthNames[month].substring(0,3)}`;
            
            const mins = historyMap[cellDateStr] || 0;
            
            if (day < today) {
                const info = getReadingStatus(mins);
                htmlContent += `<div class="aspect-square rounded-[4px] ${info.color} heat-cell transition-transform hover:scale-125 hover:shadow-md cursor-crosshair" data-tooltip="${dateStr} | ${mins} min | ${info.status}"></div>`;
            } else if (day === today) {
                const info = getReadingStatus(mins);
                htmlContent += `<div class="aspect-square rounded-[4px] ${info.color} heat-cell transition-transform hover:scale-125 hover:shadow-md cursor-crosshair ring-2 ring-primary ring-offset-2" data-tooltip="${dateStr} (Today) | ${mins} min | ${info.status}"></div>`;
            } else {
                htmlContent += `<div class="aspect-square rounded-[4px] bg-heatFuture heat-cell transition-transform hover:scale-125 hover:shadow-md cursor-crosshair" data-tooltip="${dateStr} | Future Day"></div>`;
            }
        }
        grid.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error loading heatmap:", err);
    }
}

async function loadContinueJourney(uid) {
    const container = document.getElementById('continue-journey-container');
    try {
        const docRef = db.collection('users').doc(uid).collection('progress').doc('current');
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            
            // Find book name
            const bookId = data.bookId;
            let bookName = bookId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (typeof allConcepts !== 'undefined') {
                const found = allConcepts.find(c => c.bookId === bookId);
                if (found) {
                    bookName = found.book.title;
                }
            }

            const pct = Math.round(data.readingPercentage || 0);
            
            // Generate valid resume link back to index.html with query parameters
            const resumeUrl = `index.html?resumeBook=${encodeURIComponent(data.bookId)}&resumeConcept=${data.conceptIndex}&resumeGlobal=${data.globalContentIndex}&scroll=${data.scrollPosition}`;

            container.innerHTML = `
                <div class="flex justify-between items-start mb-8">
                    <div class="inline-flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                        <span class="font-sans text-xs uppercase tracking-widest font-bold text-accent">Continue Your Journey</span>
                    </div>
                </div>
                
                <div class="mb-12">
                    <h2 class="font-serif text-4xl sm:text-5xl text-white font-medium mb-4 leading-tight">${bookName}</h2>
                    <p class="font-sans text-lg sm:text-xl text-white/70 font-light flex items-center gap-3">
                        <svg class="w-5 h-5 text-accent/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        Concept ${data.conceptIndex + 1}
                    </p>
                </div>
                
                <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                    <div class="w-full md:w-3/5">
                        <div class="flex justify-between items-end font-sans mb-3">
                            <span class="text-3xl font-medium text-white tracking-tight">${pct}<span class="text-lg text-white/50">%</span></span>
                        </div>
                        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div class="h-full bg-accent rounded-full animate-bar" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                    
                    <div class="w-full md:w-auto flex flex-col items-center md:items-end">
                        <a href="${resumeUrl}" class="w-full sm:w-auto px-8 py-4 bg-white text-primary rounded-full font-sans text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                            Resume Learning
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-12">
                    <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                        <svg class="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <h2 class="font-serif text-3xl text-white font-medium mb-2">No Active Journey</h2>
                    <p class="font-sans text-white/60 mb-8 max-w-sm">You haven't started reading any concepts yet. Visit the library to begin your learning journey.</p>
                    <a href="index.html#explorer" class="px-8 py-4 bg-white text-primary rounded-full font-sans text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">Explore Library</a>
                </div>
            `;
        }
    } catch(err) {
        console.error("Error loading journey:", err);
    }
}

// ----------------------------------------------------
// MODAL LOGIC
// ----------------------------------------------------

async function openCompletedModal(type) {
    const modal = document.getElementById('completed-modal');
    const title = document.getElementById('completed-modal-title');
    const subtitle = document.getElementById('completed-modal-subtitle');
    const list = document.getElementById('completed-modal-list');
    
    if (!modal || !currentUser) return;
    
    // Setup UI
    modal.classList.remove('hidden');
    list.innerHTML = `
        <div class="animate-pulse space-y-4">
            <div class="h-24 bg-gray-100 rounded-2xl w-full"></div>
            <div class="h-24 bg-gray-100 rounded-2xl w-full"></div>
            <div class="h-24 bg-gray-100 rounded-2xl w-full"></div>
        </div>
    `;
    
    if (type === 'free') {
        title.textContent = 'Ideas Internalized';
        subtitle.textContent = 'Completed Free Concepts';
    } else {
        title.textContent = 'Execution Systems';
        subtitle.textContent = 'Completed Premium Frameworks';
    }
    
    try {
        const collectionName = type === 'free' ? 'completedConcepts' : 'completedFrameworks';
        const snapshot = await db.collection('users').doc(currentUser.uid).collection(collectionName).get();
        
        if (snapshot.empty) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-12">
                    <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    <p class="font-serif text-xl text-[#0a0a0a] mb-2">Nothing here yet</p>
                    <p class="font-sans text-sm text-gray-500 max-w-[250px]">Explore the library to find new concepts to master.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id; // bookId-conceptIndex
            const parts = id.split('-');
            const conceptIdx = parseInt(parts.pop());
            const bookId = parts.join('-');
            
            const result = allConcepts.find(c => c.bookId === bookId && c.conceptIndex === conceptIdx);
            if (result) {
                const book = result.book;
                const concept = result.concept;
                const resumeUrl = `index.html?resumeBook=${book.id}&resumeConcept=${conceptIdx}&resumeGlobal=${result.globalIndex}`;
                
                let completedDateStr = "Unknown Date";
                if (data.completedAt) {
                    completedDateStr = new Date(data.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                } else if (data.completedDate) {
                    // Backwards compatibility with Timestamp
                    completedDateStr = new Date(data.completedDate.toDate()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                }
                
                html += `
                    <a href="${resumeUrl}" class="flex items-center p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all group bg-white cursor-pointer">
                        <div class="w-12 h-16 shrink-0 rounded bg-gray-100 overflow-hidden mr-4 shadow-sm group-hover:scale-105 transition-transform">
                            <img src="${book.coverUrl}" alt="Cover" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-sans text-sm font-bold text-[#0a0a0a] truncate mb-0.5 group-hover:text-primary transition-colors">${concept.title}</h3>
                            <p class="font-sans text-xs text-gray-500 truncate mb-2">${book.title}</p>
                            <div class="flex items-center gap-2">
                                <span class="bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm flex items-center">
                                    <svg class="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                    Done
                                </span>
                                <span class="font-sans text-[10px] text-gray-400 font-semibold">${completedDateStr}</span>
                            </div>
                        </div>
                    </a>
                `;
            }
        });
        
        html += '</div>';
        list.innerHTML = html;
        
    } catch(err) {
        console.error("Error loading modal data:", err);
        list.innerHTML = `<p class="text-red-500 text-center">Failed to load data. Please try again.</p>`;
    }
}

function closeCompletedModal() {
    const modal = document.getElementById('completed-modal');
    if (modal) modal.classList.add('hidden');
}

// ----------------------------------------------------
// ONE-TIME CLEANUP SCRIPT (Do not auto-run)
// ----------------------------------------------------
window.runMigrationScript = async function() {
    if (!currentUser) return console.log("Not logged in");
    console.log("Starting migration...");
    
    try {
        const conceptsRef = db.collection('users').doc(currentUser.uid).collection('completedConcepts');
        const frameworksRef = db.collection('users').doc(currentUser.uid).collection('completedFrameworks');
        
        const snapshot = await conceptsRef.get();
        let migrated = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const id = doc.id; // bookId-conceptIndex
            const parts = id.split('-');
            const conceptIdx = parseInt(parts.pop());
            const bookId = parts.join('-');
            
            const result = allConcepts.find(c => c.bookId === bookId && c.conceptIndex === conceptIdx);
            if (result && result.concept.isPremium) {
                // It's a premium concept inside completedConcepts!
                console.log(`Migrating premium framework: ${id}`);
                // Move to frameworks
                await frameworksRef.doc(id).set({
                    ...data,
                    frameworkId: id,
                    migratedAt: new Date().toISOString()
                });
                // Delete from concepts
                await conceptsRef.doc(id).delete();
                migrated++;
            }
        }
        
        console.log(`Migration complete! Migrated ${migrated} items.`);
    } catch(err) {
        console.error("Migration failed:", err);
    }
};
 
 