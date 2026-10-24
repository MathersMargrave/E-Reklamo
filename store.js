// E-Reklamo static data layer. No server and no database file:
// tickets (and their evidence files) are kept in this browser's IndexedDB,
// so the complaint page and the tanod page see the same tickets.

(function () {
    // Tanod accounts. A static site cannot hide these: anyone who views the
    // source can read them, so treat this as a demo login, not real security.
    const TANODS = [
        { number: '26-1106', password: 'tanod123', name: 'Zet Andrei A. Recalde', position: 'Barangay Tanod 1', department: 'CICT', email: 'zetandrei@gmail.com' },
        { number: '26-1235', password: 'tanod123', name: 'Kristiane J. Bayani',   position: 'Barangay Tanod 2', department: 'CICT', email: 'kristianebayani@gmail.com' }
    ];

    const STORE = 'tickets';
    let dbPromise;
    let channel = null;
    try { channel = new BroadcastChannel('ereklamo'); } catch (e) { /* not supported: pages refresh on focus instead */ }

    function open() {
        if (!dbPromise) {
            dbPromise = new Promise(function (resolve, reject) {
                const req = indexedDB.open('ereklamo', 1);
                req.onupgradeneeded = function () {
                    req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                };
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function () { reject(req.error); };
            });
        }
        return dbPromise;
    }

    async function run(mode, action) {
        const db = await open();
        return new Promise(function (resolve, reject) {
            const tx = db.transaction(STORE, mode);
            const request = action(tx.objectStore(STORE));
            tx.oncomplete = function () { resolve(request.result); };
            tx.onerror = tx.onabort = function () { reject(tx.error); };
        });
    }

    function notify() { if (channel) channel.postMessage('change'); }

    window.ReklamoStore = {
        tanods: TANODS,

        ticketNo: function (t) { return 'ER-' + String(t.id).padStart(6, '0'); },

        // newest first
        list: async function () {
            const all = await run('readonly', function (s) { return s.getAll(); });
            return all.sort(function (a, b) { return b.createdAt - a.createdAt; });
        },

        // returns the saved ticket (with its new id)
        add: async function (ticket) {
            const record = Object.assign({ status: 'Pending', createdAt: Date.now() }, ticket);
            record.id = await run('readwrite', function (s) { return s.add(record); });
            notify();
            return record;
        },

        resolve: async function (id, tanodName) {
            const db = await open();
            await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE, 'readwrite');
                const s = tx.objectStore(STORE);
                s.get(id).onsuccess = function (e) {
                    const t = e.target.result;
                    if (t) { t.status = 'Resolved'; t.handledBy = tanodName; t.handledAt = Date.now(); s.put(t); }
                };
                tx.oncomplete = resolve;
                tx.onerror = tx.onabort = function () { reject(tx.error); };
            });
            notify();
        },

        // call fn whenever another tab changes tickets, or this tab regains focus
        onChange: function (fn) {
            if (channel) channel.onmessage = fn;
            window.addEventListener('focus', fn);
            document.addEventListener('visibilitychange', function () { if (!document.hidden) fn(); });
        }
    };
})();
