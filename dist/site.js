const buttons = document.querySelectorAll('[data-photo]');
if(buttons.length){
  const dialog=document.createElement('dialog');
  dialog.className='photo-dialog';
  dialog.setAttribute('aria-label','Photo viewer');
  dialog.innerHTML='<div class="dialog-top"><p></p><button type="button" autofocus>Close ×</button></div><img alt="">';
  document.body.append(dialog);
  const picture=dialog.querySelector('img');
  buttons.forEach(button=>button.addEventListener('click',()=>{
    picture.src=button.dataset.photo;
    picture.alt=button.querySelector('img').alt;
    dialog.querySelector('p').textContent=button.dataset.caption||picture.alt;
    dialog.showModal();
  }));
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
