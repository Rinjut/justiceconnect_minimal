$('#btnLogin').on('click', async function(){
  const email = $('#email').val().trim();
  const password = $('#password').val();

  try{
    const r = await api('/api/auth/login','POST',{ email, password });
    const role = r.role;
    if(role==='survivor') location.href='survivor.html';
    else if(role==='lawyer') location.href='lawyer.html';
    else if(role==='admin') location.href='admin.html';
    else if(role==='donor') location.href='donor.html';
  }catch(e){
    $('#msg').text(e.message||'Login failed');
  }
});
