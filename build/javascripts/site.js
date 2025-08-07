// Dynamic text rotation for hero subtitle
const dynamicTexts = [
    'Product Designer',
    'Full-Stack Developer', 
    'Rails Engineer',
    'Design Mentor',
    'Creative Technologist'
];

let currentIndex = 0;
const dynamicTextElement = document.querySelector('.dynamic-text');

function rotateText() {
    if (dynamicTextElement) {
        dynamicTextElement.style.opacity = '0';
        
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % dynamicTexts.length;
            dynamicTextElement.textContent = dynamicTexts[currentIndex];
            dynamicTextElement.style.opacity = '1';
        }, 300);
    }
}

// Start rotation after initial load
setTimeout(() => {
    setInterval(rotateText, 3000);
}, 2000);

// Smooth scroll for navigation links
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
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections and cards
document.addEventListener('DOMContentLoaded', () => {
    const elementsToAnimate = document.querySelectorAll('.section, .glass-card');
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Add subtle parallax effect to hero background
let ticking = false;
function updateParallax() {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    
    if (heroBackground && scrolled < window.innerHeight) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
    
    ticking = false;
}

function requestTick() {
    if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
    }
}

window.addEventListener('scroll', requestTick);

// Add hover effect for project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Add CSS transition for dynamic text
if (dynamicTextElement) {
    dynamicTextElement.style.transition = 'opacity 0.3s ease';
}

// Easter egg: Konami code
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    document.body.style.animation = 'rainbow 3s ease-in-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 3000);
}

// Add rainbow animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);