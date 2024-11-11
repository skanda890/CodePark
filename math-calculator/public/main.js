const socket = io();

// Function to approximate value using Hadi Rihawi's method
function approximate(a, b) {
  const fraction = b / a;
  return 1 + fraction + Math.pow(fraction, 2) / 2 + Math.pow(fraction, 3) / 6 + Math.pow(fraction, 4) / 24 + Math.pow(fraction, 5) / 120;
}

document.getElementById('calculateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  
  fetch('/calculate-sum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Sum: ${data.sum}`;
  });
});

document.getElementById('approximateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/approximate-sum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Approximate Sum: ${data.approxSum}`;
  });
});

document.getElementById('calculateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/calculate-difference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Difference: ${data.difference}`;
  });
});

document.getElementById('approximateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/approximate-difference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Approximate Difference: ${data.approxDifference}`;
  });
});

document.getElementById('calculateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/calculate-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Product: ${data.product}`;
  });
});

document.getElementById('approximateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/approximate-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Approximate Product: ${data.approxProduct}`;
  });
});

document.getElementById('calculateQuotient').addEventListener
