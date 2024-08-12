document.addEventListener('DOMContentLoaded', function () {
    const wholePage = document.querySelector('#page-container');
    const contentAreas = document.querySelectorAll('.contentarea');
    const triggerDown = document.querySelectorAll('.scrolldown');
    const triggerUp = document.querySelectorAll('.scrollup');

    let currentTargetIndex = 0;
    let scrollTarget = contentAreas[currentTargetIndex];
    let startY = 0;

    function handleTouchStart(e) {
        startY = e.touches[0].clientY;
    }

    function handleTouchMove(e) {
        e.preventDefault();

        const touchY = e.touches[0].clientY;
        const deltaY = startY - touchY;
        startY = touchY;

        scrollTarget.scrollTop += deltaY;
    }

    function handleWheelEvent(e) {
        e.preventDefault();
        scrollTarget.scrollTop += e.deltaY;
    }

    const scrollDown = (e) => {
        currentTargetIndex++;
        scrollTarget = contentAreas[currentTargetIndex];
        scrollTarget.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollUp = (e) => {
        currentTargetIndex--;
        scrollTarget = contentAreas[currentTargetIndex];
        scrollTarget.scrollIntoView({ behavior: 'smooth' });
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.boundingClientRect.y > 0 && currentTargetIndex < contentAreas.length - 1 && entry.target.classList.contains('scrolldown')) {
                    scrollDown();
                }
                else if (entry.boundingClientRect.y < 0 && currentTargetIndex > 0 && entry.target.classList.contains('scrollup')) {
                    scrollUp();
                }
            }
        });
    };

    const observerOptions = {
        root: wholePage,
        rootMargin: '88px', // header's height
        threshold: 0.99
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    triggerDown.forEach(element => observer.observe(element));
    triggerUp.forEach(element => observer.observe(element));

    scrollTarget = contentAreas[0];
    wholePage.scrollTop = 0;

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheelEvent, { passive: false });
});