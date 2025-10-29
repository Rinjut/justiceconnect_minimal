guard(['admin']);
$('#assign').on('click', async ()=>{
  await api('/api/admin/assign','POST',{
    survivorId: $('#survivorId').val().trim(),
    lawyerId: $('#lawyerId').val().trim(),
    intakeId: $('#intakeId').val().trim()
  });
  alert('Assigned');
});
$('#btnLogout').on('click',()=>logout());