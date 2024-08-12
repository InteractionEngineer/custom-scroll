document.addEventListener('DOMContentLoaded', function () {
    const contentAreas = document.getElementsByClassName('contentarea');
    const fixedContent = document.getElementById('context-and-navdots');
    const respHeader = document.getElementById('resp-header');
    const menuElements = document.getElementsByClassName('menu-item');
    const menuLinks = [];

    for (const element of menuElements) {
        menuLinks.push(element.getElementsByTagName('a')[0]);
    }

    const headerHeight = respHeader.clientHeight;
    const topMargin = fixedContent.offsetTop;
    const resistanceThreshold = 200;
    const resistanceThresholdFooter = 100;
    const scrollDir = { UP: 'up', DOWN: 'down' };
    const blueTopBar = 52;

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

    function handleTouchStart(e) {
        if (isAnimating) return;
        startY = e.touches[0].clientY;
        accumulatedDelta = 0;
    }

    function handleTouchMove(e) {
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        if (deltaY != 0 && e.cancelable) try { e.preventDefault(); } catch (e) { console.info(e); }
        if (isAnimating) return;

        startY = currentY;
        updateScrollPosition(deltaY);
    }

    function handleWheelEvent(e) {
        const deltaY = e.deltaY;
        if (deltaY != 0) e.preventDefault();
        if (isAnimating) return;
        updateScrollPosition(deltaY);
    }

    function checkScrollDirection(deltaY) {
        prevScrollDir = currScrollDir;
        if (deltaY < 0) currScrollDir = scrollDir.UP;
        else currScrollDir = scrollDir.DOWN;

        if (prevScrollDir != currScrollDir) scrollReverseDelta++;
        else if (scrollReverseDelta < 10 && scrollReverseDelta > 0) scrollReverseDelta--; // TODO: random value, might need to be adjusted
        else scrollReverseDelta = 0
    }

    function updateScrollPosition(deltaY) {
        // + 17 to prevent unreachable scroll position (might be invisble scrollbar height)
        const atBottom = scrollTarget.scrollTop + scrollTarget.clientHeight + 17 >= scrollTarget.scrollHeight;
        const atTop = scrollTarget.scrollTop <= 0;

        checkScrollDirection(deltaY);

        // handle mobile header
        if (window.innerWidth < 980) { handleMobileHeader(deltaY); }

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

        if ((atBottom && deltaY > 0) || (atTop && deltaY < 0)) {
            handleBoundryScroll(deltaY);
            console.log("scrolling window");
        } else {
            // scroll inside content area
            scrollTarget.scrollTop += deltaY;
            accumulatedDelta = 0;
            console.log("scrolling inside " + currentTargetIndex)
        }
    }

    // TODO: Logik unvollständig, noch mal wach drüber nachdenken.
    function getHeaderHeight() {
        if (window.innerWidth > 980) return headerHeight;
        else return headerHeight - blueTopBar;
    }

    function handleBoundryScroll(deltaY) {
        accumulatedDelta += Math.abs(deltaY);

        if (currentTargetIndex == contentAreas.length - 1 && deltaY > 0) {
            animateToFooter();
            atFooter = true;
        }
        else if (accumulatedDelta >= resistanceThreshold) animateToSection(deltaY);
        else if (accumulatedDelta < resistanceThreshold && currScrollDir != prevScrollDir && scrollReverseDelta >= 10) animateToSection(deltaY); // TODO: does nothing because it is not a boundry scroll
        else window.scrollBy(0, deltaY);
    }

    function handleMobileHeader(deltaY) {
        if (currScrollDir == scrollDir.DOWN && prevScrollDir != currScrollDir) {

            respHeader.style.top = `${-blueTopBar}px`;

            for (let i = 0; i < contentAreas.length - 1; i++) {
                let currentTopMargin = 140;
                contentAreas[i].style.marginTop = `${currentTopMargin - blueTopBar}px`;
            }
            fixedContent.style.top = `${-blueTopBar}px`;
            //TODO: noch ungetestet
            //prevScrollDir = scrollDir.DOWN;

        } else if (currScrollDir == scrollDir.UP && prevScrollDir != currScrollDir) {

            respHeader.style.top = '0px';

            for (let i = 0; i < contentAreas.length - 1; i++) {
                let currentTopMargin = 140 - blueTopBar;
                contentAreas[i].style.marginTop = `${currentTopMargin + blueTopBar}px`;
            }
            fixedContent.style.top = `${blueTopBar}px`;

            //prevScrollDir = scrollDir.UP;
        }
    }

    function animateToSection(deltaY) {
        if (deltaY > 0 && currentTargetIndex < contentAreas.length - 1) currentTargetIndex++;
        else if (deltaY < 0 && currentTargetIndex > 0) currentTargetIndex--;
        else return; // new, possible cause of error

        isAnimating = true;
        animateScrollToTarget(800);
        accumulatedDelta = 0;
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
        const topPosition = scrollTarget.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
        window.scrollTo({ top: topPosition, behavior: 'smooth' });
        setTimeout(() => {
            isAnimating = false;
        }, timeout);
    }

    function setScrollTargetFromHash(hash) {
        console.log("setScrollTargetFromHash: " + hash);
        for (const contentArea of contentAreas) {
            if (contentArea.id === hash.substring(1)) {
                currentTargetIndex = Array.from(contentAreas).indexOf(contentArea);
                scrollTarget = contentArea;
                console.log("currentTargetIndex: " + currentTargetIndex);
                if (atFooter) fixedContent.style.top = `${topMargin}px`;
                // TODO: scroll all content of areas above to their end, and all content of areas below to their start
                return;
            }
        }
        console.error('No matching anchor found in URL.');
        currentTargetIndex = 0;
    }

    for (const link of menuLinks) {
        link.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheelEvent, { passive: false });
    setTimeout(() => { // ugly, but skript-injected navdots load after contentareas (where this skript is at)
        const navDots = document.getElementById('navigation-dots').getElementsByTagName('a');
        console.log("navdots" + navDots);
        for (const dot of navDots) {
            dot.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
        }
    }, 2000);
});