// forgot-password.js
import { auth } from '../js/firebase-init.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const sendLinkBtn = document.getElementById('sendLinkBtn');
    const emailInput = document.getElementById('emailInput');
    const messageContainer = document.getElementById('message-container');
    const formContainer = document.getElementById('form-container');

    // This function is now much cleaner
    function showMessage(message, isError = false) {
        messageContainer.textContent = message;
        messageContainer.className = isError ? 'error-message' : 'success-message';
        messageContainer.style.display = 'block';
    }

    sendLinkBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        
        if (!email) {
            showMessage("Please enter your email address.", true);
            return;
        }

        try {
            sendLinkBtn.disabled = true;
            sendLinkBtn.textContent = 'Sending...';

            await sendPasswordResetEmail(auth, email);
            
            formContainer.style.display = 'none';
            showMessage("Success! If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");

        } catch (error) {
            let friendlyMessage = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/invalid-email') {
                friendlyMessage = "The email address is not valid. Please check it and try again.";
            } else if (error.code === 'auth/user-not-found') {
                 formContainer.style.display = 'none';
                 showMessage("Success! If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
                 return;
            }
            
            showMessage(friendlyMessage, true);
        } finally {
            if (formContainer.style.display !== 'none') {
               sendLinkBtn.disabled = false;
               sendLinkBtn.textContent = 'Send Reset Link';
            }
        }
    });
});