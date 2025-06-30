document.getElementById('go').addEventListener('click', () => {
  const q = document.getElementById('query').value.trim();
  if (!q) return;
  window.open(`https://www.bing.com/search?q=${encodeURIComponent(q)}`, '_blank');
});
