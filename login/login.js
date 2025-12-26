// login.js
import { auth, provider } from '../js/firebase-init.js';
import { getAdditionalUserInfo, signInWithEmailAndPassword, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const CLOUD_FUNCTION_URL = "https://us-central1-biasdetectorextension.cloudfunctions.net/createCustomToken";
// Extension IDs for Production and Testing
const EXTENSION_IDS = [
    "pncjbinbmlfgkgedabggpfgafomgjamn", // Production
    "hmfclfihpajillcjpimodmlcbchjpmfh"  // Testing
];

document.addEventListener('DOMContentLoaded', () => {
    const loginEmailBtn = document.getElementById('loginEmailBtn');
    const loginGoogleBtn = document.getElementById('loginGoogleBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorContainer = document.getElementById('error-container');
    const cardElement = document.querySelector('.card');
    const togglePassword = document.getElementById('togglePassword');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    function showUserFriendlyError(error) {
        let message = "An unknown error occurred. Please try again.";
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-credential':
                    message = "Incorrect email or password, please try again.";
                    break;
                case 'auth/too-many-requests':
                    message = "Access to this account has been temporarily disabled due to many failed login attempts.";
                    break;
                default:
                    message = "Incorrect email or password, please try again.";
            }
        }
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }

    async function handleSuccessfulLogin(isNewUser = false) {
        const user = auth.currentUser;
        if (user) {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(CLOUD_FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: idToken })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to get custom token.');
                }
                
                const data = await response.json();
                const customToken = data.customToken;
                
                if (chrome && chrome.runtime && customToken) {
                    EXTENSION_IDS.forEach(extId => {
                        chrome.runtime.sendMessage(
                            extId,
                            { action: "signInWithCustomToken", token: customToken },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    console.log(`Note: Could not send token to extension ${extId} (it might not be installed).`);
                                } else if (response?.status !== "success") {
                                    console.error(`Extension ${extId} failed to sign in:`, response?.message);
                                }
                            }
                        );
                    });
                }
            } catch (error) {
                showUserFriendlyError({ message: "Error during token exchange process." });
                return; 
            }
        }

        const message = isNewUser ? "Account Created!" : "Login Successful!";
        
        cardElement.innerHTML = `
            <div class="card-header">
                <h2>${message}</h2>
                <p>You can now close this tab.</p>
            </div>
            <div class="success-box">
                This page will redirect to the homepage in <strong id="countdown">5</strong> seconds...
            </div>
        `;

        let countdown = 5;
        const countdownElement = document.getElementById('countdown');

        const interval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            if (countdown <= 0) {
                clearInterval(interval);
                window.location.href = '../'; 
            }
        }, 1000);
    }

    async function loginWithEmail() {
        errorContainer.style.display = 'none';
        loginEmailBtn.disabled = true;
        loginEmailBtn.querySelector('.button-text').style.display = 'none';
        loginEmailBtn.querySelector('.spinner').style.display = 'inline-block';

        try {
            await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
            await handleSuccessfulLogin(false);
        } catch (err) {
            showUserFriendlyError(err);
            loginEmailBtn.disabled = false;
            loginEmailBtn.querySelector('.button-text').style.display = 'inline';
            loginEmailBtn.querySelector('.spinner').style.display = 'none';
        }
    }

    loginEmailBtn.addEventListener('click', loginWithEmail);

    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            loginWithEmail();
        }
    });

    loginGoogleBtn.addEventListener('click', async () => {
        errorContainer.style.display = 'none';
        
        // Show loading state
        loginGoogleBtn.disabled = true;
        loginGoogleBtn.querySelector('.button-content').style.display = 'none';
        loginGoogleBtn.querySelector('.spinner').style.display = 'inline-block';
        
        try {
            const result = await signInWithPopup(auth, provider);
            const additionalUserInfo = getAdditionalUserInfo(result);
            await handleSuccessfulLogin(additionalUserInfo.isNewUser);
        } catch (err) {
            showUserFriendlyError(err);
            // Reset button state on error
            loginGoogleBtn.disabled = false;
            loginGoogleBtn.querySelector('.button-content').style.display = 'flex';
            loginGoogleBtn.querySelector('.spinner').style.display = 'none';
        }
    });

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        if (type === 'password') {
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        } else {
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        }
    });
});