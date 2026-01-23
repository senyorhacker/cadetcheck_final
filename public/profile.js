// Profile Management Logic

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load User Data
    await loadUserProfile();

    // 2. Handle Form Submission
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleProfileUpdate);
    }
});

async function loadUserProfile() {
    if (!window.ClientAPI || !window.ClientAPI.getUserStats) { // Using existing check or new method
        // Check if we have getUserProfile
        if (!window.ClientAPI.getUserProfile) {
            console.error("ClientAPI.getUserProfile not found");
            return;
        }
    }

    try {
        const user = await window.ClientAPI.getUserProfile();
        if (user) {
            // Fill inputs
            setTextValue('fullNameInput', user.full_name);
            setTextValue('emailInput', user.email);

            // Username is not in DB schema yet, we can skip or show email prefix
            // setTextValue('usernameInput', user.email.split('@')[0]); 
        }
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword) {
        alert("Please enter your current password to save changes.");
        return;
    }

    // Password Validation
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }
        if (newPassword.length < 6) {
            alert("New password must be at least 6 characters long.");
            return;
        }
    }

    const updateData = {
        currentPassword
    };

    if (newPassword) {
        updateData.newPassword = newPassword;
    }

    try {
        const result = await window.ClientAPI.updateProfile(updateData);
        if (result.success) {
            alert("Profile updated successfully!");
            // Optional: Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert("Update failed: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Update error:", err);
        alert("An error occurred while updating profile.");
    }
}

function setTextValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}
