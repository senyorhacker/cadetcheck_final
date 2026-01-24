const ClientAPI = {
    API_URL: '/api',

    saveGameResult: async function (gameName, score, level) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Cannot save score: User not logged in');
            return;
        }

        try {
            const res = await fetch(`${this.API_URL}/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ game_name: gameName, score: score, level: level })
            });

            if (!res.ok) {
                console.error('Failed to save score:', await res.json());
            } else {
                console.log('Score saved successfully');
            }
        } catch (err) {
            console.error('Network error saving score:', err);
        }
    },

    getUserStats: async function () {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            // We need a route for this. let's assume /api/results/me/stats or similar
            // If it doesn't exist, we might need to create it in server/routes/results.js or auth.js
            // Let's us /api/results/stats which we should verify exists or create.
            const res = await fetch(`${this.API_URL}/results/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (err) {
            console.error('Error fetching stats:', err);
            return null;
        }
    },

    getUserProfile: async function () {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const res = await fetch(`${this.API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (err) {
            console.error('Error fetching profile:', err);
            return null;
        }
    },

    updateProfile: async function (data) {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, message: "Not logged in" };

        try {
            const res = await fetch(`${this.API_URL}/auth/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) return { success: true, ...result };
            return { success: false, ...result };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    submitFeedback: async function (data) {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, message: "Authentication required" };

        try {
            const res = await fetch(`${this.API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) return { success: true };
            return { success: false };
        } catch (err) {
            console.error("Feedback error:", err);
            return { success: false };
        }
    }
};
