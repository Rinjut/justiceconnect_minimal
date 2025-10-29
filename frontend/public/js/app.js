async function api(path, method='GET', body){
  const opts = { method, headers: { 'Content-Type':'application/json' }, credentials:'include' };
  if(method!=='GET' && body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw data;
  return data;
}
async function me(){ try{ const r = await api('/api/auth/me'); return r.user; } catch{ return null; } }
async function logout(){ await api('/api/auth/logout','POST'); location.href='index.html'; }
async function guard(roles){
  const u = await me();
  if(!u){ location.href='index.html'; return; }
  if(roles && !roles.includes(u.role)){ document.body.innerHTML = '<div class="container py-5"><h3>Forbidden</h3></div>'; }
}
