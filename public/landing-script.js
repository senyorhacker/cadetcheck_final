// Loading Screen
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 2000);
    }
});

// Mobile Menu Functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const hamburger = document.querySelector('.hamburger');

    if (!mobileMenu || !mobileOverlay || !hamburger) return;

    mobileMenu.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    hamburger.classList.toggle('active');

    // Prevent body scroll when menu is open
    if (mobileMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const hamburger = document.querySelector('.hamburger');

    mobileMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
}

// Stars Animation
const canvas = document.getElementById('stars-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    const numStars = 200;

    class Star {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedY = Math.random() * 0.5 + 0.1;
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
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
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

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Shooting Stars
function createShootingStar() {
    const star = document.createElement('div');
    star.className = 'shooting-star';

    // Random color
    const colors = ['', 'gold', 'blue', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    if (randomColor) star.classList.add(randomColor);

    // Random position (start from top-right area)
    const startX = Math.random() * window.innerWidth * 0.5 + window.innerWidth * 0.5;
    const startY = Math.random() * window.innerHeight * 0.3;

    star.style.left = startX + 'px';
    star.style.top = startY + 'px';

    document.body.appendChild(star);

    // Remove after animation
    setTimeout(() => {
        star.remove();
    }, 3000);
}

// Create shooting stars periodically
function startShootingStars() {
    // Create initial shooting star
    createShootingStar();

    // Random interval between 6-15 seconds
    const nextDelay = Math.random() * 9000 + 6000;
    setTimeout(startShootingStars, nextDelay);
}

// Start shooting stars after page load
setTimeout(startShootingStars, 2000);

// Also create shooting stars on scroll (occasionally)
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Only trigger on scroll down
    if (scrollTop > lastScrollTop) {
        // 5% chance to create shooting star on scroll
        if (Math.random() < 0.05) {
            createShootingStar();
        }
    }
    lastScrollTop = scrollTop;
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Scroll to top button
    const scrollTop = document.getElementById('scrollTop');
    if (window.scrollY > 300) {
        scrollTop.classList.add('visible');
    } else {
        scrollTop.classList.remove('visible');
    }

    // Features scroll animation
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        const rect = feature.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
            feature.classList.add('visible');
        }
    });
});

// Testimonial Slider
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial');
const dots = document.querySelectorAll('.dot');
const totalTestimonials = testimonials.length;

function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
        testimonial.classList.remove('active', 'prev');
        if (i === index) {
            testimonial.classList.add('active');
        } else if (i < index) {
            testimonial.classList.add('prev');
        }
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextTestimonial() {
    currentTestimonial = (currentTestimonial + 1) % totalTestimonials;
    showTestimonial(currentTestimonial);
}

// Auto-advance testimonials every 5 seconds
setInterval(nextTestimonial, 5000);

// Manual dot navigation
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentTestimonial = index;
        showTestimonial(currentTestimonial);
    });
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Modal functions
function openModal(tab = 'login') {
    document.getElementById('authModal').classList.add('active');
    switchTab(tab);
}

function closeModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchTab(tabName) {
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('.modal-tab');
    if (tabName === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-tab').classList.add('active');
    } else if (tabName === 'register') {
        tabs[1].classList.add('active');
        document.getElementById('register-tab').classList.add('active');
    } else if (tabName === 'admin') {
        document.getElementById('admin-tab').classList.add('active');
    }
}

const API_URL = '/api';

// Auth State
const isAuthenticated = () => !!localStorage.getItem('token');

// Game Access Control - Redirect to signup if not authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Intercept Game Links on Landing Page
    const gameLinks = document.querySelectorAll('.test-card .btn-primary');
    gameLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (!isAuthenticated()) {
                e.preventDefault();
                window.location.href = 'signup.html'; // Silent redirect, no alert
            }
        });
    });

    // Update UI based on Auth
    if (isAuthenticated()) {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <a href="dashboard.html" class="btn btn-primary" style="text-decoration: none;">Dashboard</a>
                <a href="#" onclick="logout()" class="btn btn-outline" style="text-decoration: none;">Logout</a>
            `;
        }
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

async function handleLogin(e) {
    e.preventDefault();
    // Check if we are on the login page (using IDs) or modal (using form elements)
    // The modal uses specific input structure, let's just grab values generic way if possible, 
    // BUT the login.html uses IDs.

    // Let's assume this function handles BOTH if we are careful.
    // However, login.html form doesn't call this function directly via onsubmit usually... 
    // Wait, login.html form action was removed/changed? No, I only added IDs.
    // I need to update login.html to call handleLogin(event) instead of action form submission.

    // Actually, let's just implement the logic to grab from IDs first (for login.html) and fallback (for modal).
    let email = document.getElementById('loginEmail')?.value;
    let password = document.getElementById('loginPass')?.value;

    // If inside modal (index.html), inputs might be different.
    if (!email) {
        // Fallback for modal inputs
        const inputs = e.target.querySelectorAll('input');
        email = inputs[0].value;
        password = inputs[1].value;
    }

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'admin') {
                window.location.href = 'admin-panel.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Login Error:', err);
        alert('Unable to connect to server. Please check your internet connection or try again later.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    // Assuming signup.html IDs
    const full_name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPass')?.value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Welcome to the Community!');
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Server connection failed');
    }
}

function handleAdminLogin(e) {
    // Reusing handleLogin logic effectively since the API handles role check
    handleLogin(e);
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    closeMobileMenu();
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Close modal on outside click
const authModal = document.getElementById('authModal');
if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target.id === 'authModal') {
            closeModal();
        }
    });
}

// 3D Tilt effect on test cards
document.querySelectorAll('.test-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// Add ripple effect to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});
