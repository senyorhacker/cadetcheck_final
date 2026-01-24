// Dashboard Logic & Animations

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Update Profile Name
    const profileNameEl = document.querySelector('.user-profile-name'); // Assuming class exists or I need to find it
    // Wait, dashboard.html structure? I should check it.
    // For now, I'll log it.
    console.log('Welcome', user.full_name);

    initStarAnimation();
    // Load Real Stats from Backend
    loadDashboardStats();

    // Profile Dropdown Toggle
    const profileTrigger = document.querySelector('.user-profile-trigger');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileTrigger && profileDropdown) {
        // Update name in trigger if possible
        // Update name and avatar
        const profileNameEl = document.getElementById('profileName');
        const profileAvatarEl = document.getElementById('profileAvatar');

        if (user.full_name) {
            if (profileNameEl) profileNameEl.textContent = user.full_name;

            if (profileAvatarEl) {
                const initials = user.full_name
                    .split(' ')
                    .map(n => n[0]) // Get first letter of each part
                    .slice(0, 2)    // Take first 2 parts max
                    .join('')
                    .toUpperCase();
                profileAvatarEl.textContent = initials;
            }
        }

        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.style.display = profileDropdown.style.display === 'flex' ? 'none' : 'flex';
        });

        document.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
        });
    }
});

async function loadDashboardStats() {
    if (!window.ClientAPI || !window.ClientAPI.getUserStats) {
        console.error("ClientAPI not found!");
        return;
    }

    const stats = await window.ClientAPI.getUserStats();
    if (!stats) return;

    // 1. Update Grid Stats
    // Elements need IDs in dashboard.html. If they don't have them, we might need to select by index or add IDs.
    // Let's assume we update content based on selectors for now or I should have added IDs to dashboard.html first.
    // Strategy: Use querySelectorAll('.stat-card') and update innerText.
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        // Total Tests
        statCards[0].querySelector('div:nth-child(2) > div:nth-child(2)').textContent = stats.totalTests || 0;
        // Avg Level (Mapping to second card "Avg Reaction" label might be wrong context but we fill slots)
        statCards[1].querySelector('div:nth-child(2) > div:nth-child(2)').textContent = stats.avgLevel || "0";
        statCards[1].querySelector('div:nth-child(2) > div:nth-child(1)').textContent = "Avg Level";
        // Highest Score (Placeholder)
        // statCards[2].querySelector('div:nth-child(2) > div:nth-child(2)').textContent = "N/A"; 
        // Streak
        statCards[3].querySelector('div:nth-child(2) > div:nth-child(2)').textContent = (stats.activeDays || 0) + " Days";
    }

    // 2. Update Recent Activity
    const activityList = document.getElementById('activityList');
    if (activityList && stats.recentActivity) {
        activityList.innerHTML = stats.recentActivity.map(act => {
            const timeStr = new Date(act.played_at).toLocaleDateString();
            return `
            <div class="activity-item">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #4A90E2;"></div>
                    <div>
                        <div style="font-weight: 500; color: #fff;">${act.game_name}</div>
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">${timeStr}</div>
                    </div>
                </div>
                <div style="font-weight: 700; color: #4A90E2;">${act.score}</div>
            </div>`;
        }).join('');
    }

    // 3. Update Chart
    if (stats.dailyTrend && stats.dailyTrend.length > 0) {
        initRealChart(stats.dailyTrend);
    }
}

// --- Feedback System ---
document.addEventListener('DOMContentLoaded', () => {
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedback = document.getElementById('closeFeedback');
    const feedbackForm = document.getElementById('feedbackForm');

    if (feedbackBtn && feedbackModal) {
        feedbackBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('hidden');
            setTimeout(() => feedbackModal.classList.add('visible'), 10);
        });

        const closeModal = () => {
            feedbackModal.classList.remove('visible');
            setTimeout(() => feedbackModal.classList.add('hidden'), 300);
        };

        if (closeFeedback) closeFeedback.addEventListener('click', closeModal);

        // Close on clicking outside (but check if clicking content)
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) closeModal();
        });

        if (feedbackForm) {
            feedbackForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Gather Data
                const testType = document.getElementById('feedbackTest').value;
                const experience = document.getElementById('feedbackExperience').value;
                const other = document.getElementById('feedbackOther').value;

                // Radio
                const ratingEl = document.querySelector('input[name="rating"]:checked');
                const rating = ratingEl ? ratingEl.value : null;

                // Checkboxes
                const issues = Array.from(document.querySelectorAll('input[name="issues"]:checked')).map(cb => cb.value);
                const suggestions = Array.from(document.querySelectorAll('input[name="suggestions"]:checked')).map(cb => cb.value);

                const data = {
                    test_type: testType,
                    general_rating: rating,
                    issues: issues,
                    experience: experience,
                    suggestions: suggestions,
                    other_comments: other
                };

                if (window.ClientAPI && window.ClientAPI.submitFeedback) {
                    const res = await window.ClientAPI.submitFeedback(data);
                    if (res.success) {
                        // Success UI
                        const contentDiv = feedbackModal.querySelector('.feedback-content');
                        if (contentDiv) {
                            contentDiv.innerHTML = `
                                <div style="text-align: center; padding: 3rem 1rem;">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                                    <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Thank You!</h3>
                                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Your feedback has been successfully submitted.</p>
                                    <button onclick="window.location.reload()" class="auth-btn" style="max-width: 200px;">Close</button>
                                </div>
                            `;
                        }
                    } else {
                        alert("Failed to submit feedback. Please try again.");
                    }
                }
            });
        }
    }
});

// --- Star Animation (Reused from Landing) ---
function initStarAnimation() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const stars = [];
    const numStars = 150;

    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedY = Math.random() * 0.3 + 0.1;
            this.opacity = Math.random();
            this.twinkleSpeed = Math.random() * 0.02;
        }

        update() {
            this.y += this.speedY;
            if (this.y > canvas.height) {
                this.y = 0;
                this.x = Math.random() * canvas.width;
            }
            this.opacity += this.twinkleSpeed;
            if (this.opacity > 1 || this.opacity < 0) {
                this.twinkleSpeed = -this.twinkleSpeed;
            }
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.opacity)})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
}

// --- Real Chart ---
function initRealChart(trendData) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    // Gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(74, 144, 226, 0.5)');
    gradient.addColorStop(1, 'rgba(74, 144, 226, 0)');

    const labels = trendData.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }));
    const data = trendData.map(d => d.avg_score || 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Performance Score',
                data: data,
                borderColor: '#4A90E2',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#0A1929',
                pointBorderColor: '#4A90E2',
                pointBorderWidth: 2,
                pointRadius: 6,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 41, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#ccc',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    // max: 100, // Remove max since scores vary
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(240, 244, 248, 0.6)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(240, 244, 248, 0.6)' }
                }
            }
        }
    });

    console.log("Chart initialized with real data");
}
