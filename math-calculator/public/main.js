// Function to approximate values
function approximate(value, type) {
  const fraction = value.b / value.a;
  let result;
  const expApprox = 1 + fraction + Math.pow(fraction, 2) / 2 + Math.pow(fraction, 3) / 6 + Math.pow(fraction, 4) / 24 + Math.pow(fraction, 5) / 120;

  switch(type) {
    case 'sum':
      result = value.a * expApprox;
      break;
    case 'difference':
      result = value.a * (1 - expApprox);
      break;
    case 'product':
      result = value.a * Math.pow(expApprox, 2);
      break;
    case 'quotient':
      result = value.a / expApprox;
      break;
    default:
      result = 0;
  }
  return result;
}

// Helper function to fetch results from server
function fetchResult(endpoint, data) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json());
}

// Add event listeners to buttons
document.getElementById('calculateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-sum', { num1, num2 })
  .then(data => document.getElementById('result').innerText = `Sum: ${data.sum}`);
});

document.getElementById('approximateSum').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  document.getElementById('result').innerText = `Approximate Sum: ${approximate({ a: num1, b: num2 }, 'sum')}`;
});

document.getElementById('calculateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-difference', { num1, num2 })
  .then(data => document.getElementById('result').innerText = `Difference: ${data.difference}`);
});

document.getElementById('approximateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  document.getElementById('result').innerText = `Approximate Difference: ${approximate({ a: num1, b: num2 }, 'difference')}`;
});

document.getElementById('calculateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult('/calculate-product', { num1, num2 })
  .then(data => document.getElementById('result').innerText = `Product: ${data.product}`);
});

document.getElementById('approximateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  document.getElementById('result').innerText = `Approximate Product: ${approximate({ a: num1, b: num2 }, 'product')}`;
});

document.getElementById('calculateQuotient').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  fetchResult
