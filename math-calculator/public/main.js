const socket = io();

// Function to approximate using a series expansion
function approximateOperation(num1, num2, operation) {
  const fraction = num2 / num1;
  const expApprox = 1 + fraction + Math.pow(fraction, 2) / 2 + Math.pow(fraction, 3) / 6 + Math.pow(fraction, 4) / 24 + Math.pow(fraction, 5) / 120;
  
  switch (operation) {
    case 'sum':
      return num1 * expApprox;
    case 'difference':
      return num1 * (1 - expApprox);
    case 'product':
      return num1 * num2 * expApprox;
    case 'quotient':
      return num1 / (num2 * expApprox);
    default:
      return null;
  }
}

// Fetch and display result from API
function fetchResult(url, num1, num2, resultElement) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ num1, num2 })
  })
  .then(response => response.json())
  .then(data => {
    const result = data.result !== undefined ? data.result : data.error;
    resultElement.innerText = result;
  })
  .catch(error => {
    resultElement.innerText = `Error: ${error.message}`;
  });
}

document.getElementById('calculateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-sum', num1, num2, document.getElementById('result'));
});

document.getElementById('approximateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/approximate-sum', num1, num2, document.getElementById('result'));
});

document.getElementById('calculateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-difference', num1, num2, document.getElementById('result'));
});

document.getElementById('approximateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/approximate-difference', num1, num2, document.getElementById('result'));
});

document.getElementById('calculateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-product', num1, num2, document.getElementById('result'));
});

document.getElementById('approximateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/approximate-product', num1, num2, document.getElementById('result'));
});

document.getElementById('calculateQuotient').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-quotient', num1, num2, document.getElementById('result'));
});

document.getElementById('approximateQuotient').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/approximate-quotient', num1, num2, document.getElementById('result'));
});
