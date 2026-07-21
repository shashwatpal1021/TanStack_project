/**
 * LINEAR MINI - CORE SCRIPT
 * Modular, DRY, and Interactive
 */

// --- 1. STATE & CONSTANTS ---
const CONFIG = {
    SHEET_ID: '1WZhV3aQ5f8Znja-x_oGp806mwhuwUwdBd2gxwciUuwA',
    GID: '1452895894',
    DEFAULT_USER: 'admin@linear.mini',
    DEFAULT_PASS: 'password'
};

let state = {
    issues: [],
    team: [
        { id: 1, name: 'Alex Rivera', email: 'alex@linear.mini', role: 'Lead Engineer', initial: 'A' },
        { id: 2, name: 'Sarah Chen', email: 'sarah@linear.mini', role: 'Designer', initial: 'S' },
        { id: 3, name: 'Jordan Smith', email: 'jordan@linear.mini', role: 'Product Manager', initial: 'J' }
    ],
    projects: [
        { id: 'P1', title: 'Q1 Infrastructure', progress: 75, status: 'Active' },
        { id: 'P2', title: 'Mobile App v2', progress: 40, status: 'In Review' },
        { id: 'P3', title: 'Auth Service Migration', progress: 95, status: 'Active' }
    ],
    currentView: 'inbox',
    currentUser: null,
    isLoaded: false
};

// --- 2. DUMMY DATA INITIALIZER ---
const INITIAL_DUMMY_ISSUES = [
    { internalId: 101, id: 'LIN-101', title: 'Fix sidebar navigation overlap', status: 'In Progress', priority: 'Urgent', assignee: 'Me', description: 'Sidebar items are overlapping on small screens.' },
    { internalId: 102, id: 'LIN-102', title: 'Implement Excel export logic', status: 'Done', priority: 'High', assignee: 'Alex', description: 'Export current view to XLSX.' },
    { internalId: 103, id: 'LIN-103', title: 'User feedback modal design', status: 'Todo', priority: 'Medium', assignee: 'Sarah', description: 'Needs to match the new dark theme.' },
    { internalId: 104, id: 'LIN-104', title: 'Research drag and drop libraries', status: 'Backlog', priority: 'Low', assignee: 'Jordan', description: 'Looking for native JS vs specialized libs.' },
    { internalId: 105, id: 'LIN-105', title: 'API Documentation update', status: 'Review', priority: 'Medium', assignee: 'Me', description: 'Update the endpoints for the new roadmap feature.' }
];

// --- 3. UTILITIES (DRY) ---

const utils = {
    getStatusIcon: (status) => {
        const s = status?.toLowerCase() || 'todo';
        const icons = {
            'backlog': '<i data-lucide="circle-dashed" class="w-3.5 h-3.5 text-gray-500"></i>',
            'todo': '<i data-lucide="circle" class="w-3.5 h-3.5 text-gray-400"></i>',
            'in progress': '<i data-lucide="circle-dot" class="w-3.5 h-3.5 text-yellow-500"></i>',
            'review': '<i data-lucide="eye" class="w-3.5 h-3.5 text-blue-500"></i>',
            'done': '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-indigo-500"></i>'
        };
        return icons[s] || icons['todo'];
    },

    getPriorityColor: (p) => {
        const colors = {
            'urgent': 'text-red-500',
            'high': 'text-orange-500',
            'medium': 'text-yellow-500',
            'low': 'text-blue-500'
        };
        return colors[p?.toLowerCase()] || 'text-gray-500';
    },

    setElementHTML: (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    },

    show: (id) => document.getElementById(id)?.classList.remove('hidden'),
    hide: (id) => document.getElementById(id)?.classList.add('hidden')
};

// --- 4. CORE ENGINE ---

