const socket = io();

// Function to approximate sum using Hadi Rihawi's method
function approximateSum(a, b) {
  const fraction = b / a;
  const expApprox = 1 + fraction + Math.pow(fraction, 2) / 2 + Math.pow(fraction, 3) / 6 + Math.pow(fraction, 4) / 24 + Math.pow(fraction, 5) / 120;
  const sum = a * expApprox;
  return sum;
}

document.getElementById('calculateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  
  fetch('/calculate-sum', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
    headers: {
      'Content-Type': 'application/json'
    },
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
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Difference: ${data.difference}`;
  });
});

document.getElementById('calculateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/calculate-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Product: ${data.product}`;
  });
});

document.getElementById('calculateQuotient').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);

  fetch('/calculate-quotient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('result').innerText = `Quotient: ${data.quotient}`;
  });
});
