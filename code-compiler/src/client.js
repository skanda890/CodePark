document.getElementById('compileButton').addEventListener('click', () => {
  const code = document.getElementById('codeInput').value
  const language = document.getElementById('languageSelect').value

  fetch('/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, language })
  })
    .then((response) => response.text())
    .then((result) => {
      document.getElementById('output').innerText = result
    })
    .catch((error) => {
      console.error('Error:', error)
    })
})
