// Firebase Authentication Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js"
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCc1y2kNbSftG45mB3gkbUCGs4gfjts-E",
  authDomain: "realtimepfl.firebaseapp.com",
  databaseURL: "https://realtimepfl-default-rtdb.firebaseio.com",
  projectId: "realtimepfl",
  storageBucket: "realtimepfl.firebasestorage.app",
  messagingSenderId: "984202175754",
  appId: "1:984202175754:web:a0d689738832cc48b686f3",
  measurementId: "G-4W311B25HV",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.uid)

    // Check if we're on the login page
    if (window.location.pathname.includes("login.html")) {
      // Check if user has completed profile
      checkUserProfile(user.uid)
    }
  } else {
    // User is signed out
    console.log("User is signed out")

    // If not on login page, redirect to login
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html"
    }
  }
})

// Check if user has completed their profile
function checkUserProfile(userId) {
  getDoc(doc(db, "users", userId))
    .then((docSnapshot) => {
      if (docSnapshot.exists() && docSnapshot.data().profileComplete) {
        // Profile is complete, redirect to index
        window.location.href = "index.html"
      } else {
        // Profile is not complete, redirect to profile setup
        window.location.href = "profile.html"
      }
    })
    .catch((error) => {
      console.error("Error checking user profile:", error)
      // Redirect to profile setup on error
      window.location.href = "profile.html"
    })
}

// Login form submission
if (document.getElementById("login")) {
  document.getElementById("login").addEventListener("submit", (e) => {
    e.preventDefault()

    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value
    const errorMessage = document.getElementById("error-message")

    errorMessage.classList.add("hidden")

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user
        console.log("User logged in:", user.uid)
        // Redirect will happen in onAuthStateChanged
      })
      .catch((error) => {
        console.error("Login error:", error)
        errorMessage.textContent = error.message
        errorMessage.classList.remove("hidden")
      })
  })
}

// Register form submission
if (document.getElementById("register")) {
  document.getElementById("register").addEventListener("submit", (e) => {
    e.preventDefault()

    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value
    const confirmPassword = document.getElementById("register-confirm-password").value
    const errorMessage = document.getElementById("register-error-message")

    errorMessage.classList.add("hidden")

    // Check if passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = "Passwords do not match"
      errorMessage.classList.remove("hidden")
      return
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user
        console.log("User registered:", user.uid)

        // Create user document in Firestore
        return setDoc(doc(db, "users", user.uid), {
          email: email,
          createdAt: serverTimestamp(),
          profileComplete: false,
        })
      })
      .then(() => {
        // Show success message and switch to login
        const successMessage = document.getElementById("success-message")
        successMessage.textContent = "Registration successful! Please log in."
        successMessage.classList.remove("hidden")

        document.getElementById("register-form").classList.add("hidden")
        document.getElementById("login-form").classList.remove("hidden")
      })
      .catch((error) => {
        console.error("Registration error:", error)
        errorMessage.textContent = error.message
        errorMessage.classList.remove("hidden")
      })
  })
}

// Logout function
function logout() {
  signOut(auth)
    .then(() => {
      console.log("User signed out")
      window.location.href = "login.html"
    })
    .catch((error) => {
      console.error("Logout error:", error)
    })
}

// Make logout function globally available
window.logout = logout

export { auth, db, logout }
