// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the hamburger menu and mobile nav elements
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeNavBtn = document.querySelector('.mobile-nav-close');
    
    // Toggle mobile nav when hamburger is clicked
    hamburgerMenu.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
    });
    
    // Close mobile nav when the close button is clicked
    closeNavBtn.addEventListener('click', function() {
        mobileNav.classList.remove('active');
    });
    
    // Close mobile nav when clicking on a mobile nav link
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
        });
    });

    // Handle counter animations for the stats section
    animateCounters();

    // Testimonial slider functionality
    initTestimonialSlider();
});

// Function to animate the stat counters
function animateCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(statNumber => {
        const target = parseInt(statNumber.getAttribute('data-target'));
        const duration = 2000; // Animation duration in milliseconds
        const startTimestamp = performance.now();
        
        function updateCounter(timestamp) {
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for a smoother animation
            const progressEased = -Math.cos(progress * Math.PI) / 2 + 0.5;
            
            const currentValue = Math.floor(progressEased * target);
            statNumber.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                statNumber.textContent = target.toLocaleString();
            }
        }
        
        // Start the animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(updateCounter);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(statNumber);
    });
}

// Function to initialize the testimonial slider
function initTestimonialSlider() {
    const slider = document.querySelector('.testimonial-slider');
    const slides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.querySelector('.testimonial-dots');
    const prevBtn = document.querySelector('.prev-testimonial');
    const nextBtn = document.querySelector('.next-testimonial');
    
    if (!slider || !slides.length) return;
    
    let currentIndex = 0;
    
    // Create dots for pagination
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('testimonial-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    // Update dots to show active state
    function updateDots() {
        const dots = document.querySelectorAll('.testimonial-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Move to a specific slide
    function goToSlide(index) {
        currentIndex = index;
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }
    
    // Previous and next buttons
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        goToSlide(currentIndex);
    });
    
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        goToSlide(currentIndex);
    });
    
    // Auto-slide functionality
    let slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        goToSlide(currentIndex);
    }, 5000);
    
    // Pause auto-slide on hover
    const sliderContainer = document.querySelector('.testimonial-slider-container');
    sliderContainer.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    sliderContainer.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            goToSlide(currentIndex);
        }, 5000);
    });
}
