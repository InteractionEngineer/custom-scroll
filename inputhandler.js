window.addEventListener('DOMContentLoaded', () => { scrollhandler() });
    window.addEventListener('resize', () => { scrollhandler() });

    function scrollhandler() {
        // DOM Elements
        const contentAreas = document.getElementsByClassName('contentarea');
        const fixedContent = document.getElementById('context-and-navdots');
        const respHeader = document.getElementById('resp-header');
        const blueTopBar = document.getElementById('topBar');
        const menuElements = document.getElementsByClassName('menu-item');
        const navHelperButtons = document.getElementsByClassName('scrollnavHelper');
        const htmlBody = document.getElementsByTagName('body')[0];
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
        const initBlueTopBarHeight = blueTopBar.clientHeight;
        const topMargin = fixedContent.offsetTop;
        const mobileWidth = window.innerWidth <= 980;

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
        let scrollControlOn = false;


        function getHeaderHeight() {
            if (!mobileWidth) return initHeaderHeight;
            else return respHeader.clientHeight;
        }

        function getTopMargin() {
            if (!mobileWidth) return topMargin;
            else return navDotsHeight; // changed depending on previous scroll
        }

        // handle a link that contains an anchor where the site scrolls to after the content is loaded
        if (window.location.hash) setScrollTargetFromHash(window.location.hash);

        // The difficult thing with TOUCHINPUT (prevent it outside of the contentareas, but allow it inside)
        function buildTouchHelper() {

            if (!document.getElementById('preventTouchHelper')) {
                const preventTouchHelper = document.createElement('div');
                preventTouchHelper.id = 'preventTouchHelper';
                preventTouchHelper.style.position = 'fixed';
                preventTouchHelper.style.right = '0';
                preventTouchHelper.style.width = window.getComputedStyle(contentAreas[0]).marginRight;
                preventTouchHelper.style.zIndex = '4'; // TODO: notwendig, um touchmove zu verhindern, blockiert aber auch die navDots, obwohl sie einen Z-Index von 5 haben

                htmlBody.appendChild(preventTouchHelper);

                initTouchHelpers();
            }

            preventTouchHelper.style.top = getHeaderHeight() + 'px';
            preventTouchHelper.style.height = `calc(100vh - ${getHeaderHeight()}px)`;
        }

        function initTouchHelpers() {

            preventTouchHelpers.push(preventTouchHelper);
            preventTouchHelpers.push(respHeader);

            for (const element of preventTouchHelpers) {
                element.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
            }
        }

        for (const element of contentAreas) {
            element.addEventListener('touchstart', handleTouchStart, { passive: true });
            element.addEventListener('touchmove', handleTouchMove, { passive: true });
        }

        function switchScrollControlOn(boolVal) {
            // Control scroll events when at boundry so that only within the contentareas can be scrolled
            for (const element of contentAreas) {
                element.removeEventListener('touchstart', handleTouchStart, { passive: boolVal });
                element.removeEventListener('touchmove', handleTouchMove, { passive: boolVal });
                element.addEventListener('touchstart', handleTouchStart, { passive: !boolVal });
                element.addEventListener('touchmove', handleTouchMove, { passive: !boolVal });
            }

            window.removeEventListener('touchstart', handleTouchStart, { passive: boolVal });
            window.removeEventListener('touchmove', handleTouchMove, { passive: boolVal });
            window.addEventListener('touchstart', handleTouchStart, { passive: !boolVal });
            window.addEventListener('touchmove', handleTouchMove, { passive: !boolVal });

            scrollControlOn = boolVal;
        }

        function handleTouchStart(e) {
            startY = e.touches[0].clientY;
        }

        function handleTouchMove(e) {
            const currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;
            startY = currentY;

            updateScrollPosition(deltaY);
        }
        // END of TOUCHINPUT logic

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

            if (prevScrollDir != currScrollDir) scrollReverseDelta++; //TODO: trifft nur ein mal zu!
            else if (scrollReverseDelta < 10 && scrollReverseDelta > 0) scrollReverseDelta--; // TODO: random value, might need to be adjusted
            else scrollReverseDelta = 0
        }

        function updateScrollPosition(deltaY) {
            const atBottom = scrollTarget.scrollTop + scrollTarget.clientHeight + spaceBeyondCurve >= scrollTarget.scrollHeight;
            const atTop = scrollTarget.scrollTop <= 0;

            checkScrollDirection(deltaY);

            // handle mobile header
            //if (mobileWidth && !atFooter) { handleMobileHeader(deltaY); }

            if (atFooter) {
                handleFooterScroll(deltaY);
                return; // prevent boundry check when already at footer
            }

            if ((atBottom && currScrollDir == scrollDir.DOWN) || (atTop && currScrollDir == scrollDir.UP)) {
                // if (mobileWidth) { if (!scrollControlOn) switchScrollControlOn(true) };
                handleBoundryScroll(deltaY); // scroll to next content area, also used on mobile
            } else {
                // if (mobileWidth) { if (scrollControlOn) switchScrollControlOn(false) }
                if (!mobileWidth) scrollTarget.scrollTop += deltaY; // scroll inside current content area - on mobile this device controls this
                accumulatedDelta = 0;
            }
        }

        function handleFooterScroll(deltaY) {
            if (currScrollDir == scrollDir.UP) accumulatedDeltaFooter += Math.abs(deltaY);
            else accumulatedDeltaFooter = 0;

            if (footerHeight < (window.innerHeight - getHeaderHeight())) {
                if (accumulatedDeltaFooter >= resistanceThresholdFooter) { resetFooterScroll(); }
            } else if (currScrollDir == scrollDir.UP && footer.getBoundingClientRect().top >= 200 && accumulatedDeltaFooter >= resistanceThresholdFooter) { resetFooterScroll(); }
            else { window.scrollBy(0, deltaY); }

            function resetFooterScroll() {
                isAnimating = true;
                atFooter = false;
                accumulatedDeltaFooter = 0;
                animateScrollToTarget(200);
                fixedContent.style.top = `${getTopMargin()}px`;
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
            else if (accumulatedDelta >= resistanceThreshold || mobileWidth) animateToSection();
            // else if (accumulatedDelta < resistanceThreshold && currScrollDir != prevScrollDir && scrollReverseDelta >= 10) animateToSection(); // TODO: does nothing because it is not a boundry scroll -> do at source (wheel event!)
            else if (!mobileWidth) window.scrollBy(0, deltaY / accumulatedDelta * 12);
        }

        function handleMobileHeader(deltaY) {
            if (currScrollDir == scrollDir.DOWN && prevScrollDir != currScrollDir) {
                let topBarAffordance = 5;
                let newHeaderHeight = initHeaderHeight - initBlueTopBarHeight + topBarAffordance;

                blueTopBar.style.height = topBarAffordance + 'px';
                for (const child of blueTopBar.children) { child.style.display = 'none'; }
                respHeader.style.height = newHeaderHeight + 'px';

                // TODO: nachfolgende contentareas haben falschen Abstand nach hoch- und runterscrollen; 
                // TODO: Nach der Ansicht des Footer akkumuliert sich der Abstand irgendwie; Nach der Ansicht des Footers taucht zuweilen die blueTopBar nicht mehr auf; 
                // TODO: Der Absatand ab der zweiten Contentarea ist etwas zu groß -> wieder alle wachsen lassen (?)
                for (element of contentAreas) { element.style.marginTop = newHeaderHeight + "px"; }
                contentAreas[currentTargetIndex].style.maxHeight = contentAreas[currentTargetIndex].clientHeight + initHeaderHeight + spaceBeyondCurve + "px";
                fixedContent.style.top = - initBlueTopBarHeight + topBarAffordance + "px";

                buildTouchHelper();

                prevScrollDir = scrollDir.DOWN;

            } else if (currScrollDir == scrollDir.UP && prevScrollDir != currScrollDir) {

                blueTopBar.style.height = initBlueTopBarHeight + 'px';
                for (const child of blueTopBar.children) { child.style.display = 'block'; }
                respHeader.style.height = initHeaderHeight + 'px';

                for (element of contentAreas) { element.style.marginTop = initHeaderHeight + "px"; }
                contentAreas[currentTargetIndex].style.maxHeight = contentAreaHeights[currentTargetIndex] + "px";
                fixedContent.style.top = `${initBlueTopBarHeight}px`;

                buildTouchHelper();

                prevScrollDir = scrollDir.UP;
            }
        }

        function animateToSection() {
            if (currScrollDir == scrollDir.DOWN) currentTargetIndex++;
            else if (currScrollDir == scrollDir.UP && currentTargetIndex > 0) currentTargetIndex--;

            isAnimating = true;
            animateScrollToTarget(800);
            accumulatedDelta = 0;
        }

        function animateToFooter() {
            let topPosition = footer.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
            window.scrollTo({ top: topPosition, behavior: 'smooth' });
            fixedContent.style.top = getTopMargin() - footerHeight + "px";

            setTimeout(() => {
                isAnimating = false;
            }, 100);
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
            for (const contentArea of contentAreas) {
                if (contentArea.id === hash.substring(1)) {
                    currentTargetIndex = Array.from(contentAreas).indexOf(contentArea);
                    scrollTarget = contentArea;
                    if (atFooter) fixedContent.style.top = `${getTopMargin()}px`;
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
            footerHeight = footer.clientHeight;

            if (mobileWidth) buildTouchHelper();

            const navDots = document.getElementById('navigation-dots').getElementsByTagName('a');
            navDotsHeight = document.getElementById('nav-dots').parentElement.clientHeight; // parent container of #navigation-dots
            for (const dot of navDots) {
                dot.addEventListener('click', (e) => setScrollTargetFromHash(e.target.hash), false);
            }
        }, 2000);
    }