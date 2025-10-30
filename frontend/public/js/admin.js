// frontend/public/js/admin.js
(function () {
  // Require logged-in admin
  if (typeof guard === 'function') {
    // If not logged in or not admin, guard() will redirect or block the page
    guard(['admin']);
  }

  // Logout (sidebar & dropdown)
  $('#btnLogout, #btnLogoutTop').on('click', function (e) {
    e.preventDefault();
    if (typeof logout === 'function') logout();
  });

  // Safety net: never use javascript: URLs under CSP
  $('a[href^="javascript:"]').attr('href', '#');

  // Optional: sidebar/header toggles (if your theme's JS is not included)
  $('#headerCollapse, #sidebarCollapse').on('click', function (e) {
    e.preventDefault();
    $('body').toggleClass('sidebar-open');
  });

  // TODO: You can add admin-specific AJAX here, e.g.:
  // - Load pending approvals
  // - Approve/reject users
  // - Load assignment queue from API
  //
  // Example skeleton:
  // async function loadPending() {
  //   try {
  //     const r = await api('/api/admin/pending-users'); // implement on backend
  //     // render into a table
  //   } catch (err) {
  //     console.error('Failed to load pending users', err);
  //   }
  // }
  // loadPending();
})();