const App = {
    init: () => {
        if (localStorage.getItem('linear_session')) {
            App.handleLogin(true);
        }
        window.addEventListener('DOMContentLoaded', () => lucide.createIcons());
    },

    toggleAuth: (mode) => {
        const isLogin = mode === 'login';
        utils.setElementHTML('auth-login', isLogin ? document.getElementById('auth-login').innerHTML : ''); // Simple toggle logic
        document.getElementById('auth-login').classList.toggle('hidden', !isLogin);
        document.getElementById('auth-recovery').classList.toggle('hidden', isLogin);
    },

    handleLogin: (skip = false) => {
        if (!skip) {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            if (email !== CONFIG.DEFAULT_USER || pass !== CONFIG.DEFAULT_PASS) return alert('Invalid credentials');
            localStorage.setItem('linear_session', 'true');
        }
        utils.hide('login-screen');
        utils.show('app-workspace');
        App.fetchData();
    },

    handleLogout: () => {
        localStorage.removeItem('linear_session');
        location.reload();
    },

    fetchData: async () => {
        // Initially load dummy data to be "immediate"
        state.issues = [...INITIAL_DUMMY_ISSUES];
        App.setView('issues');

        const CSV_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/export?format=csv&gid=${CONFIG.GID}`;
        try {
            const res = await fetch(CSV_URL);
            const csv = await res.text();
            Papa.parse(csv, {
                header: true, skipEmptyLines: true,
                complete: (results) => {
                    const fetchedIssues = results.data.map((row, index) => {
                        const n = { internalId: Date.now() + index };
                        for (let k in row) n[k.trim().toLowerCase()] = row[k];
                        return n;
                    });
                    // Merge dummy with fetched or just replace
                    state.issues = fetchedIssues.length > 0 ? fetchedIssues : INITIAL_DUMMY_ISSUES;
                    App.setView(state.currentView);
                    state.isLoaded = true;
                }
            });
        } catch (e) { 
            console.warn("Sheet offline, using dummy data.");
        }
    },

    setView: (viewId) => {
        state.currentView = viewId;
        
        // UI Updates
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(`nav-${viewId}`)?.classList.add('active');
        
        const cat = document.getElementById('breadcrumb-category');
        const view = document.getElementById('breadcrumb-view');

        if (viewId.startsWith('org-')) cat.innerText = 'Organization';
        else if (['issues', 'board', 'projects'].includes(viewId)) cat.innerText = 'Workforce';
        else cat.innerText = 'Personal';

        view.innerText = viewId.charAt(0).toUpperCase() + viewId.slice(1).replace('org-', '').replace('-', ' ');

        App.renderContent(viewId);
        lucide.createIcons();
    },

    renderContent: (viewId) => {
        const area = document.getElementById('content-area');
        switch(viewId) {
            case 'inbox': App.renders.inbox(area); break;
            case 'my-issues': App.renders.list(area, state.issues.filter(i => (i.assignee||'').toLowerCase().includes('me'))); break;
            case 'issues': App.renders.list(area, state.issues); break;
            case 'board': App.renders.board(area); break;
            case 'projects': App.renders.projects(area); break;
            case 'org-overview': App.renders.overview(area); break;
            case 'org-roadmap': App.renders.roadmap(area); break;
            case 'org-settings': App.renders.settings(area); break;
        }
    },

    renders: {
        inbox: (area) => {
            area.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-700 opacity-20"><i data-lucide="check-circle" class="w-16 h-16 mb-4"></i><p class="text-sm font-medium">No new notifications</p></div>`;
        },
        list: (area, data) => {
            area.innerHTML = data.map(i => `
                <div class="issue-row flex items-center px-8 text-xs group" onclick="App.openDetail(${i.internalId})">
                    <span class="w-16 text-[10px] font-mono text-gray-600">${i.id || 'LIN-?'}</span>
                    <div class="mr-3">${utils.getStatusIcon(i.status)}</div>
                    <span class="flex-1 text-gray-300 group-hover:text-white truncate transition-colors">${i.title || 'Untitled'}</span>
                    <span class="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 py-0.5 rounded border border-gray-800 bg-gray-900">${i.status || 'Todo'}</span>
                </div>
            `).join('');
        },
        board: (area) => {
            const columns = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'];
            area.innerHTML = `
                <div class="flex h-full p-6 space-x-6 overflow-x-auto custom-scrollbar">
                    ${columns.map(col => `
                        <div class="board-column flex flex-col space-y-4" ondragover="event.preventDefault(); this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="App.handleDrop(event, '${col}')">
                            <div class="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                <div class="flex items-center space-x-2">${utils.getStatusIcon(col)}<span>${col}</span></div>
                                <span class="text-gray-700">${state.issues.filter(i => (i.status||'').toLowerCase() === col.toLowerCase()).length}</span>
                            </div>
                            <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar pb-10">
                                ${state.issues.filter(i => (i.status||'').toLowerCase() === col.toLowerCase()).map(i => `
                                    <div class="bg-[#161718] border border-[#25262b] p-4 rounded-xl text-[12px] font-medium text-gray-200 cursor-grab active:cursor-grabbing hover:border-gray-700 transition" draggable="true" ondragstart="event.dataTransfer.setData('text', ${i.internalId})">
                                        <div class="text-[9px] text-gray-600 font-mono mb-2 tracking-widest">${i.id || 'LIN-?'}</div>
                                        ${i.title}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },
        projects: (area) => {
            area.innerHTML = `<div class="p-10 max-w-5xl space-y-6">
                ${state.projects.map(p => `
                    <div class="bg-[#161718] border border-[#25262b] p-8 rounded-2xl flex justify-between items-center shadow-xl">
                        <div class="space-y-1"><h3 class="text-xl font-bold">${p.title}</h3><p class="text-xs text-gray-500 uppercase tracking-widest">${p.status}</p></div>
                        <div class="text-right space-y-2">
                            <div class="text-xs font-bold text-indigo-500 uppercase tracking-widest">${p.progress}%</div>
                            <div class="w-48 roadmap-track"><div class="roadmap-bar" style="width: ${p.progress}%"></div></div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        },
        overview: (area) => {
            const done = state.issues.filter(i => (i.status||'').toLowerCase() === 'done').length;
            const rate = state.issues.length > 0 ? Math.round((done / state.issues.length) * 100) : 0;
            area.innerHTML = `
                <div class="p-16 max-w-6xl mx-auto space-y-12">
                    <h1 class="text-4xl font-bold tracking-tight">Organization Metrics</h1>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="stat-card p-10 rounded-2xl">
                            <h3 class="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-4">Completion Rate</h3>
                            <div class="text-6xl font-black mb-4">${rate}%</div>
                            <div class="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden"><div class="h-full bg-indigo-600" style="width: ${rate}%"></div></div>
                        </div>
                        <div class="stat-card p-10 rounded-2xl">
                             <h3 class="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-4">Total Velocity</h3>
                             <div class="text-6xl font-black text-indigo-500">5.4</div>
                             <p class="text-[10px] text-gray-600 mt-2 font-bold uppercase">Issues per day</p>
                        </div>
                    </div>
                </div>
            `;
        },
        roadmap: (area) => {
            area.innerHTML = `<div class="p-16 max-w-5xl mx-auto space-y-8">
                <h2 class="text-2xl font-bold tracking-tight mb-10">Product Roadmap</h2>
                <div class="flex items-center space-x-10 pb-6 border-b border-gray-800">
                    <div class="w-24 text-[10px] font-bold text-gray-600 uppercase">Engineering</div>
                    <div class="flex-1 roadmap-track"><div class="roadmap-bar" style="width: 80%"></div></div>
                </div>
            </div>`;
        },
        settings: (area) => {
            area.innerHTML = `<div class="p-16 max-w-xl mx-auto space-y-10">
                <h2 class="text-2xl font-bold tracking-tight">Workspace Identity</h2>
                <div class="space-y-6">
                    <div class="space-y-2"><label class="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Name</label><input type="text" value="Mini Enterprise" class="w-full bg-[#161718] border border-gray-800 rounded-lg px-4 py-2 text-sm"></div>
                    <div class="space-y-2"><label class="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Team ID</label><input type="text" value="ORG-001" disabled class="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-600"></div>
                </div>
            </div>`;
        }
    },

    // --- ACTIONS ---
    handleDrop: (e, status) => {
        e.preventDefault(); 
        e.currentTarget.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text');
        const idx = state.issues.findIndex(i => i.internalId == id);
        if (idx !== -1) {
            state.issues[idx].status = status;
            App.setView('board');
        }
    },

    openDetail: (internalId) => {
        const i = state.issues.find(issue => issue.internalId == internalId);
        if (!i) return;
        document.getElementById('detail-id').innerText = i.id || 'LIN-?';
        document.getElementById('detail-title').innerText = i.title || 'Untitled';
        document.getElementById('detail-desc').innerText = i.description || 'No detailed description.';
        document.getElementById('detail-status').innerText = (i.status || 'Todo').toUpperCase();
        document.getElementById('detail-drawer').classList.add('open');
        lucide.createIcons();
    },

    closeDetail: () => document.getElementById('detail-drawer').classList.remove('open'),

    openModal: () => {
        document.getElementById('issue-modal').classList.remove('hidden');
        document.getElementById('new-title').focus();
    },

    closeModal: () => document.getElementById('issue-modal').classList.add('hidden'),

    createNewIssue: () => {
        const title = document.getElementById('new-title').value;
        if (!title) return;
        const newIssue = {
            internalId: Date.now(),
            id: 'LIN-' + (state.issues.length + 100),
            title,
            status: document.getElementById('new-status').value,
            priority: document.getElementById('new-priority').value,
            description: document.getElementById('new-desc').value,
            assignee: 'Me'
        };
        state.issues.unshift(newIssue);
        App.setView(state.currentView === 'inbox' ? 'issues' : state.currentView);
        App.closeModal();
        // Clear form
        document.getElementById('new-title').value = '';
        document.getElementById('new-desc').value = '';
    },

    exportToExcel: () => {
        const ws = XLSX.utils.json_to_sheet(state.issues);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Linear Issues");
        XLSX.writeFile(wb, "linear_export.xlsx");
    }
};

// Start App
App.init();

// Global hooks for HTML onclick
window.toggleAuth = App.toggleAuth;
window.handleLogin = App.handleLogin;
window.handleLogout = App.handleLogout;
window.setView = App.setView;
window.openModal = App.openModal;
window.closeModal = App.closeModal;
window.createNewIssue = App.createNewIssue;
window.closeDetail = App.closeDetail;
window.exportToExcel = App.exportToExcel;

// Global Search
document.getElementById('global-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = state.issues.filter(i => (i.title||'').toLowerCase().includes(q) || (i.id||'').toLowerCase().includes(q));
    if (state.currentView === 'board') {
        // For board we typically don't filter in-place easily without complex logic, 
        // usually we switch to list or highlight. Here we just re-render the board with a filter.
        // Simplified for this demo: only list view search is deep.
        App.renders.list(document.getElementById('content-area'), filtered);
    } else {
        App.renders.list(document.getElementById('content-area'), filtered);
    }
});