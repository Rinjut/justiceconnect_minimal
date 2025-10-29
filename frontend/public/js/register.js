$('#role').on('change', function(){
  if($(this).val()==='lawyer') {
    $('#lawyerFields').removeClass('d-none');
  } else {
    $('#lawyerFields').addClass('d-none');
  }
}).trigger('change');

$('#btnRegister').on('click', async function(){
  const newPassword = $('#newPassword').val();
  const confirmPassword = $('#confirmPassword').val();

  if(newPassword !== confirmPassword){
    $('#msg').text('Passwords do not match!');
    return;
  }

  const payload = {
    fname: $('#fname').val().trim(),
    lname: $('#lname').val().trim(),
    phone: $('#phone').val().trim(),
    email: $('#email').val().trim(),
    password: newPassword,
    role: $('#role').val(),
  };

  if(payload.role === 'lawyer'){
    payload.expertise = $('#expertise').val().split(',').map(s=>s.trim()).filter(Boolean);
    payload.licenseNumber = $('#licenseNumber').val().trim();
  }

  /*try{
    await api('/api/auth/register','POST', payload);
    location.href = 'index.html';
  }catch(e){
    $('#msg').text(e.message || 'Registration failed');
  }*/
    try{
        const resp = await api('/api/auth/register','POST', payload);
        $('#msg').removeClass('text-danger').addClass('text-success').text(resp.message);
        if(payload.role === 'survivor' || payload.role === 'donor'){
            setTimeout(()=> location.href='index.html', 1500);
        }
    }catch(e){
        $('#msg').text(e.message || 'Registration failed');
    }

});
