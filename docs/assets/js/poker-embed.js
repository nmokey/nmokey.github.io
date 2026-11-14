// The host cannot wake Streamlit from inside a third-party iframe.
const frame = document.querySelector('.poker-demo');
document.getElementById('reload-demo')?.addEventListener('click', () => {
  frame.src = frame.getAttribute('src');
});
