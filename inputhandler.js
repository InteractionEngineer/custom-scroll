document.addEventListener('DOMContentLoaded', function () {
    const contentAreas = document.getElementsByClassName('contentarea');
    const wholePage = document.getElementsByTagName('html')[0];

    let currentTargetIndex = 0;
    let scrollTarget = contentAreas[currentTargetIndex];
    let startY = 0;
    let accumulatedDelta = 0;
    let resistanceThreshold = 400;

    function handleTouchStart(e) {
        startY = e.touches[0].clientY;
        accumulatedDelta = 0;
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        startY = currentY;

        updateScrollPosition(deltaY);
    }

    function handleWheelEvent(e) {
        e.preventDefault();
        const deltaY = e.deltaY;
        updateScrollPosition(deltaY);
    }

    function updateScrollPosition(deltaY) {
        const atBottom = scrollTarget.scrollTop + scrollTarget.clientHeight >= scrollTarget.scrollHeight;
        const atTop = scrollTarget.scrollTop <= 0;

        if (atBottom && deltaY > 0 || atTop && deltaY < 0) {
            accumulatedDelta += Math.abs(deltaY);
            if (accumulatedDelta >= resistanceThreshold) {
                scrollTarget = contentAreas[currentTargetIndex];
                if (deltaY > 0 && currentTargetIndex < contentAreas.length - 1) {
                    currentTargetIndex++;
                } else if (deltaY < 0 && currentTargetIndex > 0) {
                    currentTargetIndex--;
                }
                animateScrollToTarget();
                accumulatedDelta = 0;
            } else if (accumulatedDelta >= resistanceThreshold) {
                scrollTarget = wholePage;
                scrollTarget.scrollTop += deltaY;
            }
        } else {
            scrollTarget.scrollTop += deltaY;
            accumulatedDelta = 0;
        }
    }

    function animateScrollToTarget() {
        scrollTarget = contentAreas[currentTargetIndex];
        const topPosition = scrollTarget.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: topPosition, behavior: 'smooth' });
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheelEvent, { passive: false });
});