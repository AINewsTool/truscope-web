// change-password.js
import { auth } from '../js/firebase-init.js';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary elements
    const messageContainer = document.getElementById('message-container');
    const formContainer = document.getElementById('form-container');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const subheading = document.getElementById('subheading');
    const lengthReq = document.getElementById('length-req');
    const numberReq = document.getElementById('number-req');
    const specialReq = document.getElementById('special-req');

    function showMessage(message, isError = false) {
        messageContainer.textContent = message;
        messageContainer.className = isError ? 'error-message' : 'success-message';
        messageContainer.style.display = 'block';
    }

    // --- Password strength checker logic ---
    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
        const meetsLength = password.length >= 6;
        const meetsNumber = /\d/.test(password);
        const meetsSpecial = /[!@#$%^&*]/.test(password);

        lengthReq.classList.toggle('valid', meetsLength);
        numberReq.classList.toggle('valid', meetsNumber);
        specialReq.classList.toggle('valid', meetsSpecial);
    });

    // --- Main Logic ---
    // We need to wait for Firebase to confirm the user's login state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in.
            subheading.textContent = `Update password for ${user.email}`;

            changePasswordBtn.addEventListener('click', async () => {
                messageContainer.style.display = 'none'; // Hide previous messages

                const currentPassword = currentPasswordInput.value;
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                // --- Validation ---
                if (!currentPassword || !newPassword || !confirmPassword) {
                    showMessage("Please fill in all fields.", true);
                    return;
                }
                const isLengthValid = lengthReq.classList.contains('valid');
                const isNumberValid = numberReq.classList.contains('valid');
                const isSpecialValid = specialReq.classList.contains('valid');

                if (!isLengthValid || !isNumberValid || !isSpecialValid) {
                    showMessage("Your new password does not meet all requirements.", true);
                    return;
                }
                if (newPassword !== confirmPassword) {
                    showMessage("New passwords do not match.", true);
                    return;
                }

                changePasswordBtn.disabled = true;
                changePasswordBtn.textContent = 'Updating...';

                try {
                    // Step 1: Create a credential with the user's current password
                    const credential = EmailAuthProvider.credential(user.email, currentPassword);

                    // Step 2: Re-authenticate the user. This is a security measure.
                    await reauthenticateWithCredential(user, credential);

                    // Step 3: If re-authentication is successful, update the password
                    await updatePassword(user, newPassword);

                    formContainer.style.display = 'none';
                    showMessage("Your password has been updated successfully! The extension will use this new password on its next startup.");

                } catch (error) {
                    let friendlyMessage = "Your current password is incorrect or another error occurred. Please try again.";
                    if (error.code === 'auth/wrong-password') {
                        friendlyMessage = "The current password you entered is incorrect.";
                    } else if (error.code === 'auth/too-many-requests') {
                        friendlyMessage = "Too many attempts. Please try again later.";
                    }
                    showMessage(friendlyMessage, true);
                } finally {
                    changePasswordBtn.disabled = false;
                    changePasswordBtn.textContent = 'Update Password';
                }
            });

        } else {
            // User is not signed in.
            formContainer.style.display = 'none';
            showMessage("You must be logged in to change your password. Please log in through the extension and try again.", true);
        }
    });
});