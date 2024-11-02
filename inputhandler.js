window.addEventListener('DOMContentLoaded', () => {
    initScrollhandler();
});

window.addEventListener('resize', () => {
    setScrollVariables();
});

// DOM Elements
let contentAreas;
let fixedContent;
let respHeader;
let menuElements;
let navHelperButtons;
let footer;
let menuLinks = [];

// DOM Element Properties
let initHeaderHeight;
let footerHeight;
let navDotsHeight;
let topMargin;

// Constant Helpers
let resistanceThreshold;
let resistanceThresholdFooter;
const scrollDir = { UP: 'up', DOWN: 'down' };
let spaceBeyondCurve;

// Variable Helpers
let currentTargetIndex;
let scrollTarget;
let accumulatedDelta;
let accumulatedDeltaFooter;
let isAnimating;
let atFooter;
let currScrollDir;
let prevScrollDir;
let scrollReverseDelta;

function initScrollhandler() {
    // DOM Elements
    contentAreas = document.getElementsByClassName('contentarea');
    fixedContent = document.getElementById('context-and-navdots');
    menuElements = document.getElementsByClassName('menu-item');
    navHelperButtons = document.getElementsByClassName('scrollnavHelper');
    footer = document.getElementById('skip-sh-footer');

    for (const element of menuElements) {
        menuLinks.push(element.getElementsByTagName('a')[0]);
    }

    // Constant Helpers
    resistanceThreshold = 200;
    resistanceThresholdFooter = 100;
    spaceBeyondCurve = 17; // to prevent unreachable scroll positions

    // Variable Helpers
    currentTargetIndex = 0;
    scrollTarget = contentAreas[currentTargetIndex];
    accumulatedDelta = 0;
    accumulatedDeltaFooter = 0;
    isAnimating = false;
    atFooter = false;
    currScrollDir = scrollDir.UP;
    prevScrollDir = scrollDir.UP;
    scrollReverseDelta = 0;

    // handle a link that contains an anchor where the site scrolls to after the content is loaded
    if (window.location.hash) setScrollTargetFromHash(window.location.hash);

    // some elements load after contentareas (where this skript is at)
    setTimeout(() => {
        const navDots = document.getElementById('navigation-dots').getElementsByTagName('a');
        for (const dot of navDots) {
            dot.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
        }
    }, 2000);

    setScrollVariables();
    scrollhandler();
}

function setScrollVariables() {
    // DOM Elements
    respHeader = document.getElementById('resp-header');

    // DOM Element Properties
    initHeaderHeight = respHeader.clientHeight;
    topMargin = fixedContent.offsetTop;

    // some elements load after contentareas (where this skript is at)
    // TODO: change to resizeObserver that listenes to navdots height != 0
    setTimeout(() => {
        footerHeight = footer.clientHeight;
        navDotsHeight = document.getElementById('nav-dots').parentElement.clientHeight; // parent container of #navigation-dots
    }, 2000);
}

