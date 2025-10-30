(function () {
  const $msg = $('#msg');
  const $btn = $('#btnRegister');

  // helpers
  function setError(inputId, errorId, message) {
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
  function clearAllErrors() {
    $('.is-invalid').removeClass('is-invalid');
    $('#fnameError,#lnameError,#emailError,#phoneError,#roleError,#expertiseError,#licenseNumberError,#newPasswordError,#confirmPasswordError').text('');
    $msg.addClass('d-none').text('');
  }
  function emailOk(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function passwordStrong(v) {
    // ≥8 chars, at least one number and one symbol
    return /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v);
  }
  function showBanner(text, ok = false) {
    $msg.removeClass('d-none alert-danger alert-success')
        .addClass(ok ? 'alert-success' : 'alert-danger')
        .text(text);
  }

  // role toggle
  $('#role').on('change', function () {
    if ($(this).val() === 'lawyer') $('#lawyerFields').removeClass('d-none');
    else $('#lawyerFields').addClass('d-none');
  }).trigger('change');

  // (Optional) email exists pre-check (HTTP 409 still handled on submit)
  let emailTimer;
  $('#email').on('input', function () {
    clearTimeout(emailTimer);
    const v = this.value.trim();
    if (!emailOk(v)) {
      setError('email', 'emailError', 'Enter a valid email.');
      return;
    } else {
      setError('email', 'emailError', '');
    }
    // If you added /api/auth/check-email, uncomment:
    // emailTimer = setTimeout(async () => {
    //   try {
    //     const r = await api(`/api/auth/check-email?email=${encodeURIComponent(v)}`);
    //     if (r.exists) setError('email', 'emailError', 'Email already used.');
    //   } catch {}
    // }, 400);
  });

  // submit
  $btn.on('click', async function () {
    clearAllErrors();

    const fname = $('#fname').val().trim();
    const lname = $('#lname').val().trim();
    const email = $('#email').val().trim();
    const phone = $('#phone').val().trim();
    const role  = $('#role').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    let hasError = false;

    if (!fname) { setError('fname', 'fnameError', 'First name is required.'); hasError = true; }
    if (!lname) { setError('lname', 'lnameError', 'Last name is required.'); hasError = true; }

    if (!email) { setError('email', 'emailError', 'Email is required.'); hasError = true; }
    else if (!emailOk(email)) { setError('email', 'emailError', 'Enter a valid email.'); hasError = true; }

    if (!phone) { setError('phone', 'phoneError', 'Phone number is required.'); hasError = true; }

    if (!role) { setError('role', 'roleError', 'Role is required.'); hasError = true; }

    if (!newPassword) {
      setError('newPassword', 'newPasswordError', 'Password is required.');
      hasError = true;
    } else if (!passwordStrong(newPassword)) {
      setError('newPassword', 'newPasswordError', 'Min 8 chars, include number & symbol.');
      hasError = true;
    }

    if (newPassword !== confirmPassword) {
      setError('confirmPassword', 'confirmPasswordError', 'Passwords do not match.');
      hasError = true;
    }

    const payload = { fname, lname, phone, email, password: newPassword, role };

    if (role === 'lawyer') {
      payload.expertise = $('#expertise').val().split(',').map(s => s.trim()).filter(Boolean);
      payload.licenseNumber = $('#licenseNumber').val().trim();
      // Example: require license number for lawyers
      if (!payload.licenseNumber) {
        setError('licenseNumber', 'licenseNumberError', 'License number is required for lawyers.');
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      $btn.prop('disabled', true);
      const resp = await api('/api/auth/register', 'POST', payload);

      // Success: survivors/donors → redirect to login with flash
      if (role === 'survivor' || role === 'donor') {
        const msg = encodeURIComponent('Registration successful. Please sign in.');
        location.href = `index.html?msg=${msg}`;
        return;
      }

      // Success: lawyers/admins → stay with pending message
      showBanner(resp.message || 'Registered successfully. Verification pending from super admin.', true);

    } catch (e) {
      // 409 from backend for duplicate email
      if (e.status === 409 || (e.details && /already used/i.test(e.details.message || ''))) {
        setError('email', 'emailError', 'Email already used.');
      } else if (e.status === 400) {
        // generic missing fields fallback
        showBanner(e.message || 'Please correct the highlighted fields.');
      } else {
        showBanner(e.message || 'Registration failed.');
      }
    } finally {
      $btn.prop('disabled', false);
    }
  });
})();
