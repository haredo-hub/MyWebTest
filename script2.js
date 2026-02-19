(() => {
  let clickCount = 0;
  
  document.addEventListener('DOMContentLoaded', () => {
    const textDisplay = document.getElementById('myText');
    const countButton = document.getElementById('myButton');
    
    if (countButton && textDisplay) {
      textDisplay.textContent = clickCount;
      countButton.addEventListener('click', () => {
        clickCount++;
        textDisplay.textContent = clickCount;
      });
    }
  });
})();
