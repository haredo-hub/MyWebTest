let x = 0;

document.addEventListener('DOMContentLoaded', (event) => {
  const myText = document.getElementById('myText');
  const myButton = document.getElementById('myButton');
  if (myButton) {
    myButton.addEventListener('click', Counter);
  }
});

function Counter()
{
  x = x + 1;
  myText.textContent = x;
}
