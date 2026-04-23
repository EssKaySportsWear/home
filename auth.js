/**
 * EssKay Sportswear - Authentication System
 * Clean, Production-Ready Firebase Auth Module
 */

import { auth, rtdb } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  fetchSignInMethodsForEmail
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, set, get, child, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Auth system initialized. If changes do not appear, please Hard Refresh (Ctrl + F5).');

  // --- UI Elements ---
  const sections = {
    login: document.getElementById('login-section'),
    signup: document.getElementById('signup-section'),
    forgot: document.getElementById('forgot-password-section'),
    verify: document.getElementById('verify-email-section')
  };

  const buttons = {
    showSignup: document.getElementById('showSignup'),
    showLogin: document.getElementById('showLogin'),
    showForgot: document.getElementById('showForgotPwd'),
    forgotBack: document.getElementById('forgotBackToLogin'),
    loginGoogle: document.getElementById('loginGoogleBtn'),
    signupGoogle: document.getElementById('signupGoogleBtn'),
    logout: document.getElementById('nav-logout-btn'),
    changeEmail: document.getElementById('changeEmailBtn'),
    verifyBack: document.getElementById('verifyBackToLogin'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn')
  };

  const forms = {
    login: document.getElementById('loginForm'),
    signup: document.getElementById('signupForm'),
    forgot: document.getElementById('forgotIdentityForm')
  };

  const inputs = {
    loginEmail: document.getElementById('loginEmail'),
    signupEmail: document.getElementById('signupEmail'),
    signupName: document.getElementById('signupName')
  };

  const containers = {
    loginPasswordGroup: document.getElementById('loginPasswordGroup'),
    signupPasswordWrapper: document.getElementById('signupPasswordWrapper')
  };

  const messages = {
    googleDetectLogin: document.getElementById('google-detect-msg-login'),
    googleDetectSignup: document.getElementById('google-detect-msg-signup')
  };

  const displayVerifyEmail = document.getElementById('display-verify-email');
  const googleProvider = new GoogleAuthProvider();
  let verificationCheckInterval = null;
  let isProcessingGoogle = false;

  // --- Helper: Toggle Sections ---
  function showSection(sectionName) {
    stopVerificationCheck();
    Object.values(sections).forEach(s => s?.classList.remove('active'));
    sections[sectionName]?.classList.add('active');
    hideAllErrors();
    resetDynamicUI();
  }

  // --- Helper: Reset Dynamic UI ---
  function resetDynamicUI() {
    if (containers.loginPasswordGroup) containers.loginPasswordGroup.style.display = 'block';
    if (buttons.loginBtn) buttons.loginBtn.style.display = 'block';
    if (messages.googleDetectLogin) messages.googleDetectLogin.style.display = 'none';

    if (containers.signupPasswordWrapper) containers.signupPasswordWrapper.style.display = 'block';
    if (buttons.signupBtn) buttons.signupBtn.style.display = 'block';
    if (messages.googleDetectSignup) messages.googleDetectSignup.style.display = 'none';
  }

  // --- Helper: Error/Status Display ---
  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    } else {
      console.error(message);
    }
  }

  function hideAllErrors() {
    ['loginError', 'signupError', 'forgotIdentityError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.textContent = '';
      }
    });
  }

  function stopVerificationCheck() {
    if (verificationCheckInterval) {
      clearInterval(verificationCheckInterval);
      verificationCheckInterval = null;
    }
  }

  // --- Dynamic UI: Google Detection ---
  async function checkEmailMethods(email, context) {
    if (!email || !email.includes('@')) {
      resetDynamicUI();
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      const isGoogle = methods.includes('google.com');

      if (context === 'login') {
        if (isGoogle) {
          if (containers.loginPasswordGroup) containers.loginPasswordGroup.style.display = 'none';
          if (buttons.loginBtn) buttons.loginBtn.style.display = 'none';
          if (messages.googleDetectLogin) messages.googleDetectLogin.style.display = 'block';
        } else {
          resetDynamicUI();
        }
      } else if (context === 'signup') {
        if (isGoogle) {
          if (containers.signupPasswordWrapper) containers.signupPasswordWrapper.style.display = 'none';
          if (buttons.signupBtn) buttons.signupBtn.style.display = 'none';
          if (messages.googleDetectSignup) messages.googleDetectSignup.style.display = 'block';
        } else {
          resetDynamicUI();
        }
      }
    } catch (error) {
      resetDynamicUI();
    }
  }

  inputs.loginEmail?.addEventListener('blur', () => checkEmailMethods(inputs.loginEmail.value, 'login'));
  inputs.signupEmail?.addEventListener('blur', () => checkEmailMethods(inputs.signupEmail.value, 'signup'));

  // --- Navigation Listeners ---
  buttons.showSignup?.addEventListener('click', () => showSection('signup'));
  buttons.showLogin?.addEventListener('click', () => showSection('login'));
  buttons.showForgot?.addEventListener('click', () => showSection('forgot'));
  buttons.forgotBack?.addEventListener('click', () => showSection('login'));
  buttons.verifyBack?.addEventListener('click', async () => {
    await signOut(auth);
    showSection('login');
  });
  buttons.changeEmail?.addEventListener('click', () => showSection('signup'));

  // --- Core Action: Login ---
  forms.login?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const email = inputs.loginEmail.value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        showError('loginError', 'Please verify your email before logging in.');
        await signOut(auth);
        return;
      }
      window.location.href = 'index.html';
    } catch (error) {
      let msg = "Invalid email or password";
      if (error.code === 'auth/user-not-found' || error.code.includes('credential')) msg = "User doesn't exist";
      else if (error.code === 'auth/wrong-password') msg = "Incorrect password";
      showError('loginError', msg);
    }
  });

  // --- Core Action: Signup ---
  forms.signup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const name = inputs.signupName.value.trim();
    const email = inputs.signupEmail.value.trim();
    const password = document.getElementById('signupPassword').value;

    if (password.length < 6) {
      showError('signupError', 'Password must be at least 6 characters.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await set(ref(rtdb, 'users/' + user.uid), {
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });
      await signOut(auth);
      if (displayVerifyEmail) displayVerifyEmail.textContent = email;
      showSection('verify');
      verificationCheckInterval = setInterval(async () => {
        try {
          await user.reload();
          if (user.emailVerified) {
            stopVerificationCheck();
            alert('Email verified! Redirecting...');
            window.location.href = 'index.html';
          }
        } catch (err) { console.error(err); }
      }, 3000);
    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      showError('signupError', msg);
    }
  });

  // --- Core Action: Google Sign-In (Auto-Register) ---
  async function handleGoogleSignIn() {
    isProcessingGoogle = true;
    try {
      console.log('Starting Google Sign-In...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = ref(rtdb, 'users/' + user.uid);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        console.log('New user detected. Auto-creating database record.');
        await set(userRef, {
          name: user.displayName || 'Google User',
          email: user.email,
          createdAt: new Date().toISOString()
        });
      }

      console.log('Login successful. Redirecting to home.');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Google Auth Error:', error.code, error.message);
      alert('Google Sign-In failed.');
      isProcessingGoogle = false;
    }
  }

  buttons.loginGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });
  buttons.signupGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });

  // --- Core Action: Forgot Password ---
  forms.forgot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const email = document.getElementById('forgotIdentityInput')?.value?.trim();
    if (!email) { showError('forgotIdentityError', 'Please enter your email.'); return; }
    try {
      const usersRef = ref(rtdb, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
      const snapshot = await get(emailQuery);
      if (!snapshot.exists()) { showError('forgotIdentityError', "Email Doesn't Exist"); return; }
      await sendPasswordResetEmail(auth, email);
      alert('Password reset link sent!');
      showSection('login');
    } catch (error) { showError('forgotIdentityError', 'Reset failed.'); }
  });

  // --- Auth State Observer ---
  onAuthStateChanged(auth, async (user) => {
    const authNavBtns = document.querySelectorAll('.auth-nav-btn');
    const userNavBtns = document.querySelectorAll('.user-nav-btn');
    const usernameSpan = document.getElementById('nav-username');

    if (user && user.emailVerified) {
      authNavBtns.forEach(btn => btn.style.display = 'none');
      userNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      if (usernameSpan) {
        usernameSpan.textContent = user.displayName || 'User';
        try {
          const snapshot = await get(ref(rtdb, 'users/' + user.uid));
          if (snapshot.exists() && snapshot.val().name) {
            usernameSpan.textContent = snapshot.val().name;
          }
        } catch (e) { console.error(e); }
      }
      if (!isProcessingGoogle && window.location.pathname.includes('login.html') && !sections.verify?.classList.contains('active')) {
        window.location.href = 'index.html';
      }
    } else {
      authNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      userNavBtns.forEach(btn => btn.style.display = 'none');
    }
  });

  buttons.logout?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => { window.location.href = 'index.html'; });
  });
});
