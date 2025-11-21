// --- UI Rendering Helpers ---

export const renderLoading = (show) => {
    const el = document.getElementById('loading');
    if (el) el.style.display = show ? 'flex' : 'none';
};

export const renderAuthError = (msg) => {
    const el = document.getElementById('auth-error');
    if (el) {
        el.innerText = msg;
        el.classList.remove('hidden');
    }
};

export const toggleAuthView = (user) => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (user) {
        authContainer.style.display = 'none';
        appContainer.classList.remove('hidden');
        document.getElementById('userIdDisplay').innerText = user.email;
    } else {
        authContainer.style.display = 'flex';
        appContainer.classList.add('hidden');
    }
};

export const renderPlatformsList = (platforms, currentPlatformId) => {
    const list = document.getElementById('platform-list');
    list.innerHTML = '';

    platforms.forEach(p => {
        const div = document.createElement('div');
        const isOpen = currentPlatformId === p.id;

        div.innerHTML = `
            <div class="platform-header group ${isOpen ? 'open' : ''}" data-id="${p.id}">
                <span class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>${p.name}</span>
                <div class="flex items-center gap-1">
                    <span class="tab-delete cursor-pointer hover:text-red-500" data-action="delete-platform" data-id="${p.id}" data-name="${p.name}">&times;</span>
                    <svg class="arrow w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>
            <div class="tracker-sub-list" id="sub-${p.id}" style="display: ${isOpen ? 'block' : 'none'}"></div>
            <button class="add-tracker-btn hidden text-xs text-indigo-600 hover:text-indigo-800 font-medium py-2 px-8 w-full text-left transition-colors ${isOpen ? '!block' : ''}" data-id="${p.id}">+ Add Service Type</button>
        `;
        list.appendChild(div);
    });
};

export const renderTrackersList = (platformId, trackers, currentTrackerId) => {
    const sub = document.getElementById(`sub-${platformId}`);
    if (!sub) return;

    sub.innerHTML = '';
    trackers.forEach(t => {
        const isActive = t.id === currentTrackerId;
        sub.innerHTML += `
            <div class="tracker-link group ${isActive ? 'active' : ''}" data-pid="${platformId}" data-tid="${t.id}">
                <span class="truncate">${t.name}</span>
                <span class="tab-delete cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100" data-action="delete-tracker" data-pid="${platformId}" data-tid="${t.id}">&times;</span>
            </div>`;
    });
};

export const renderItemsTable = (items, rate) => {
    const tbody = document.getElementById('trackerTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" class="p-8 text-center text-slate-400">No items.</td></tr>';
        updateTotals([], rate);
        return;
    }

    items.forEach(i => {
        const buyDA = (i.buyUSD || 0) * rate;
        const sellUSD = rate > 0 ? (i.sellDA || 0) / rate : 0;
        const totalBuyUSD = (i.buyUSD || 0) * (i.qty || 0);
        const totalSellUSD = sellUSD * (i.qty || 0);
        const profitDA = ((i.sellDA || 0) * (i.qty || 0)) - (buyDA * (i.qty || 0));
        const totalSellDA = (i.sellDA || 0) * (i.qty || 0);
        const profitPerc = totalSellDA ? profitDA / totalSellDA : 0;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";
        tr.innerHTML = `
            <td class="px-4 py-2"><input class="data-input font-mono text-slate-500" value="${i.id || ''}" data-id="${i.id}" data-field="id"></td>
            <td class="px-4 py-2"><input class="data-input" value="${i.cat || ''}" data-id="${i.id}" data-field="cat"></td>
            <td class="px-4 py-2"><input class="data-input w-full font-medium text-slate-700" value="${i.service || ''}" data-id="${i.id}" data-field="service"></td>
            
            <td class="px-4 py-2"><input type="number" class="data-input text-slate-700" value="${i.buyUSD || 0}" data-id="${i.id}" data-field="buyUSD"></td>
            <td class="px-4 py-2"><span class="calc-output text-xs">${buyDA.toFixed(2)}</span></td>
            
            <td class="px-4 py-2"><input type="number" class="data-input font-bold text-green-700" value="${i.sellDA || 0}" data-id="${i.id}" data-field="sellDA"></td>
            <td class="px-4 py-2"><span class="calc-output text-xs">${sellUSD.toFixed(2)}</span></td>
            
            <td class="px-4 py-2"><input type="number" class="data-input w-16 text-center" value="${i.qty || 0}" data-id="${i.id}" data-field="qty"></td>
            
            <td class="px-4 py-2 text-right text-xs text-slate-400">${totalBuyUSD.toFixed(2)}</td>
            <td class="px-4 py-2 text-right text-xs text-slate-400">${totalSellUSD.toFixed(2)}</td>
            
            <td class="px-4 py-2 text-right font-bold text-sm ${profitDA >= 0 ? 'text-green-600' : 'text-red-600'}">${profitDA.toFixed(2)}</td>
            <td class="px-4 py-2 text-right font-bold text-xs">${(profitPerc * 100).toFixed(1)}%</td>
            <td class="px-4 py-2 text-center"><button class="text-slate-300 hover:text-red-500" data-action="delete-item" data-id="${i.id}">&times;</button></td>
        `;
        tbody.appendChild(tr);
    });

    updateTotals(items, rate);
};

function updateTotals(items, rate) {
    let tBuyTotal = 0, tSellTotal = 0, tProfitTotal = 0, tQtyTotal = 0;

    items.forEach(i => {
        const buyUSD = parseFloat(i.buyUSD) || 0;
        const sellDA = parseFloat(i.sellDA) || 0;
        const qty = parseFloat(i.qty) || 0;

        const buyDA = buyUSD * rate;
        const sellUSD = rate > 0 ? sellDA / rate : 0;

        tBuyTotal += buyUSD * qty;
        tSellTotal += sellUSD * qty;
        tProfitTotal += (sellDA * qty) - (buyDA * qty);
        tQtyTotal += qty;
    });

    document.getElementById('total-Q').innerText = tQtyTotal;
    document.getElementById('total-J').innerText = tBuyTotal.toFixed(2);
    document.getElementById('total-K').innerText = tSellTotal.toFixed(2);
    document.getElementById('total-M').innerText = tProfitTotal.toFixed(2);

    const totalSellDA_Global = tSellTotal * rate;
    const totalPerc = totalSellDA_Global ? (tProfitTotal / totalSellDA_Global * 100).toFixed(1) : "0.0";
    document.getElementById('total-N').innerText = totalPerc + '%';
}
