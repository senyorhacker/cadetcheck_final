// CadetCheck Landing Page JavaScript

// FAQ Accordion
document.addEventListener('DOMContentLoaded', function () {
    // FAQ Accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });

    // Testimonial carousel dots functionality
    const dots = document.querySelectorAll('.dot');
    const testimonialTrack = document.querySelector('.testimonial-track');
    let currentIndex = 0;
    const totalCards = 6; // Total unique testimonials

    function updateActiveDot(index) {
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
    }

    // Auto-update dots based on animation
    setInterval(() => {
        currentIndex = (currentIndex + 1) % totalCards;
        updateActiveDot(currentIndex);
    }, 5000); // Update every 5 seconds (match with animation timing)

    dots.forEach(dot => {
        dot.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'));
            currentIndex = index;
            updateActiveDot(index);

            // Calculate offset
            const cardWidth = 350 + 30; // card width + gap
            const offset = -index * cardWidth;

            // Temporarily pause animation and jump to position
            testimonialTrack.style.animation = 'none';
            testimonialTrack.style.transform = `translateX(${offset}px)`;

            // Resume animation after a moment
            setTimeout(() => {
                testimonialTrack.style.animation = '';
            }, 100);
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(30px)';
                entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections for animations
    document.querySelectorAll('.feature, .game-card, .faq-item').forEach(element => {
        observer.observe(element);
    });

    // Add stagger effect to game cards
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 150));
    });

    // Pause testimonial carousel on hover
    const carousel = document.querySelector('.testimonial-track');
    if (carousel) {
        carousel.addEventListener('mouseenter', function () {
            this.style.animationPlayState = 'paused';
        });

        carousel.addEventListener('mouseleave', function () {
            this.style.animationPlayState = 'running';
        });
    }
});

// Add parallax effect to clouds on scroll
window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    const clouds = document.querySelectorAll('.cloud');

    clouds.forEach((cloud, index) => {
        const speed = 0.1 + (index * 0.05);
        cloud.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Performance optimization: Reduce motion for users who prefer it
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('*').forEach(element => {
        element.style.animation = 'none';
        element.style.transition = 'none';
    });
}
