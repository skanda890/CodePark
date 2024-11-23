document.getElementById('dictionary-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const word = document.getElementById('word').value;
    const lang = document.getElementById('language').value;
    const response = await fetch('/define', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word, lang })
    });
    const data = await response.json();
    displayResult(data);
});

function displayResult(data) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    if (data.error) {
        resultDiv.innerHTML = `<p>${data.error}</p>`;
        return;
    }

    if (!Array.isArray(data) || data.length === 0) {
        resultDiv.innerHTML = `<p>No definition found.</p>`;
        return;
    }

    const wordData = data[0];
    const phonetics = wordData.phonetics.map(p => p.text).join(', ');
    const meanings = wordData.meanings.map(meaning => {
        return `
            <h3>${meaning.partOfSpeech}</h3>
            <ul>
                ${meaning.definitions.map(def => `<li>${def.definition}</li>`).join('')}
            </ul>
        `;
    }).join('');

    resultDiv.innerHTML = `
        <h2>${wordData.word}</h2>
        <p><strong>Phonetics:</strong> ${phonetics}</p>
        ${meanings}
    `;
}
