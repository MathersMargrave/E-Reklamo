// Tanod login: checks the number and password against the accounts in store.js.
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const box = document.getElementById('loginContainer');
    const error = document.getElementById('errorMessage');
    const pass = document.getElementById('password');
    const toggle = document.getElementById('togglePass');

    if (sessionStorage.getItem('tanod')) { window.location.replace('tanod.html'); return; }

    toggle.addEventListener('click', function () {
        const show = pass.type === 'password';
        pass.type = show ? 'text' : 'password';
        toggle.textContent = show ? 'Hide' : 'Show';
        toggle.setAttribute('aria-pressed', String(show));
        toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const number = document.getElementById('tanodNumber').value.trim();
        const account = ReklamoStore.tanods.find(function (t) {
            return t.number === number && t.password === pass.value;
        });

        if (!account) {
            error.classList.add('show');
            box.classList.remove('shake');
            void box.offsetWidth; // restart the shake animation
            box.classList.add('shake');
            return;
        }

        const session = Object.assign({}, account);
        delete session.password;
        sessionStorage.setItem('tanod', JSON.stringify(session));
        window.location.href = 'tanod.html';
    });
});
