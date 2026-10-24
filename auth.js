// Loaded in the <head> of the tanod dashboard: sends visitors who have not
// logged in back to the login page. The login lasts until the tab is closed.
(function () {
    try {
        window.currentTanod = JSON.parse(sessionStorage.getItem('tanod'));
    } catch (e) {
        window.currentTanod = null;
    }
    if (!window.currentTanod) window.location.replace('tanodlogin.html');
})();
