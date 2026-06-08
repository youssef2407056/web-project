(function () {
  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function strongPassword(pass) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pass);
  }

  function createError(input) {
    var err = input.nextElementSibling;
    if (!err || !err.classList.contains('error-msg')) {
      err = document.createElement('div');
      err.className = 'error-msg';
      err.style.color = '#c62828';
      err.style.fontSize = '13px';
      err.style.marginTop = '5px';
      input.parentNode.insertBefore(err, input.nextSibling);
    }
    return err;
  }

  function showError(input, text) {
    var err = createError(input);
    err.textContent = text;
    input.style.border = '1.5px solid #c62828';
  }

  function clearError(input) {
    var err = input.nextElementSibling;
    if (err && err.classList.contains('error-msg')) err.textContent = '';
    input.style.border = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var signupForm = document.getElementById('signupForm');
    if (signupForm) {
      var nameInput = signupForm.querySelector('[name="name"]');
      var emailInput = signupForm.querySelector('[name="email"]');
      var passInput = signupForm.querySelector('[name="password"]');

      signupForm.addEventListener('submit', function (e) {
        var name = nameInput.value.trim();
        var email = emailInput.value.trim();
        var pass = passInput.value.trim();
        var hasError = false;

        clearError(nameInput);
        clearError(emailInput);
        clearError(passInput);

        if (!name) {
          showError(nameInput, 'Name is required');
          hasError = true;
        }
        if (!email) {
          showError(emailInput, 'Email is required');
          hasError = true;
        } else if (!validEmail(email)) {
          showError(emailInput, 'Enter a valid email');
          hasError = true;
        }
        if (!pass) {
          showError(passInput, 'Password is required');
          hasError = true;
        } else if (!strongPassword(pass)) {
          showError(passInput, 'Use at least 8 characters with letters and numbers');
          hasError = true;
        }

        if (hasError) e.preventDefault();
      });
    }

    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
      var loginEmail = loginForm.querySelector('[name="email"]');
      var loginPass = loginForm.querySelector('[name="password"]');

      loginForm.addEventListener('submit', function (e) {
        var email = loginEmail.value.trim();
        var pass = loginPass.value.trim();
        var hasError = false;

        clearError(loginEmail);
        clearError(loginPass);

        if (!email) {
          showError(loginEmail, 'Email is required');
          hasError = true;
        } else if (!validEmail(email)) {
          showError(loginEmail, 'Enter a valid email');
          hasError = true;
        }
        if (!pass) {
          showError(loginPass, 'Password is required');
          hasError = true;
        } else if (pass.length < 8) {
          showError(loginPass, 'At least 8 characters');
          hasError = true;
        }

        if (hasError) e.preventDefault();
      });
    }
  });
})();
