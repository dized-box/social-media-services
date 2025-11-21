import * as Auth from './auth.js';
import * as Store from './store.js';
import * as UI from './ui.js';

let currentUser = null;
let currentRate = 255;
let currentPlatformId = null;
let currentTrackerId = null;

// --- Initialization ---
const init = () => {
    console.log("App initializing...");
    setupEventListeners();

    Auth.subscribeToAuthChanges((user) => {
        console.log("Auth state changed:", user ? user.email : "No user");
        currentUser = user;
        UI.toggleAuthView(user);
        if (user) {
            initDashboard(user.uid);
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function setupEventListeners() {
    // Auth
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            console.log("Login button clicked");
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;

            if (!email || !pass) {
                UI.renderAuthError("Please enter email and password");
                return;
            }

            UI.renderLoading(true);
            const res = await Auth.login(email, pass);
            UI.renderLoading(false);

            console.log("Login result:", res);
            if (!res.success) UI.renderAuthError(res.error);
        });
    }

    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;

            if (!email || !pass) {
                UI.renderAuthError("Please enter email and password");
                return;
            }

            UI.renderLoading(true);
            const res = await Auth.register(email, pass);
            UI.renderLoading(false);

            if (!res.success) UI.renderAuthError(res.error);
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', () => Auth.logout());

    // Mobile Menu
    const btnMobile = document.getElementById('btn-mobile-menu');
    if (btnMobile) btnMobile.addEventListener('click', toggleMobileMenu);

    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', toggleMobileMenu);

    const btnClose = document.getElementById('btn-close-sidebar');
    if (btnClose) btnClose.addEventListener('click', toggleMobileMenu);

    // Global Settings
    const rateInput = document.getElementById('usdToDaRate');
    if (rateInput) {
        rateInput.addEventListener('input', (e) => {
            if (currentUser) Store.updateGlobalRate(currentUser.uid, e.target.value);
        });
    }

    // Platform & Tracker Events (Delegation)
    const platformList = document.getElementById('platform-list');
    if (platformList) {
        platformList.addEventListener('click', async (e) => {
            // Toggle Platform
            const header = e.target.closest('.platform-header');
            if (header && !e.target.closest('.tab-delete')) {
                const pid = header.dataset.id;
                if (currentPlatformId === pid) {
                    currentPlatformId = null;
                } else {
                    currentPlatformId = pid;
                }

                if (currentPlatformId) loadTrackers(currentPlatformId);

                // Update UI classes manually for instant feedback
                document.querySelectorAll('.platform-header').forEach(h => {
                    const sub = document.getElementById(`sub-${h.dataset.id}`);
                    const btn = document.querySelector(`.add-tracker-btn[data-id="${h.dataset.id}"]`);
                    if (h.dataset.id === currentPlatformId) {
                        h.classList.add('open');
                        if (sub) sub.style.display = 'block';
                        if (btn) btn.classList.remove('hidden');
                    } else {
                        h.classList.remove('open');
                        if (sub) sub.style.display = 'none';
                        if (btn) btn.classList.add('hidden');
                    }
                });
            }

            // Delete Platform
            if (e.target.closest('.tab-delete') && e.target.dataset.action === 'delete-platform') {
                e.stopPropagation();
                const { id, name } = e.target.dataset;
                if (confirm(`Delete ${name}?`)) await Store.deletePlatform(currentUser.uid, id);
            }

            // Add Tracker
            if (e.target.classList.contains('add-tracker-btn')) {
                const pid = e.target.dataset.id;
                const name = prompt("Category Name (e.g., Likes):");
                if (name) await Store.addTracker(currentUser.uid, pid, name);
            }

            // Select Tracker
            const trackerLink = e.target.closest('.tracker-link');
            if (trackerLink && !e.target.closest('.tab-delete')) {
                const { pid, tid } = trackerLink.dataset;
                selectTracker(pid, tid);
            }

            // Delete Tracker
            if (e.target.closest('.tab-delete') && e.target.dataset.action === 'delete-tracker') {
                e.stopPropagation();
                const { pid, tid } = e.target.dataset;
                if (confirm("Delete category?")) await Store.deleteTracker(currentUser.uid, pid, tid);
            }
        });
    }

    // Add Platform Button
    const btnAddPlatform = document.getElementById('btn-add-platform');
    if (btnAddPlatform) {
        btnAddPlatform.addEventListener('click', async () => {
            const name = prompt("Platform Name (e.g., TikTok):");
            if (name) await Store.addPlatform(currentUser.uid, name);
        });
    }

    // Items Table Events
    const btnAddItem = document.getElementById('btn-add-item');
    if (btnAddItem) {
        btnAddItem.addEventListener('click', () => {
            if (currentPlatformId && currentTrackerId) {
                Store.addItem(currentUser.uid, currentPlatformId, currentTrackerId);
            }
        });
    }

    const table = document.getElementById('trackerTable');
    if (table) {
        table.addEventListener('change', (e) => {
            if (e.target.classList.contains('data-input')) {
                const { id, field } = e.target.dataset;
                Store.updateItem(currentUser.uid, currentPlatformId, currentTrackerId, id, field, e.target.value);
            }
        });

        table.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn && btn.dataset.action === 'delete-item') {
                Store.deleteItem(currentUser.uid, currentPlatformId, currentTrackerId, btn.dataset.id);
            }
        });
    }

    // Platform Settings Inputs
    const inputProvider = document.getElementById('provider');
    if (inputProvider) {
        inputProvider.addEventListener('input', (e) => {
            if (currentPlatformId) Store.updatePlatformSettings(currentUser.uid, currentPlatformId, { provider: e.target.value });
        });
    }

    const inputPlatform = document.getElementById('platform');
    if (inputPlatform) {
        inputPlatform.addEventListener('input', (e) => {
            if (currentPlatformId) Store.updatePlatformSettings(currentUser.uid, currentPlatformId, { platform: e.target.value });
        });
    }
}

