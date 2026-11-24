// Tab Switching
function switchTab(tab) {
  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("register-form");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  showAlert("", "clear");

  if (tab === "login") {
    loginForm.style.display = "block";
    regForm.style.display = "none";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    regForm.style.display = "block";
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
  }
}

// Notification Helper
function showAlert(message, type) {
  const alertBox = document.getElementById("alert-box");
  if (type === "clear") {
    alertBox.style.display = "none";
    alertBox.textContent = "";
    return;
  }
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = "block";
}

// Redirect based on user role
function routeUser(role) {
  switch (role) {
    case "admin":
      window.location.href = "admin-dashboard.html";
      break;
    case "speaker":
      window.location.href = "speaker-dashboard.html";
      break;
    case "attendee":
    default:
      window.location.href = "index.html";
      break;
  }
}

// Handle Login
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const db = getDB();
  const user = db.users.find((u) => u.email === email && u.password === password);

  if (!user) {
    showAlert("Invalid email or password.", "error");
    return;
  }

  setSessionUser(user);
  showAlert("Login successful! Redirecting...", "success");
  setTimeout(() => routeUser(user.role), 700);
});

// Handle Registration
document.getElementById("register-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;

  if (password.length < 3) {
    showAlert("Password must be at least 3 characters long.", "error");
    return;
  }

  const db = getDB();

  // Prevent duplicate registration
  const userExists = db.users.some((u) => u.email === email);
  if (userExists) {
    showAlert("An account with this email already exists.", "error");
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role
  };

  db.users.push(newUser);
  saveDB(db);

  setSessionUser(newUser);
  showAlert("Account created successfully! Redirecting...", "success");
  setTimeout(() => routeUser(newUser.role), 800);
});