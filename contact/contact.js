// contact.js
import { auth } from '../js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- FORM ELEMENTS ---
    const form = document.getElementById("contact-form");
    if (!form) return; // Stop if form doesn't exist

    const submitBtn = document.getElementById("submit-btn");
    const contactContainer = document.getElementById("contact-container");
    const topLeftBackButton = document.getElementById("top-left-back-button");

    // --- INPUTS & ERROR SPANS ---
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const reasonInput = document.getElementById("reason");
    const messageInput = document.getElementById("message");
    const honeypotInput = document.getElementById("honeypot"); // For spam prevention

    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const reasonError = document.getElementById("reason-error");
    const messageError = document.getElementById("message-error");

    // Pre-fill email for logged-in users
    onAuthStateChanged(auth, (user) => {
        if (user) {
            emailInput.value = user.email;
        }
    });

    // --- IMPROVEMENT 1: LIVE VALIDATION ---
    const validateEmail = () => {
        const email = emailInput.value.trim();
        if (email === "") {
            showError(emailInput, emailError, "Email address is required.");
            return false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            showError(emailInput, emailError, "Please enter a valid email format.");
            return false;
        }
        hideError(emailInput, emailError);
        return true;
    };

    const validateNotEmpty = (input, errorEl, message) => {
        if (input.value.trim() === "") {
            showError(input, errorEl, message);
            return false;
        }
        hideError(input, errorEl);
        return true;
    };
    
    // Attach validation listeners
    emailInput.addEventListener('blur', validateEmail);
    nameInput.addEventListener('blur', () => validateNotEmpty(nameInput, nameError, "Full Name is required."));
    reasonInput.addEventListener('blur', () => validateNotEmpty(reasonInput, reasonError, "Please select a reason."));
    messageInput.addEventListener('blur', () => validateNotEmpty(messageInput, messageError, "Message is required."));


    // --- IMPROVEMENT 4: ACCESSIBILITY ---
    function showError(inputEl, errorEl, message) {
        inputEl.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    function hideError(inputEl, errorEl) {
        inputEl.setAttribute('aria-invalid', 'false');
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }

    // --- FORM SUBMISSION LOGIC ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Final validation check before submitting
        const isNameValid = validateNotEmpty(nameInput, nameError, "Full Name is required.");
        const isEmailValid = validateEmail();
        const isReasonValid = validateNotEmpty(reasonInput, reasonError, "Please select a reason.");
        const isMessageValid = validateNotEmpty(messageInput, messageError, "Message is required.");

        if (!isNameValid || !isEmailValid || !isReasonValid || !isMessageValid) {
            return; // Stop submission if any field is invalid
        }
        
        // --- IMPROVEMENT 3: SPAM PREVENTION ---
        if (honeypotInput.value !== "") {
            console.log("Honeypot triggered. Likely a bot.");
            return; // Silently block submission
        }

        // --- IMPROVEMENT 2: LOADING SPINNER ---
        submitBtn.disabled = true;
        submitBtn.querySelector('.button-text').style.display = 'none';
        submitBtn.querySelector('.spinner').style.display = 'inline-block';

        const payload = {
            name: nameInput.value,
            email: emailInput.value,
            reason: reasonInput.value,
            message: messageInput.value,
        };

        try {
            const res = await fetch("https://chrome-bias-detector-contact.vercel.app/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (topLeftBackButton) topLeftBackButton.remove();
                contactContainer.innerHTML = `
                    <div class="success-box">
                        <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem 0;">Message Sent!</h2>
                        <p style="margin: 0;">Thank you for your message! We'll get back to you within 48 hours.</p>
                    </div>
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <a href="../" class="back-button">
                            <svg style="width: 20px; height: 20px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to Home
                        </a>
                    </div>`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const { error } = await res.json();
                showError(form, form.querySelector('.message.error'), "Error: " + error);
            }
        } catch (err) {
            console.error(err);
            showError(form, form.querySelector('.message.error'), "Network error, please try again later.");
        } finally {
            // Restore button on failure
            submitBtn.disabled = false;
            submitBtn.querySelector('.button-text').style.display = 'inline';
            submitBtn.querySelector('.spinner').style.display = 'none';
        }
    });
});