function initDashboard(userId) {
    // Global Settings
    Store.subscribeToGlobalSettings(userId, (rate) => {
        currentRate = rate;
        const el = document.getElementById('usdToDaRate');
        if (el) el.value = rate;
        // Trigger re-calc if items are showing
        if (currentTrackerId) loadItems(currentPlatformId, currentTrackerId);
    });

    // Platforms
    Store.subscribeToPlatforms(userId, (platforms) => {
        UI.renderPlatformsList(platforms, currentPlatformId);
        // Re-attach trackers if a platform is open
        if (currentPlatformId) loadTrackers(currentPlatformId);
    });
}

function loadTrackers(platformId) {
    Store.subscribeToTrackers(currentUser.uid, platformId, (trackers) => {
        UI.renderTrackersList(platformId, trackers, currentTrackerId);
    });
}

function selectTracker(pid, tid) {
    currentPlatformId = pid;
    currentTrackerId = tid;

    const welcome = document.getElementById('welcome-view');
    const tracker = document.getElementById('tracker-view');
    if (welcome) welcome.classList.add('hidden');
    if (tracker) tracker.classList.remove('hidden');

    // Update active state in sidebar
    document.querySelectorAll('.tracker-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.tracker-link[data-tid="${tid}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Load Platform Settings
    Store.getPlatformDetails(currentUser.uid, pid, (data) => {
        const p = document.getElementById('provider');
        const pl = document.getElementById('platform');
        if (p) p.value = data.provider || '';
        if (pl) pl.value = data.platform || '';
    });

    loadItems(pid, tid);
}

function loadItems(pid, tid) {
    Store.subscribeToItems(currentUser.uid, pid, tid, (items) => {
        UI.renderItemsTable(items, currentRate);
    });
}

function toggleMobileMenu() {
    const sb = document.getElementById('sidebar');
    const ol = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.toggle('-translate-x-full');
    if (ol) ol.classList.toggle('hidden');
}
