// =============================================
// 1. Smooth Scroll for Anchor Links
// =============================================
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// =============================================
// 4. Intersection Observer Fade-ins
// =============================================
(function () {
    var observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.addEventListener('DOMContentLoaded', function () {
        var elements = document.querySelectorAll('.section, .card, .project-card, .work-card');
        elements.forEach(function (el) {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    });
})();

// =============================================
// 5. Konami Code Easter Egg
// =============================================
(function () {
    var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var index = 0;

    document.addEventListener('keydown', function (e) {
        if (e.key === code[index]) {
            index++;
            if (index === code.length) {
                document.body.style.animation = 'rainbow 3s ease-in-out';
                setTimeout(function () { document.body.style.animation = ''; }, 3000);
                index = 0;
            }
        } else {
            index = 0;
        }
    });

    var style = document.createElement('style');
    style.textContent = '@keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }';
    document.head.appendChild(style);
})();
