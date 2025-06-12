  document.getElementById('survey-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) return;

    const email = document.getElementById('email').value;
    document.getElementById('emailConfirmText').innerHTML = `Is This Email Correct? <br><strong>${email}</strong>`;
    document.getElementById('confirmPopup').style.display = 'flex';
  });

  // When user clicks "Yes ✅"
  document.getElementById('confirmYes').addEventListener('click', async function () {
    document.getElementById('confirmPopup').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    const form = document.getElementById('survey-form');
    const formData = new FormData(form);
    let data = new URLSearchParams();
    for (const pair of formData) data.append(pair[0], pair[1]);

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbyyNEnATCeb-gsA5DqW4V1363iN6dG5MbwRS0kdhMI2QRma9uEShpmP1xXt9aTYDGDl/exec', {
        method: 'POST',
        body: data
      });

      if (response.ok) {
        console.log('Success:', await response.text());
        window.location.href = "success.html"; // make sure path is correct
      } else {
        const errorText = await response.text();
        console.error('Server responded with error:', response.status, errorText);
        alert('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      document.getElementById('loading').style.display = 'none';
    }
  });

  // Prevent form submission on Enter key globally, but trigger submit-btn click
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('submit-btn').click();
    }
  });

  // Disable right click
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Disable F12 and Ctrl+Shift+I to prevent dev tools
  document.addEventListener('keydown', function (e) {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')
    ) {
      e.preventDefault();
    }
  });

