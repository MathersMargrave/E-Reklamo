// Handles the complaint form. On submit the ticket is saved in this browser
// (see store.js), where the tanod dashboard reads it, and the animated ticket pops up.

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('complaintForm');
    const toast = document.getElementById('popupToast');
    const MAX_FILE = 5 * 1024 * 1024; // 5 MB

    // ---------- error toast ----------
    let toastTimer;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('error', 'show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 6000);
    }

    // ---------- ticket ----------
    // Fills in the ticket text, then points the address at #ticketOverlay.
    // The showing, the animation and the closing are all done by CSS (:target).
    function showTicket(ticket) {
        document.getElementById('ticketNumber').textContent = ReklamoStore.ticketNo(ticket);
        document.getElementById('tName').textContent = ticket.name;
        document.getElementById('tCategory').textContent = ticket.category;
        document.getElementById('tLocation').textContent = ticket.location;
        document.getElementById('tDate').textContent = new Date(ticket.createdAt).toLocaleString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        });
        document.getElementById('ticketNote').textContent = '';
        window.location.hash = 'ticketOverlay';
    }

    // A refresh while the ticket is open would show an empty ticket, so start closed.
    if (window.location.hash === '#ticketOverlay') history.replaceState(null, '', '#complaint');

    // ---------- submit ----------
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        const file = document.getElementById('Evidence').files[0];

        if (file && file.size > MAX_FILE) {
            showToast('Evidence file must be 5 MB or smaller.');
            return;
        }

        button.disabled = true;
        button.textContent = 'Submitting...';

        try {
            const ticket = await ReklamoStore.add({
                name: document.getElementById('name').value.trim(),
                contact: document.getElementById('Contact').value.trim(),
                category: document.getElementById('category').value,
                location: document.getElementById('location').value.trim(),
                description: document.getElementById('description').value.trim(),
                evidence: file || null,
                evidenceName: file ? file.name : ''
            });
            showTicket(ticket);
            form.reset();
        } catch (err) {
            showToast('Could not save the ticket. Make sure the browser allows site storage.');
        } finally {
            button.disabled = false;
            button.textContent = 'Submit Ticket';
        }
    });
});
