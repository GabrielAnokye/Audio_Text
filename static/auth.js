// Check if we're on an auth page
const isAuthPage =
  window.location.pathname === "/login" ||
  window.location.pathname === "/signup";

async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem("authToken", token);

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    window.location.replace("/");
  } catch (error) {
    console.error("Login error:", error);
    alert("Login error: " + error.message);
  }
}

async function handleSignup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem("authToken", token);

    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Signup failed");
    }

    window.location.replace("/");
  } catch (error) {
    console.error("Signup error:", error);
    alert("Signup error: " + error.message);
  }
}

async function handleLogout() {
  try {
    await firebase.auth().signOut();
    localStorage.removeItem("authToken");
    window.location.replace("/logout");
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed: " + error.message);
  }
}
