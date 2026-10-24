// Tanod dashboard: shows the tickets saved by the complaint page.
document.addEventListener('DOMContentLoaded', function () {
    const me = window.currentTanod;
    if (!me) return;

    const pendingList = document.getElementById('pendingList');
    const resolvedList = document.getElementById('resolvedList');
    let evidenceUrls = [];

    function esc(text) {
        const d = document.createElement('div');
        d.textContent = text == null ? '' : String(text);
        return d.innerHTML;
    }

    function when(ms) {
        return new Date(ms).toLocaleString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    }

    function card(t) {
        const done = t.status === 'Resolved';
        let evidence = 'None';
        if (t.evidence) {
            const url = URL.createObjectURL(t.evidence);
            evidenceUrls.push(url);
            evidence = '<a class="evidence-link" href="' + url + '" target="_blank" rel="noopener">' + esc(t.evidenceName || 'View file') + '</a>';
        }
        return '<div class="task" data-category="' + esc(t.category) + '">' +
            '<div class="task-top"><h3>' + ReklamoStore.ticketNo(t) + '</h3>' +
            '<span class="pending' + (done ? ' resolved' : '') + '">' + esc(t.status) + '</span></div>' +
            '<div class="task-meta">' +
                '<p><strong>Name:</strong> ' + esc(t.name) + '</p>' +
                '<p><strong>Contact:</strong> ' + esc(t.contact) + '</p>' +
                '<p><strong>Category:</strong> ' + esc(t.category) + '</p>' +
                '<p><strong>Location:</strong> ' + esc(t.location) + '</p>' +
                '<p><strong>Submitted:</strong> ' + when(t.createdAt) + '</p>' +
                '<p><strong>Evidence:</strong> ' + evidence + '</p>' +
                (done ? '<p><strong>Resolved by:</strong> ' + esc(t.handledBy) + '</p>' +
                        '<p><strong>Resolved on:</strong> ' + when(t.handledAt) + '</p>' : '') +
            '</div>' +
            '<p class="task-desc"><strong>Description:</strong> ' + esc(t.description) + '</p>' +
            (done ? '' : '<button class="action-btn" data-id="' + t.id + '">Mark as resolved</button>') +
            '</div>';
    }

    async function render() {
        let tickets;
        try {
            tickets = await ReklamoStore.list();
        } catch (err) {
            const msg = '<div class="empty">Tickets could not be loaded. Make sure the browser allows site storage.</div>';
            pendingList.innerHTML = resolvedList.innerHTML = msg;
            return;
        }

        evidenceUrls.forEach(URL.revokeObjectURL);
        evidenceUrls = [];

        const pending = tickets.filter(function (t) { return t.status !== 'Resolved'; });
        const resolved = tickets.filter(function (t) { return t.status === 'Resolved'; })
            .sort(function (a, b) { return b.handledAt - a.handledAt; });

        document.getElementById('statPending').textContent = pending.length;
        document.getElementById('statResolved').textContent = resolved.length;
        document.getElementById('pendingCount').textContent = '(' + pending.length + ')';
        document.getElementById('resolvedCount').textContent = '(' + resolved.length + ')';

        pendingList.innerHTML = pending.length ? pending.map(card).join('') : '<div class="empty">No pending tickets.</div>';
        resolvedList.innerHTML = resolved.length ? resolved.map(card).join('') : '<div class="empty">No resolved tickets yet.</div>';
    }

    // Mark as resolved
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
            await ReklamoStore.resolve(Number(btn.dataset.id), me.name);
        } catch (err) { /* the refresh below shows the real state */ }
        render();
    });

    // Profile
    document.getElementById('profileName').textContent = me.name;
    document.getElementById('profileNumber').textContent = me.number;
    document.getElementById('profilePosition').textContent = me.position || '';
    document.getElementById('profileDepartment').textContent = me.department || '';
    document.getElementById('profileEmail').textContent = me.email || '';
    document.getElementById('profilePicture').textContent = me.name.split(/\s+/).filter(Boolean).slice(0, 2)
        .map(function (w) { return w[0].toUpperCase(); }).join('');

    // Logout ends the session
    document.querySelector('.sidebar .logout').addEventListener('click', function () {
        sessionStorage.removeItem('tanod');
    });

    // Highlight the sidebar link for the section being read
    const links = Array.from(document.querySelectorAll('.nav a'));
    function spy() {
        let current = links[0];
        links.forEach(function (a) {
            const s = document.querySelector(a.getAttribute('href'));
            if (s && s.getBoundingClientRect().top <= 140) current = a;
        });
        links.forEach(function (a) { a.classList.toggle('active', a === current); });
    }
    window.addEventListener('scroll', spy, { passive: true });

    ReklamoStore.onChange(render);
    render();
    spy();
});
