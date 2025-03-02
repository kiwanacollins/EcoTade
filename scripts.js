document.addEventListener('DOMContentLoaded', () => {
    const counters = document.querySelectorAll('.stat-number, .market-number');
    const speed = 200; // The lower the slower

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.closest('.market')?.getAttribute('data-target') || +counter.getAttribute('data-target');
            const count = +counter.innerText;

            const increment = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };

        updateCount();
    });
});

// Mobile Navigation
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeButton = document.querySelector('.mobile-nav-close');
    const body = document.body;
    
    // Create overlay element if it doesn't exist
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        body.appendChild(overlay);
    }
    
    // Open mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            mobileNav.classList.add('active');
            overlay.classList.add('active');
            body.style.overflow = 'hidden';
        });
    }
    
    // Close mobile menu
    function closeMenu() {
        if (mobileNav) {
            mobileNav.classList.remove('active');
            overlay.classList.remove('active');
            body.style.overflow = '';
        }
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeMenu);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }
    
    // Close menu when clicking on a link
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // Animated counter for stats
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const animateCounter = (element) => {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // animation duration in milliseconds
        const step = target / (duration / 16); // 60 FPS
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        updateCounter();
    };
    
    // Intersection Observer for triggering counter animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(number => {
        observer.observe(number);
    });
    
    // Handle window resize for responsive behavior
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            mobileNav.classList.remove('active');
            overlay.classList.remove('active');
            body.style.overflow = '';
        }
    });
});
