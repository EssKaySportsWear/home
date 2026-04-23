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
  fetchSignInMethodsForEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  linkWithCredential,
  linkWithPopup,
  unlink,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, set, get, child, query, orderByChild, equalTo, remove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Auth system initialized. If changes do not appear, please Hard Refresh (Ctrl + F5).');

  // --- UI Elements ---
  const elements = {
    sections: {
      login: document.getElementById('login-section'),
      signup: document.getElementById('signup-section'),
      forgot: document.getElementById('forgot-password-section'),
      verify: document.getElementById('verify-email-section')
    },
    buttons: {
      showSignup: document.getElementById('showSignup'),
      showLogin: document.getElementById('showLogin'),
      showForgot: document.getElementById('showForgotPwd'),
      forgotBack: document.getElementById('forgotBackToLogin'),
      loginGoogle: document.getElementById('loginGoogleBtn'),
      signupGoogle: document.getElementById('signupGoogleBtn'),
      logout: document.getElementById('nav-logout-btn'),
      userBtn: document.getElementById('nav-user-btn'),
      changeEmail: document.getElementById('changeEmailBtn'),
      verifyBack: document.getElementById('verifyBackToLogin'),
      loginBtn: document.getElementById('loginBtn'),
      signupBtn: document.getElementById('signupBtn')
    },
    forms: {
      login: document.getElementById('loginForm'),
      signup: document.getElementById('signupForm'),
      forgot: document.getElementById('forgotIdentityForm')
    },
    inputs: {
      loginEmail: document.getElementById('loginEmail'),
      signupEmail: document.getElementById('signupEmail'),
      signupName: document.getElementById('signupName')
    },
    containers: {
      loginPasswordGroup: document.getElementById('loginPasswordGroup'),
      signupPasswordWrapper: document.getElementById('signupPasswordWrapper')
    },
    messages: {
      googleDetectLogin: document.getElementById('google-detect-msg-login'),
      googleDetectSignup: document.getElementById('google-detect-msg-signup')
    },
    usernameSpan: document.getElementById('nav-username'),
    displayVerifyEmail: document.getElementById('display-verify-email')
  };

  const googleProvider = new GoogleAuthProvider();
  let verificationCheckInterval = null;
  let isProcessingGoogle = false;

  // --- Account Panel Injection ---
  const accountPanelHtml = `
    <div id="account-panel-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 1000; display: none; align-items: center; justify-content: center;">
      <div id="account-panel-card" style="background: rgba(255, 255, 255, 0.9); border-radius: 24px; padding: 40px; width: 100%; max-width: 450px; color: #1f150f; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
        <button id="close-account-panel" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 32px; margin-bottom: 24px; letter-spacing: 1px;">Account Settings</h2>
        
        <div class="account-section" style="margin-bottom: 20px;">
          <label style="font-size: 13px; font-weight: 600; opacity: 0.7; display: block; margin-bottom: 8px;">Full Name</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="acc-name" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: white;">
            <button id="btn-update-name" style="padding: 10px 15px; background: #72a5b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px;">Save</button>
          </div>
        </div>

        <div class="account-section" style="margin-bottom: 20px;">
          <label style="font-size: 13px; font-weight: 600; opacity: 0.7; display: block; margin-bottom: 8px;">Email Address</label>
          <input type="text" id="acc-email" disabled style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.05);">
        </div>

        <div id="acc-pwd-section" style="margin-bottom: 20px; display: none;">
          <label style="font-size: 13px; font-weight: 600; opacity: 0.7; display: block; margin-bottom: 8px;">New Password</label>
          <div style="display: flex; gap: 10px;">
            <input type="password" id="acc-new-pwd" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: white;">
            <button id="btn-update-pwd" style="padding: 10px 15px; background: #72a5b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px;">Change</button>
          </div>
        </div>

        <div id="acc-switch-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.05);">
          <button id="btn-switch-account" style="width: 100%; padding: 14px; background: white; border: 1px solid #72a5b8; color: #72a5b8; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
            Switch to Custom Email
          </button>
          <p id="acc-switch-info" style="font-size: 12px; opacity: 0.6; text-align: center; margin-top: 8px;">Security: Google Authenticated</p>
        </div>

        <div style="margin-top: 20px;">
          <button id="btn-delete-account" style="width: 100%; padding: 14px; background: #fff1f1; border: 1px solid #ff4d4d; color: #ff4d4d; border-radius: 12px; cursor: pointer; font-weight: 600;">Delete Account</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', accountPanelHtml);

  const panel = {
    overlay: document.getElementById('account-panel-overlay'),
    close: document.getElementById('close-account-panel'),
    name: document.getElementById('acc-name'),
    email: document.getElementById('acc-email'),
    pwdInput: document.getElementById('acc-new-pwd'),
    pwdSection: document.getElementById('acc-pwd-section'),
    btnUpdateName: document.getElementById('btn-update-name'),
    btnUpdatePwd: document.getElementById('btn-update-pwd'),
    btnSwitch: document.getElementById('btn-switch-account'),
    btnDelete: document.getElementById('btn-delete-account'),
    switchInfo: document.getElementById('acc-switch-info')
  };

  function openAccountPanel() {
    const user = auth.currentUser;
    if (!user) return;

    panel.name.value = user.displayName || '';
    panel.email.value = user.email || '';
    
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    
    if (isGoogle) {
      panel.pwdSection.style.display = 'none';
      panel.btnSwitch.textContent = 'Switch to Custom Email';
      panel.switchInfo.textContent = 'Security: Google Authenticated';
    } else {
      panel.pwdSection.style.display = 'block';
      panel.btnSwitch.textContent = 'Link Google Account';
      panel.switchInfo.textContent = 'Security: Email & Password';
    }

    panel.overlay.style.display = 'flex';
  }

  panel.close?.addEventListener('click', () => panel.overlay.style.display = 'none');
  elements.buttons.userBtn?.addEventListener('click', openAccountPanel);

  // --- Account Actions ---

  panel.btnUpdateName?.addEventListener('click', async () => {
    const newName = panel.name.value.trim();
    if (!newName) return;
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      await set(ref(rtdb, 'users/' + auth.currentUser.uid + '/name'), newName);
      if (elements.usernameSpan) elements.usernameSpan.textContent = newName;
      alert('Name updated successfully!');
    } catch (e) { alert('Update failed: ' + e.message); }
  });

  panel.btnUpdatePwd?.addEventListener('click', async () => {
    const newPwd = panel.pwdInput.value;
    if (newPwd.length < 6) { alert('Password must be at least 6 characters.'); return; }
    try {
      await updatePassword(auth.currentUser, newPwd);
      alert('Password updated successfully!');
      panel.pwdInput.value = '';
    } catch (e) { 
      if (e.code === 'auth/requires-recent-login') alert('Please log out and log in again to change password.');
      else alert('Error: ' + e.message);
    }
  });

  panel.btnDelete?.addEventListener('click', async () => {
    if (!confirm('Are you absolutely sure? This will delete your entire account and data forever.')) return;
    try {
      const uid = auth.currentUser.uid;
      await remove(ref(rtdb, 'users/' + uid));
      await deleteUser(auth.currentUser);
      alert('Account deleted.');
      window.location.href = 'index.html';
    } catch (e) { alert('Error: ' + e.message); }
  });

  panel.btnSwitch?.addEventListener('click', async () => {
    const user = auth.currentUser;
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');

    if (isGoogle) {
      // Google to Email
      if (!confirm('Are you sure you want to switch to Email login? This will remove Google access.')) return;
      const pwd = prompt('Create a new password for your email login:');
      if (!pwd || pwd.length < 6) { alert('Password required (min 6 chars)'); return; }

      try {
        const credential = EmailAuthProvider.credential(user.email, pwd);
        await linkWithCredential(user, credential);
        await unlink(user, 'google.com');
        alert('Switched to Email! Please log in again.');
        await signOut(auth);
        window.location.href = 'login.html';
      } catch (e) { alert('Switch failed: ' + e.message); }
    } else {
      // Email to Google
      if (!confirm('Link your Google account and remove your password?')) return;
      try {
        await linkWithPopup(user, googleProvider);
        alert('Google account linked! Logging you in via Google from now on.');
        panel.pwdSection.style.display = 'none';
        panel.btnSwitch.textContent = 'Switch to Custom Email';
        panel.switchInfo.textContent = 'Security: Google Authenticated';
      } catch (e) { alert('Link failed: ' + e.message); }
    }
  });

  // --- Auth & Core Logic ---

  function showSection(sectionName) {
    stopVerificationCheck();
    Object.values(elements.sections).forEach(s => s?.classList.remove('active'));
    elements.sections[sectionName]?.classList.add('active');
    hideAllErrors();
    resetDynamicUI();
  }

  function resetDynamicUI() {
    if (elements.containers.loginPasswordGroup) elements.containers.loginPasswordGroup.style.display = 'block';
    if (elements.buttons.loginBtn) elements.buttons.loginBtn.style.display = 'block';
    if (elements.messages.googleDetectLogin) elements.messages.googleDetectLogin.style.display = 'none';

    if (elements.containers.signupPasswordWrapper) elements.containers.signupPasswordWrapper.style.display = 'block';
    if (elements.buttons.signupBtn) elements.buttons.signupBtn.style.display = 'block';
    if (elements.messages.googleDetectSignup) elements.messages.googleDetectSignup.style.display = 'none';
  }

  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = message; el.style.display = 'block'; }
  }

  function hideAllErrors() {
    ['loginError', 'signupError', 'forgotIdentityError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
  }

  function stopVerificationCheck() {
    if (verificationCheckInterval) { clearInterval(verificationCheckInterval); verificationCheckInterval = null; }
  }

  async function checkEmailMethods(email, context) {
    if (!email || !email.includes('@')) { resetDynamicUI(); return; }
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      const isGoogle = methods.includes('google.com');
      if (context === 'login') {
        if (isGoogle) {
          if (elements.containers.loginPasswordGroup) elements.containers.loginPasswordGroup.style.display = 'none';
          if (elements.buttons.loginBtn) elements.buttons.loginBtn.style.display = 'none';
          if (elements.messages.googleDetectLogin) elements.messages.googleDetectLogin.style.display = 'block';
        } else { resetDynamicUI(); }
      } else if (context === 'signup') {
        if (isGoogle) {
          if (elements.containers.signupPasswordWrapper) elements.containers.signupPasswordWrapper.style.display = 'none';
          if (elements.buttons.signupBtn) elements.buttons.signupBtn.style.display = 'none';
          if (elements.messages.googleDetectSignup) elements.messages.googleDetectSignup.style.display = 'block';
        } else { resetDynamicUI(); }
      }
    } catch (error) { resetDynamicUI(); }
  }

  elements.inputs.loginEmail?.addEventListener('blur', () => checkEmailMethods(elements.inputs.loginEmail.value, 'login'));
  elements.inputs.signupEmail?.addEventListener('blur', () => checkEmailMethods(elements.inputs.signupEmail.value, 'signup'));

  elements.buttons.showSignup?.addEventListener('click', () => showSection('signup'));
  elements.buttons.showLogin?.addEventListener('click', () => showSection('login'));
  elements.buttons.showForgot?.addEventListener('click', () => showSection('forgot'));
  elements.buttons.forgotBack?.addEventListener('click', () => showSection('login'));
  elements.buttons.verifyBack?.addEventListener('click', async () => { await signOut(auth); showSection('login'); });
  elements.buttons.changeEmail?.addEventListener('click', () => showSection('signup'));

  elements.forms.login?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const email = elements.inputs.loginEmail.value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) { showError('loginError', 'Please verify your email.'); await signOut(auth); return; }
      window.location.href = 'index.html';
    } catch (error) { showError('loginError', "Error: " + error.message); }
  });

  elements.forms.signup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const name = elements.inputs.signupName.value.trim();
    const email = elements.inputs.signupEmail.value.trim();
    const password = document.getElementById('signupPassword').value;
    if (password.length < 6) { showError('signupError', 'Min 6 characters'); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await set(ref(rtdb, 'users/' + user.uid), { name, email, createdAt: new Date().toISOString() });
      await signOut(auth);
      if (elements.displayVerifyEmail) elements.displayVerifyEmail.textContent = email;
      showSection('verify');
      verificationCheckInterval = setInterval(async () => {
        try { await user.reload(); if (user.emailVerified) { stopVerificationCheck(); alert('Verified!'); window.location.href = 'index.html'; } }
        catch (err) { console.error(err); }
      }, 3000);
    } catch (error) { showError('signupError', error.message); }
  });

  async function handleGoogleSignIn() {
    isProcessingGoogle = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = ref(rtdb, 'users/' + user.uid);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, { name: user.displayName || 'Google User', email: user.email, createdAt: new Date().toISOString() });
      }
      window.location.href = 'index.html';
    } catch (error) { console.error(error); alert('Failed'); isProcessingGoogle = false; }
  }

  elements.buttons.loginGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });
  elements.buttons.signupGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });

  elements.buttons.logout?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => { window.location.href = 'index.html'; });
  });

  onAuthStateChanged(auth, async (user) => {
    const authNavBtns = document.querySelectorAll('.auth-nav-btn');
    const userNavBtns = document.querySelectorAll('.user-nav-btn');
    if (user && user.emailVerified) {
      authNavBtns.forEach(btn => btn.style.display = 'none');
      userNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      if (elements.usernameSpan) {
        elements.usernameSpan.textContent = user.displayName || 'User';
        const snapshot = await get(ref(rtdb, 'users/' + user.uid));
        if (snapshot.exists() && snapshot.val().name) elements.usernameSpan.textContent = snapshot.val().name;
      }
      if (!isProcessingGoogle && window.location.pathname.includes('login.html') && !elements.sections.verify?.classList.contains('active')) {
        window.location.href = 'index.html';
      }
    } else {
      authNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      userNavBtns.forEach(btn => btn.style.display = 'none');
    }
  });
});
