(function () {
  const $msg   = $('#msg');
  const $flash = $('#flash');
  const $btn   = $('#btnLogin');

  function setFieldError(inputId, errorId, message) {
    const $input = $('#' + inputId);
    const $error = $('#' + errorId);
    if (message) {
      $input.addClass('is-invalid');
      $error.text(message);
    } else {
      $input.removeClass('is-invalid');
      $error.text('');
    }
  }
  function clearErrors() {
    $('.is-invalid').removeClass('is-invalid');
    $('#emailError,#passwordError').text('');
    $msg.addClass('d-none').text('');
  }
  function emailOk(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function showBanner(text, ok) {
    const $el = ok ? $flash : $msg;
    $el.removeClass('d-none alert-success alert-danger')
       .addClass(ok ? 'alert-success' : 'alert-danger')
       .text(text);
  }

  // Show flash from ?msg= (e.g., after successful registration)
  (function showFlashFromQuery() {
    const params = new URLSearchParams(location.search);
    const msg = params.get('msg');
    if (msg) {
      showBanner(msg, true);
      history.replaceState({}, document.title, location.pathname); // clean URL
    }
  })();

  // Optional: if already logged in, redirect to your role dashboard
  (async function autoRedirectIfLogged() {
    try {
      const r = await api('/api/auth/me');
      if (r && r.user && r.user.role) {
        goToRole(r.user.role);
      }
    } catch { /* not logged in; ignore */ }
  })();

  function goToRole(role) {
    if (role === 'survivor') location.href = 'survivor.html';
    else if (role === 'lawyer') location.href = 'lawyer.html';
    else if (role === 'admin') location.href = 'admin.html';
    else if (role === 'donor') location.href = 'donor.html';
    else location.href = 'index.html';
  }

  // Live email format validation (optional nicety)
  $('#email').on('input', function () {
    const v = this.value.trim();
    if (!v) { setFieldError('email', 'emailError', 'Email is required.'); return; }
    if (!emailOk(v)) setFieldError('email', 'emailError', 'Enter a valid email.');
    else setFieldError('email', 'emailError', '');
  });

  $btn.on('click', async function () {
    clearErrors();

    const email = $('#email').val().trim();
    const password = $('#password').val();

    // Client-side checks
    let hasError = false;
    if (!email) { setFieldError('email', 'emailError', 'Email is required.'); hasError = true; }
    else if (!emailOk(email)) { setFieldError('email', 'emailError', 'Enter a valid email.'); hasError = true; }

    if (!password) { setFieldError('password', 'passwordError', 'Password is required.'); hasError = true; }
    if (hasError) return;

    try {
      $btn.prop('disabled', true);

      // Optional: remember me hint (server can set longer session on this flag if you implement it)
      const remember = $('#rememberMe').is(':checked');

      const r = await api('/api/auth/login', 'POST', { email, password, remember });

      // Expect backend returns { role, user } or similar
      if (r && (r.role || (r.user && r.user.role))) {
        const role = r.role || r.user.role;
        goToRole(role);
      } else {
        // fallback
        showBanner('Login successful.', true);
        setTimeout(() => location.href = 'index.html', 600);
      }

    } catch (e) {
      // Common server responses to map nicely:
      // 401: invalid credentials
      // 403: not approved (pending)
      if (e.status === 401) {
        setFieldError('email', 'emailError', '');
        setFieldError('password', 'passwordError', 'Invalid email or password.');
      } else if (e.status === 403) {
        // Pending approval or blocked
        showBanner(e.message || 'Your account is not approved yet. Please wait for admin verification.', false);
      } else {
        showBanner(e.message || 'Unable to sign in. Please try again.', false);
      }
    } finally {
      $btn.prop('disabled', false);
    }
  });
})();
