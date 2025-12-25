// signup.js
import { auth, provider } from './firebase-init.js';
import { createUserWithEmailAndPassword, getAdditionalUserInfo, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const CLOUD_FUNCTION_URL = "https://us-central1-biasdetectorextension.cloudfunctions.net/createCustomToken";
// IMPORTANT: You must replace this with your actual extension ID.
// const EXTENSION_ID = "pncjbinbmlfgkgedabggpfgafomgjamn"; // For production
const EXTENSION_ID = "hmfclfihpajillcjpimodmlcbchjpmfh"; // For testing with Bias Detector

document.addEventListener('DOMContentLoaded', () => {
    const signupEmailBtn = document.getElementById('signupEmailBtn');
    const signupGoogleBtn = document.getElementById('signupGoogleBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorContainer = document.getElementById('error-container');
    const cardElement = document.querySelector('.card');
    const backButton = document.querySelector('.back-button');
    const togglePassword = document.getElementById('togglePassword');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    const lengthReq = document.getElementById('length-req');
    const numberReq = document.getElementById('number-req');
    const specialReq = document.getElementById('special-req');

    function showUserFriendlyError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const meetsLength = password.length >= 6;
        const meetsNumber = /\d/.test(password);
        const meetsSpecial = /[!@#$%^&*]/.test(password);

        lengthReq.classList.toggle('valid', meetsLength);
        numberReq.classList.toggle('valid', meetsNumber);
        specialReq.classList.toggle('valid', meetsSpecial);
    });


    async function handleSuccessfulSignup(isNewUser = true) {
        const user = auth.currentUser;
        if (user) {
            try {
                const idToken = await user.getIdToken();

                // 1. Call your new Cloud Function to get a custom token
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

                // 2. Send the custom token to the extension
                if (chrome && chrome.runtime && customToken) {
                    chrome.runtime.sendMessage(
                        EXTENSION_ID,
                        { action: "signInWithCustomToken", token: customToken },
                        (response) => {
                            if (chrome.runtime.lastError || response?.status !== "success") {
                            console.error("Failed to sign in extension:", chrome.runtime.lastError?.message || response?.message);
                            }
                        }
                    );
                }
            } catch (error) {
                console.error("Error exchanging token:", error);
                showUserFriendlyError("Could not complete extension sign-in.");
                return; 
            }
        }
        
        if (backButton) {
            backButton.style.display = 'none';
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

    async function signUpWithEmail() {
        errorContainer.style.display = 'none';

        const isLengthValid = lengthReq.classList.contains('valid');
        const isNumberValid = numberReq.classList.contains('valid');
        const isSpecialValid = specialReq.classList.contains('valid');

        if (!isLengthValid || !isNumberValid || !isSpecialValid) {
            showUserFriendlyError("Your password does not meet all the requirements.");
            return;
        }

        signupEmailBtn.disabled = true;
        signupEmailBtn.querySelector('.button-text').style.display = 'none';
        signupEmailBtn.querySelector('.spinner').style.display = 'inline-block';

        try {
            await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
            await handleSuccessfulSignup(true);
        } catch (err) {
            let message = "An error occurred during sign up. Please try again.";
            if (err.code === 'auth/email-already-in-use') {
                message = "An account with this email already exists. Please log in.";
            } else if (err.code === 'auth/weak-password') {
                message = "Password is too weak. Please meet all the requirements.";
            }
            showUserFriendlyError(message);
            signupEmailBtn.disabled = false;
            signupEmailBtn.querySelector('.button-text').style.display = 'inline';
            signupEmailBtn.querySelector('.spinner').style.display = 'none';
        }
    }

    signupEmailBtn.addEventListener('click', signUpWithEmail);

    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            signUpWithEmail();
        }
    });

    signupGoogleBtn.addEventListener('click', async () => {
        errorContainer.style.display = 'none';
        
        // Show loading state
        signupGoogleBtn.disabled = true;
        signupGoogleBtn.querySelector('.button-content').style.display = 'none';
        signupGoogleBtn.querySelector('.spinner').style.display = 'inline-block';
        
        try {
            const result = await signInWithPopup(auth, provider);
            const additionalUserInfo = getAdditionalUserInfo(result);
            await handleSuccessfulSignup(additionalUserInfo.isNewUser);
        } catch (err) {
            showUserFriendlyError("An error occurred with Google Sign-Up. Please try again.");
            // Reset button state on error
            signupGoogleBtn.disabled = false;
            signupGoogleBtn.querySelector('.button-content').style.display = 'flex';
            signupGoogleBtn.querySelector('.spinner').style.display = 'none';
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