function scrollhandler() {
    function handleWheelEvent(e) {
        const deltaY = e.deltaY;
        e.preventDefault();
        if (isAnimating) return;
        updateScrollPosition(deltaY);
    }

    function checkScrollDirection(deltaY) {
        prevScrollDir = currScrollDir;
        if (deltaY < 0) currScrollDir = scrollDir.UP;
        else currScrollDir = scrollDir.DOWN;

        if (prevScrollDir != currScrollDir)
            scrollReverseDelta++; //TODO: trifft nur ein mal zu!
        else if (scrollReverseDelta < 10 && scrollReverseDelta > 0)
            scrollReverseDelta--; // TODO: random value, might need to be adjusted
        else scrollReverseDelta = 0;
    }

    function updateScrollPosition(deltaY) {
        const atBottom =
            scrollTarget.scrollTop + scrollTarget.clientHeight + spaceBeyondCurve >=
            scrollTarget.scrollHeight;
        const atTop = scrollTarget.scrollTop <= 0;

        checkScrollDirection(deltaY);

        if (atFooter) {
            handleFooterScroll(deltaY);
            return; // prevent boundry check when already at footer
        }

        if (
            (atBottom && currScrollDir == scrollDir.DOWN) ||
            (atTop && currScrollDir == scrollDir.UP)
        ) {
            handleBoundryScroll(deltaY); // scroll to next content area, also used on mobile
        } else {
            scrollTarget.scrollTop += deltaY; // scroll inside current content area - on mobile this device controls this
            accumulatedDelta = 0;
        }
    }

    function handleFooterScroll(deltaY) {
        if (currScrollDir == scrollDir.UP) accumulatedDeltaFooter += Math.abs(deltaY);
        else accumulatedDeltaFooter = 0;

        if (footerHeight < window.innerHeight - initHeaderHeight) {
            if (accumulatedDeltaFooter >= resistanceThresholdFooter) {
                resetFooterScroll();
            }
        } else if (
            currScrollDir == scrollDir.UP &&
            footer.getBoundingClientRect().top >= 200 &&
            accumulatedDeltaFooter >= resistanceThresholdFooter
        ) {
            resetFooterScroll();
        } else {
            window.scrollBy(0, deltaY);
        }

        function resetFooterScroll() {
            isAnimating = true;
            atFooter = false;
            accumulatedDeltaFooter = 0;
            animateScrollToTarget(1000);
            fixedContent.style.top = `${topMargin}px`;
        }
    }

    function handleBoundryScroll(deltaY) {
        accumulatedDelta += Math.abs(deltaY);
        let atLastElement = currentTargetIndex == contentAreas.length - 1;

        if (atLastElement && currScrollDir == scrollDir.DOWN) {
            animateToFooter();
            isAnimating = true;
            atFooter = true;
        } else if (accumulatedDelta >= resistanceThreshold) animateToSection();
        else window.scrollBy(0, (deltaY / accumulatedDelta) * 12);
    }

    Math.easeInOutQuad = function (t, b, c, d) {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    function animateToSection() {
        if (currScrollDir == scrollDir.DOWN) currentTargetIndex++;
        else if (currScrollDir == scrollDir.UP && currentTargetIndex > 0) currentTargetIndex--;

        isAnimating = true;
        animateScrollToTarget(800);
        accumulatedDelta = 0;
    }

    function animateToFooter() {
        let topPosition = footer.getBoundingClientRect().top + window.scrollY - initHeaderHeight;
        const start = window.pageYOffset;
        const change = topPosition - start;
        let currentTime = 0;
        const increment = 15;
        function animateCustom1() {
            currentTime += increment;
            const val = Math.easeInOutQuad(currentTime, start, change, 1000);
            window.scrollTo(0, val);
            if (currentTime < 1000) {
                requestAnimationFrame(animateCustom1);
            } else {
                isAnimating = false;
            }
        }
        animateCustom1();
        fixedContent.style.top = topMargin - footerHeight + 'px';
    }

    function animateScrollToTarget(timeout) {
        scrollTarget = contentAreas[currentTargetIndex];
        const topPosition =
            scrollTarget.getBoundingClientRect().top + window.scrollY - initHeaderHeight;
        const start = window.pageYOffset;
        const change = topPosition - start;
        let currentTime = 0;
        const increment = 15;
        function animateCustom2() {
            currentTime += increment;
            const val = Math.easeInOutQuad(currentTime, start, change, timeout);
            window.scrollTo(0, val);
            if (currentTime < timeout) {
                requestAnimationFrame(animateCustom2);
            } else {
                isAnimating = false;
            }
        }
        animateCustom2();
    }

    function setScrollTargetFromHash(hash) {
        for (const contentArea of contentAreas) {
            if (contentArea.id === hash.substring(1)) {
                currentTargetIndex = Array.from(contentAreas).indexOf(contentArea);
                scrollTarget = contentArea;
                if (atFooter) fixedContent.style.top = `${topMargin}px`;
                // TODO: (nice to have - NO priority) scroll all content of areas above to their end, and all content of areas below to their start
                return;
            }
        }
        console.error('No matching anchor found in URL.');
        currentTargetIndex = 0;
    }

    for (const link of menuLinks) {
        link.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
    }

    for (const button of navHelperButtons) {
        button.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
    }

    // initialisation
    window.addEventListener('wheel', handleWheelEvent, { passive: false });
}