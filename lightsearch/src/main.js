const goBtn    = document.getElementById('go');
const luckyBtn = document.getElementById('lucky');
const input    = document.getElementById('query');

goBtn.addEventListener('click', () => {
  const q = input.value.trim();
  if (!q) return;
  window.open(`https://www.bing.com/search?q=${encodeURIComponent(q)}`, '_blank');
});

luckyBtn.addEventListener('click', () => {
  const q = input.value.trim();
  if (!q) return;
  // Google “I'm Feeling Lucky” redirect:
  window.location.href = `https://www.google.com/search?btnI=1&q=${encodeURIComponent(q)}`;
});
