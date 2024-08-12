window.addEventListener('DOMContentLoaded', () => { scrollhandler() });
    window.addEventListener('resize', () => { scrollhandler() });
    // TODO: setup function, called by the scrollhandler (onLoaded) and gets refreshed after resize

    function scrollhandler() {
        // DOM Elements
        const contentAreas = document.getElementsByClassName('contentarea');
        const fixedContent = document.getElementById('context-and-navdots');
        const respHeader = document.getElementById('resp-header');
        const menuElements = document.getElementsByClassName('menu-item');
        const navHelperButtons = document.getElementsByClassName('scrollnavHelper');
        let footer; // will be set after initialisation
        let navDotsHeight; // will be set after initialisation
        let menuLinks = []; // will be filled by loop
        let contentAreaHeights = []; // will be filled by loop
        let preventTouchHelpers = []; // will be filled by touchinput logic
        for (const element of menuElements) { menuLinks.push(element.getElementsByTagName('a')[0]); }
        for (let contentArea of contentAreas) { contentAreaHeights.push(contentArea.clientHeight); }

        // DOM Element Properties
        const initHeaderHeight = respHeader.clientHeight;
        let footerHeight; // will be set after initialisation
        const topMargin = fixedContent.offsetTop;

        // Constant Helpers
        const resistanceThreshold = 200;
        const resistanceThresholdFooter = 100;
        const scrollDir = { UP: 'up', DOWN: 'down' };
        const spaceBeyondCurve = 17; // to prevent unreachable scroll positions

        // Variable Helpers
        let currentTargetIndex = 0;
        let scrollTarget = contentAreas[currentTargetIndex];
        let startY = 0;
        let accumulatedDelta = 0;
        let accumulatedDeltaFooter = 0;
        let isAnimating = false;
        let atFooter = false;
        let currScrollDir = scrollDir.UP;
        let prevScrollDir = scrollDir.UP;
        let scrollReverseDelta = 0;

        // handle a link that contains an anchor where the site scrolls to after the content is loaded
        if (window.location.hash) setScrollTargetFromHash(window.location.hash);

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

            if (prevScrollDir != currScrollDir) scrollReverseDelta++; //TODO: trifft nur ein mal zu!
            else if (scrollReverseDelta < 10 && scrollReverseDelta > 0) scrollReverseDelta--; // TODO: random value, might need to be adjusted
            else scrollReverseDelta = 0
        }

        function updateScrollPosition(deltaY) {
            const atBottom = scrollTarget.scrollTop + scrollTarget.clientHeight + spaceBeyondCurve >= scrollTarget.scrollHeight;
            const atTop = scrollTarget.scrollTop <= 0;

            checkScrollDirection(deltaY);

            if (atFooter) {
                handleFooterScroll(deltaY);
                return; // prevent boundry check when already at footer
            }

            if ((atBottom && currScrollDir == scrollDir.DOWN) || (atTop && currScrollDir == scrollDir.UP)) {
                handleBoundryScroll(deltaY); // scroll to next content area, also used on mobile
            } else {
                scrollTarget.scrollTop += deltaY; // scroll inside current content area - on mobile this device controls this
                accumulatedDelta = 0;
            }
        }

        function handleFooterScroll(deltaY) {
            if (currScrollDir == scrollDir.UP) accumulatedDeltaFooter += Math.abs(deltaY);
            else accumulatedDeltaFooter = 0;

            if (footerHeight < (window.innerHeight - initHeaderHeight)) {
                if (accumulatedDeltaFooter >= resistanceThresholdFooter) { resetFooterScroll(); }
            } else if (currScrollDir == scrollDir.UP && footer.getBoundingClientRect().top >= 200 && accumulatedDeltaFooter >= resistanceThresholdFooter) { resetFooterScroll(); }
            else { window.scrollBy(0, deltaY); }

            function resetFooterScroll() {
                isAnimating = true;
                atFooter = false;
                accumulatedDeltaFooter = 0;
                animateScrollToTarget(200);
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
            }
            else if (accumulatedDelta >= resistanceThreshold) animateToSection();
            else window.scrollBy(0, deltaY / accumulatedDelta * 12);
        }

        function animateToSection() {
            if (currScrollDir == scrollDir.DOWN) currentTargetIndex++;
            else if (currScrollDir == scrollDir.UP && currentTargetIndex > 0) currentTargetIndex--;

            isAnimating = true;
            animateScrollToTarget(800);
            accumulatedDelta = 0;
        }

        function animateToFooter() {
            let topPosition = footer.getBoundingClientRect().top + window.scrollY - initHeaderHeight;
            window.scrollTo({ top: topPosition, behavior: 'smooth' });
            fixedContent.style.top = topMargin - footerHeight + "px";

            setTimeout(() => {
                isAnimating = false;
            }, 100);
        }

        function animateScrollToTarget(timeout) {
            scrollTarget = contentAreas[currentTargetIndex];
            const topPosition = scrollTarget.getBoundingClientRect().top + window.scrollY - initHeaderHeight;
            window.scrollTo({ top: topPosition, behavior: 'smooth' });
            setTimeout(() => {
                isAnimating = false;
            }, timeout);
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
        document.addEventListener('wheel', handleWheelEvent, { passive: false });

        // some elements load after contentareas (where this skript is at)
        // TODO: change to while loop (non blocking) until navdots height != 0
        setTimeout(() => {
            footer = document.getElementById('skip-sh-footer');
            footerHeight = footer.clientHeight; // TODO: move to setup method later

            const navDots = document.getElementById('navigation-dots').getElementsByTagName('a');
            navDotsHeight = document.getElementById('nav-dots').parentElement.clientHeight; // parent container of #navigation-dots
            for (const dot of navDots) {
                dot.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
            }
        }, 2000);
    }