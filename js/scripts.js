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

    // Testimonial Slider Implementation
    const testimonialsSlider = document.querySelector('.testimonial-slider');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.querySelector('.testimonial-dots');
    const prevButton = document.querySelector('.prev-testimonial');
    const nextButton = document.querySelector('.next-testimonial');
    
    if (testimonialsSlider && testimonialSlides.length > 0) {
        let currentSlide = 0;
        const slideCount = testimonialSlides.length;
        
        // Create dots
        testimonialSlides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('testimonial-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
        
        const dots = document.querySelectorAll('.testimonial-dot');
        
        // Initial setup
        updateSlider();
        
        // Auto slide every 5 seconds
        let autoSlide = setInterval(nextSlide, 5000);
        
        // Reset timer when manually changing slides
        function resetTimer() {
            clearInterval(autoSlide);
            autoSlide = setInterval(nextSlide, 5000);
        }
        
        // Navigation buttons
        prevButton.addEventListener('click', () => {
            prevSlide();
            resetTimer();
        });
        
        nextButton.addEventListener('click', () => {
            nextSlide();
            resetTimer();
        });
        
        // Functions to control slider
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slideCount;
            updateSlider();
        }
        
        function prevSlide() {
            currentSlide = (currentSlide - 1 + slideCount) % slideCount;
            updateSlider();
        }
        
        function goToSlide(index) {
            currentSlide = index;
            updateSlider();
            resetTimer();
        }
        
        function updateSlider() {
            // Update slider position
            testimonialsSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Update active states
            testimonialSlides.forEach((slide, index) => {
                if (index === currentSlide) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
            
            // Update dots
            dots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
        
        // Add touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        testimonialsSlider.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        testimonialsSlider.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50; // minimum distance for swipe
            
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swipe left - next slide
                nextSlide();
                resetTimer();
            } else if (touchEndX - touchStartX > swipeThreshold) {
                // Swipe right - previous slide
                prevSlide();
                resetTimer();
            }
        }
    }
});
