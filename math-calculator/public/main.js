const socket = io();

// Function to approximate calculations using Hadi Rihawi's method
function approximate(a, b, operation) {
  const fraction = b / a;
  const expApprox = 1 + fraction + Math.pow(fraction, 2) / 2 + Math.pow(fraction, 3) / 6 + Math.pow(fraction, 4) / 24 + Math.pow(fraction, 5) / 120;
  let result;
  switch(operation) {
    case 'sum':
      result = a * expApprox;
      break;
    case 'difference':
      result = a - (a * fraction * expApprox);
      break;
    case 'product':
      result = a * Math.exp(Math.log(b) * expApprox);
      break;
    case 'quotient':
      result = a / expApprox;
      break;
    default:
      result = null;
  }
  return result;
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
  const result = approximate(num1, num2, 'sum');
  document.getElementById('result').innerText = `Approximate Sum: ${result}`;
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

document.getElementById('approximateDifference').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  const result = approximate(num1, num2, 'difference');
  document.getElementById('result').innerText = `Approximate Difference: ${result}`;
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

document.getElementById('approximateProduct').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  const result = approximate(num1, num2, 'product');
  document.getElementById('result').innerText = `Approximate Product: ${result}`;
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

document.getElementById('approximateQuotient').addEventListener('click', () => {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  const result = approximate(num1, num2, 'quotient');
  document.getElementById('result').innerText = `Approximate Quotient: ${result}`;
});
