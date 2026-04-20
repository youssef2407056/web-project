/* ===============================
   COMPLETE LOGIN + SIGNUP VALIDATION
   =============================== */
(function () {

  var USER_KEY = "noir_user_v2";
  var REGISTRY_KEY = "noir_users_registry";

  /* ------------------ STORAGE ------------------ */
  function getRegistry() {
    try {
      var raw = localStorage.getItem(REGISTRY_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
      if (arr.length === 0) {
        var legacy = localStorage.getItem(USER_KEY);
        if (legacy) {
          try {
            var u = JSON.parse(legacy);
            if (u && u.email) {
              arr.push({
                id: "u-" + Date.now(),
                name: u.name || "",
                email: String(u.email).toLowerCase(),
                password: u.password,
                createdAt: u.createdAt || new Date().toISOString(),
              });
              localStorage.setItem(REGISTRY_KEY, JSON.stringify(arr));
            }
          } catch (e2) {}
        }
      }
      return arr;
    } catch (e) {
      return [];
    }
  }

  function saveRegistry(arr) {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(arr));
  }

  function getUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function findUserByEmail(email) {
    var e = String(email || "").toLowerCase().trim();
    var list = getRegistry();
    for (var i = 0; i < list.length; i++) {
      if (list[i].email === e) return list[i];
    }
    return null;
  }

  /* ------------------ HELPERS ------------------ */
  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function strongPassword(pass) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pass);
  }

  function createError(input) {
    var err = input.nextElementSibling;

    if (!err || !err.classList.contains("error-msg")) {
      err = document.createElement("div");
      err.className = "error-msg";
      err.style.color = "#c62828";
      err.style.fontSize = "13px";
      err.style.marginTop = "5px";
      input.parentNode.insertBefore(err, input.nextSibling);
    }

    return err;
  }

  function showError(input, text) {
    var err = createError(input);
    err.textContent = text;
    input.style.border = "1.5px solid #c62828";
  }

  function clearError(input) {
    var err = input.nextElementSibling;
    if (err && err.classList.contains("error-msg")) {
      err.textContent = "";
    }
    input.style.border = "";
  }

  function showMsg(text, good) {
    var msg = document.getElementById("authMsg");
    if (!msg) return;

    msg.textContent = text;
    msg.style.color = good ? "#2e7d32" : "#c62828";
  }

  /* ===============================
     DOM READY
     =============================== */
  document.addEventListener("DOMContentLoaded", function () {

    /* ==================================================
       SIGNUP
       ================================================== */
    var signupForm = document.getElementById("signupForm");

    if (signupForm) {

      var nameInput = signupForm.querySelector('[name="name"]');
      var emailInput = signupForm.querySelector('[name="email"]');
      var passInput = signupForm.querySelector('[name="password"]');

      [nameInput, emailInput, passInput].forEach(function (input) {
        input.addEventListener("input", function () {
          clearError(input);
          showMsg("", false);
        });
      });

      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var name = nameInput.value.trim();
        var email = emailInput.value.trim().toLowerCase();
        var pass = passInput.value.trim();

        clearError(nameInput);
        clearError(emailInput);
        clearError(passInput);

        var hasError = false;

        /* Name */
        if (!name) {
          showError(nameInput, "Name is required");
          hasError = true;
        }

        /* Email */
        if (!email) {
          showError(emailInput, "Email is required");
          hasError = true;
        } else if (!validEmail(email)) {
          showError(emailInput, "Enter a valid email");
          hasError = true;
        }

        /* Password */
        if (!pass) {
          showError(passInput, "Password is required");
          hasError = true;
        } else if (pass.length < 8) {
          showError(passInput, "At least 8 characters");
          hasError = true;
        } else if (!strongPassword(pass)) {
          showError(passInput, "Use letters + numbers");
          hasError = true;
        }

        if (hasError) return;

        if (findUserByEmail(email)) {
          showError(emailInput, "An account with this email already exists");
          return;
        }

        var newUser = {
          id: "u-" + Date.now(),
          name: name,
          email: email,
          password: pass,
          createdAt: new Date().toISOString(),
        };
        var list = getRegistry();
        list.push(newUser);
        saveRegistry(list);
        setUser(newUser);

        signupForm.reset();
        showMsg("✅ Account created successfully!", true);
      });
    }

    /* ==================================================
       LOGIN
       ================================================== */
    var loginForm = document.getElementById("loginForm");

    if (loginForm) {

      var loginEmail = loginForm.querySelector('[name="email"]');
      var loginPass = loginForm.querySelector('[name="password"]');

      [loginEmail, loginPass].forEach(function (input) {
        input.addEventListener("input", function () {
          clearError(input);
          showMsg("", false);
        });
      });

      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var email = loginEmail.value.trim().toLowerCase();
        var pass = loginPass.value.trim();

        clearError(loginEmail);
        clearError(loginPass);

        var hasError = false;

        if (!email) {
          showError(loginEmail, "Email is required");
          hasError = true;
        } else if (!validEmail(email)) {
          showError(loginEmail, "Enter a valid email");
          hasError = true;
        }

        if (!pass) {
          showError(loginPass, "Password is required");
          hasError = true;
        } else if (pass.length < 8) {
          showError(loginPass, "At least 8 characters");
          hasError = true;
        }

        if (hasError) return;

        var user = findUserByEmail(email);

        if (!user) {
          showError(loginEmail, "No account found");
          return;
        }

        if (user.password !== pass) {
          showError(loginPass, "Incorrect password");
          return;
        }

        setUser(user);
        sessionStorage.setItem("noir_session", "1");

        showMsg("✅ Welcome back! Redirecting...", true);

        setTimeout(function () {
          window.location.href = "../../home.html";
        }, 800);
      });
    }

  });

})();