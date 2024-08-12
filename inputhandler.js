document.addEventListener('DOMContentLoaded', function () {
    const contentAreas = document.getElementsByClassName('contentarea');
    const fixedContent = document.getElementById('context-and-navdots');
    const headerHeight = document.getElementById('resp-header').clientHeight;
    const topMargin = fixedContent.offsetTop;
    const resistanceThreshold = 200;
    const resistanceThresholdFooter = 100;

    let currentTargetIndex = 0;
    let scrollTarget = contentAreas[currentTargetIndex];
    let startY = 0;
    let accumulatedDelta = 0;
    let accumulatedDeltaFooter = 0;
    let isAnimating = false;
    let atFooter = false;

    function handleTouchStart(e) {
        if (isAnimating) return;
        startY = e.touches[0].clientY;
        accumulatedDelta = 0;
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (isAnimating) return;
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        startY = currentY;

        updateScrollPosition(deltaY);
    }

    function handleWheelEvent(e) {
        e.preventDefault();
        if (isAnimating) return;
        const deltaY = e.deltaY;
        updateScrollPosition(deltaY);
    }

    function updateScrollPosition(deltaY) {
        // + 17 to prevent unreachable scroll position (might be invisble scrollbar height)
        const atBottom = scrollTarget.scrollTop + scrollTarget.clientHeight + 17 >= scrollTarget.scrollHeight;
        const atTop = scrollTarget.scrollTop <= 0;

        if (atFooter) {
            if (deltaY < 0) accumulatedDeltaFooter += Math.abs(deltaY);

            if (accumulatedDeltaFooter >= resistanceThresholdFooter) {
                isAnimating = true;
                atFooter = false;
                accumulatedDeltaFooter = 0;
                animateScrollToTarget(400);
                fixedContent.style.top = `${topMargin}px`;
            }

            return;
        }

        if ((atBottom && deltaY > 0) || (atTop && deltaY < 0)) handleBoundryScroll(deltaY);
        else {
            // scroll inside content area
            scrollTarget.scrollTop += deltaY;
            accumulatedDelta = 0;
        }
    }

    function handleBoundryScroll(deltaY) {
        accumulatedDelta += Math.abs(deltaY);

        if (currentTargetIndex == contentAreas.length - 1 && deltaY > 0) {
            animateToFooter();
            atFooter = true;

        } else if (accumulatedDelta >= resistanceThreshold) {

            if (deltaY > 0 && currentTargetIndex < contentAreas.length - 1) currentTargetIndex++;
            else if (deltaY < 0 && currentTargetIndex > 0) currentTargetIndex--;

            isAnimating = true;
            animateScrollToTarget(800);
            accumulatedDelta = 0;

        } else window.scrollBy(0, deltaY);
    }

    function animateToFooter() {
        const footer = document.getElementById('skip-sh-footer');
        const footerHeight = footer.clientHeight;
        const topPosition = footer.getBoundingClientRect().top + window.scrollY - footerHeight;
        window.scrollTo({ top: topPosition, behavior: 'smooth' });

        fixedContent.style.top = `calc(${topMargin}px - ${footerHeight}px)`;
    }

    function animateScrollToTarget(timeout) {
        scrollTarget = contentAreas[currentTargetIndex];
        const topPosition = scrollTarget.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: topPosition, behavior: 'smooth' });
        setTimeout(() => {
            isAnimating = false;
        }, timeout);
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheelEvent, { passive: false });
});