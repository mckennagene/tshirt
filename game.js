
class Game {
    constructor() {
        this.browserHeight = document.documentElement.clientHeight;
        this.browserWidth = document.documentElement.clientWidth;
        this.KITE_SIZE = 15;
        //console.log("height of your browser window is " + this.browserHeight);
        let y = Math.floor(this.browserHeight / (15 * 2 * Math.sqrt(3)));
        let x = Math.floor(this.browserHeight / (15 * 4));

        this.levels;
        this.setLevels();
        this.currentLevel = 0;
        this.confettiDisplayingCurrently = false;

        const searchParams = new URLSearchParams(window.location.search);
        const l = searchParams.get('level');
        const ins = searchParams.get('ins');
        if (l) { this.currentLevel = l };
        if (ins === "skip") { this.currentLevelSkipInstructions = true; console.log("skip instructions"); }
        else { this.currentLevelSkipInstructions = false; }

        this.puzzle = new Puzzle(this);
        this.initializeGameControls();
        this.clickAnimationCount = 0;
        this.gameCompletionCheckCount = 0;
    }
    playGame() {
        this.playNextGameLevel();
    }

    addNavivationOption(menu, lessonNumber, symbol) {
        const linkElement = document.createElement("a");
        linkElement.href = "index.html?level=" + lessonNumber;
        const linkTextNode = document.createTextNode(symbol);
        linkElement.appendChild(linkTextNode);
        const spaceNode = document.createTextNode(" ");
        const spaceNode2 = document.createTextNode(" ");
        //const pipeNode = document.createTextNode("|");
        menu.appendChild(spaceNode);
        menu.appendChild(linkElement);
        menu.appendChild(spaceNode2);
    }
    displayHelpDialog() {
        // hide the canvas, tray and canvas-expander button again
        const canvasDiv = document.getElementById("canvas-container");
        const trayDiv = document.getElementById("tray");
        const helpBtn = document.getElementById("help");
        canvasDiv.style.display = 'none';
        trayDiv.style.display = 'none';
        this.toolTray.style.display = 'none';
        helpBtn.style.display = 'none';
        this.gear.style.display = 'none';
        this.gearimg.style.display = 'none';
        this.scoreBoard.style.display = 'none';

        // unhide the appropriate level div
        let id = "level" + this.currentLevel;
        const levelDiv = document.getElementById(id);
        const parentTabNumber = levelDiv.getAttribute("data-group");
        //if (levelDiv) { console.log("got level div id= " + id); }
        //else { console.log("failed to find " + id); }
        levelDiv.style.display = "block";

        // remove any previous tabs and select elements added by this function
        const previousTabs = document.querySelectorAll('.tab');
        for (let i = 0; i < previousTabs.length; i++) {
            const element = previousTabs[i];
            element.remove();
        }
        const previousNavs = document.querySelectorAll('.navigation-select');
        for (let i = 0; i < previousNavs.length; i++) {
            const element = previousNavs[i];
            element.remove();
        }

        // Create a new parent select menu to group the level selection so it isn't 1 giant list.

        const tabNames = ['Beginner: Tools', 'Intermediate: Shapes', 'Advanced: Strategy'];
        const tabLinks = ['index.html?level=0', 'index.html?level=8', 'index.html?level=14'];

        const tabContainer = document.createElement('div');
        tabContainer.className = 'level-tabs';
        //level0.insertBefore(tabContainer, levelContent);
        tabNames.forEach((tabName, index) => {
            const tabLink = document.createElement('a');
            tabLink.href = tabLinks[index];
            const tab = document.createElement('div');
            tab.className = 'tab';
            tab.innerText = tabName;
            if (parentTabNumber == 0 && tabName === tabNames[0]) {
                tab.classList.add('active');
            }
            else if (parentTabNumber == 1 && tabName === tabNames[1]) {
                tab.classList.add('active');
            }
            else if (parentTabNumber == 2 && tabName === tabNames[2]) {
                tab.classList.add('active');
            }
            tabLink.appendChild(tab);
            tabContainer.appendChild(tabLink);
        });


        const selectChild = document.createElement("select");
        selectChild.setAttribute("class", "navigation-select");

        for (let l = 0; l < this.levels.length; l++) {
            const levDiv = document.getElementById("level" + l.toString());
            let group = levDiv.getAttribute("data-group");
            if (group === parentTabNumber) {
                //if (this.levels[l].controls.play != "skip") {
                const optionElem = document.createElement("option");
                optionElem.value = l;
                optionElem.textContent = levDiv.getAttribute("data-title");
                if (l === parseInt(this.currentLevel)) { optionElem.selected = true; }
                //console.log("setting option v=" + l + " and l=" + levDiv.getAttribute("title"));
                selectChild.appendChild(optionElem);
                //}
            }
        };

        // Add the tabs and select elements as the first elements of the levelDiv 
        levelDiv.insertAdjacentElement("afterbegin", selectChild);
        levelDiv.insertAdjacentElement("afterbegin", tabContainer);
        selectChild.addEventListener("change", function () {
            const selectedOptionValue = this.value;
            const newUrl = `index.html?level=${selectedOptionValue}`;
            window.location.href = newUrl;
        });
    }



    playNextGameLevel() {

        // if skip instructions is set, then skip it, but reset this back to false so we only skip it once
        if (!this.currentLevelSkipInstructions) { this.displayHelpDialog(); }
        else { this.showToolTray(); }
        this.currentLevelSkipInstructions = false;

        // create a puzzle with the specified level settings
        let canvasSize = { x: document.documentElement.clientWidth, y: document.documentElement.clientHeight };
        // don't let canvas width exceed canvas height by more then 1.5
        if (canvasSize.x > 1.5 * canvasSize.y) { canvasSize.x = canvasSize.y * 1.5; }
        //console.log("playNextGameLevel: " + this.currentLevel + " showHintsDefault=" + this.levels[this.currentLevel].showHintsDefault);
        let zoom = 1;
        if (this.levels[this.currentLevel].zoom) { 
            zoom = this.levels[this.currentLevel].zoom; 
        }

        // explode the targets passed from shapes at different levels to just the lowest level shadows
        // so we can tell when the puzzle is completed 
        let x = this.levels[this.currentLevel].targets;
        //if(x){console.log("there are " + x.length + " targets");}
        this.targets = Shape.createShapeArray(this.puzzle, x);
        this.shadows = []; 
        if( this.targets ) { 
            for (let s of this.targets) { this.shadows = this.shadows.concat(s.getAllShadows()); }
            this.targetShadowCount = this.shadows.length;
        }
        
        this.puzzle.resetPuzzle(
            this.levels[this.currentLevel].gridSize,
            this.levels[this.currentLevel].buffer == null ? 2 : this.levels[this.currentLevel].buffer,
            zoom,
            Puzzle.palette[0],
            this.targets,
            this.levels[this.currentLevel].controls.badNeighbors,
            this.levels[this.currentLevel].controls.surroundColor,
            this.levels[this.currentLevel].controls.sideKickColor,
            this.levels[this.currentLevel].controls.showKites,
            this.levels[this.currentLevel].controls.autoDrawShape,
            this.levels[this.currentLevel].controls.autoDrawLevel,
            this.levels[this.currentLevel].showHintsDefault,
            this.levels[this.currentLevel].showMetaHints
        );

        // hide all tools then open the ones we are told to
        this.hideAllTools();
        if (this.levels[this.currentLevel].tools) {
            for (let t of this.levels[this.currentLevel].tools) {
                this.showTools(t);
            }
        }

        // adjust the controls the way we want.
        if (this.levels[this.currentLevel].controls) {
            if (this.levels[this.currentLevel].controls.tray === "open") { this.openTrayBtn(); }
            else { this.closeTrayBtn(); }
            if (this.levels[this.currentLevel].controls.rotate === "on") { this.showRotate(); }
            else { this.hideRotate(); }
            if (this.levels[this.currentLevel].controls.flip === "on") { this.showFlip(); }
            else { this.hideFlip(); }
            if (this.levels[this.currentLevel].controls.grid === "on") { this.showGrid(); }
            else { this.hideGrid(); }
            if (this.levels[this.currentLevel].controls.zoom === "on") { this.showZoom(); }
            else { this.hideZoom(); }
            if (this.levels[this.currentLevel].controls.dots === "on") { this.showDots(); }
            else { this.hideDots(); }
            if (this.levels[this.currentLevel].controls.gear === "on") { this.showGear(); }
            else { this.hideGear(); }
            if (this.levels[this.currentLevel].controls.saveLoad === "on") { this.showSaveLoad(); }
            else { this.hideSaveLoad(); }
        }

        // let adding begin again
        this.puzzle.resumeAdding();
    }

    completedMove(numberTs, prcntComplete, trisFilled) {
        //console.log("in completed move, current level is " + this.currentLevel + " current confetti=" + this.confettiDisplayingCurrently);
        this.gameCompletionCheckCount++;
        const complete = this.levels[this.currentLevel].complete;
        let kitesFilled = trisFilled / 2;
        // once we have a t-shirt, stop the animation on level1
        if (numberTs > 0) {
            this.clickAnimationCount = 10;
            this.clickAnimationCycled();
        }

        let isComplete = false;

        if (complete === "percentTiled") {
            this.scoreBoard.style.display = "block";
            let klabel = " Kites : "; if (kitesFilled == 1) { klabel = " Kite : "; }
            let tlabel = " T's : "; if (numberTs == 1) { tlabel = " T : "; }
            let text = numberTs + tlabel + kitesFilled + klabel + prcntComplete + "% Filled";// k=" + kitesFilled;
            this.score.innerHTML = text;
            if (prcntComplete + 0.25 >= 100) { isComplete = true; }
        } else {
            this.scoreBoard.style.display = "none";
            this.score.innerHTML = "";
        }

        if (complete === "shadows" && this.targets) {
            //console.log("level# " + this.currentLevel + " has " + this.targetShadowCount + " targets.");
            let shadowMatches = new Set();
            // do >= in case the user slides in one more t-shirt after they clear the level
            if (this.puzzle.getNumberOfTShirts() >= this.targets.length) {
                for (let t of this.puzzle.getTShirts()) {
                    for (let s of this.shadows) {
                        //console.log("tshirt: " + t.id + " @"  + t.gridX   + "," + t.gridY + " h:" + t.heading + " f:" + t.flip);
                        //console.log("shadow: " + s.id + " @ " + s.x       + "," + s.y     + " h:" + s.heading + " f:" + s.flip);
                        if (s.x == t.gridX && s.y == t.gridY && s.heading == t.heading && s.flip == t.flip) {
                            //console.log("found a shadow filled in: " + t.id);
                            shadowMatches.add(t);
                        }
                    }
                }
            }
            if (shadowMatches.size >= this.targetShadowCount) {
                isComplete = true;
            }// else { console.log("sorry, " + shadowMatches.size + " shadows vs " + this.targetShadowCount); }
        } else if (complete === "badNeighbors" && this.levels[this.currentLevel].badNeighbors) {
            //console.log("level doesn't have shadows, it has bad neighbors");
            if (this.puzzle.getBadNeighborCount() >= this.levels[this.currentLevel].badNeighbors) {
                //console.log("right # of bad neighbors: " + this.puzzle.getBadNeighborCount() + " expecting " + this.levels[this.currentLevel].badNeighbors);
                isComplete = true;
            } //else { 
            //  console.log("wrong # of bad neighbors: " + this.puzzle.getBadNeighborCount() + " expecting " + this.levels[this.currentLevel].badNeighbors);
            //}
        } else if (complete === "surround" && this.levels[this.currentLevel].surround) {
            //console.log("level wants surrounded top");
            let surroundCount = 0;
            let topCount = 0;
            for (let t of this.puzzle.getTShirts()) {
                if (t.surround) { surroundCount++; }
                if (t.flip === TShirt.FLIP.TOP) { topCount++; }
                //console.log("tshirt:" + t.id + " surround=" + t.surround + " sCount=" + surroundCount + 
                //" tCount=" + topCount );
            }
            if (topCount >= 1 && surroundCount >= topCount * this.levels[this.currentLevel].surround) {
                // console.log("right # of surround neighbors");
                isComplete = true;
            }// else { console.log("wrong # surround neighbors: " + surroundCount + " vs " + this.levels[this.currentLevel].surround); }
        }
        if (isComplete && !this.confettiDisplayingCurrently) {
            this.confettiDisplayingCurrently = true;
            //console.log("CONGRATS you finished level " + this.currentLevel);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => {
                this.currentLevel++;
                this.playNextGameLevel();
                this.confettiDisplayingCurrently = false;
                //console.log("done waiting, current level is now " + this.currentLevel + " and 
                //confettiCurrent = " + this.confettiDisplayingCurrently);
            }, 3000);
            //console.log("outside wait call, current level is now " + this.currentLevel + " and 
            // confettiCurrent = " + this.confettiDisplayingCurrently);
            return isComplete && this.confettiDisplayingCurrently;
        } //else { 
        //  console.log("not complete, keep trying:" + this.puzzle.getBadNeighborCount() 
        //      + " bad neighbors vs " +  this.levels[this.currentLevel].badNeighbors); 
        // }
        return isComplete && this.confettiDisplayingCurrently;
    }

    initializeGameControls() {
        // the level dialogs
        // get all elements with class "level-dialog"
        const levelDialogs = document.querySelectorAll('.level-dialog');
        // loop through levelDialogs and add event listener to "ok-button"
        for (let i = 0; i < levelDialogs.length; i++) {
            const levelDialog = levelDialogs[i];
            const okButton = levelDialog.querySelector('.ok-button');

            // add event listener to "ok-button"
            okButton.addEventListener('click', this.onDialogClick.bind(this), false);
        }

        // get the controls for upper and lower tray, we are generally just trying to open/close them
        // and leave actions for the puzzle. exception is the tray toggle button, its a control not a puzzle modifier
        this.trayToggleBtn = document.getElementById('trayToggle'); // tray expander button
        this.tray = document.getElementById('tray');
        this.toolTray = document.getElementById('toolTray'); // tray expander btn container
        //this.trayContent = document.getElementById('trayContent');
        this.trayButtons = document.getElementById('trayButtons');
        this.trayToggleBtn.addEventListener('click', this.toggleTrayBtn.bind(this));
        // do we need the butons or just the images? the buttons should never show.  
        this.rotateCW = document.getElementById('rotateCW');
        this.rotateCCW = document.getElementById('rotateCCW');
        this.rotateCWimg = document.getElementById('rotateCWimg');
        this.rotateCCWimg = document.getElementById('rotateCCWimg');
        this.flip = document.getElementById('flip');
        this.flipimg = document.getElementById('flipimg');
        this.grid = document.getElementById('grid');
        this.gridimg = document.getElementById('gridimg');
        this.dots = document.getElementById('dots');
        this.dotsimg = document.getElementById('dotsimg');
        this.gear = document.getElementById('gearContainer');
        this.gearimg = document.getElementById('gear');
        this.zoomIn = document.getElementById('zoomIn');
        this.zoomInimg = document.getElementById('zoomInimg');
        this.zoomOut = document.getElementById('zoomOut');
        this.zoomOutimg = document.getElementById('zoomOutimg');
        this.scoreBoard = document.getElementById('scoreBoard');
        this.score = document.getElementById('score');

        /*
        // start any in-play animations, i don't expect many of these, hopefully only this one. 
        
        if (this.levels[this.currentLevel].demo === 'clickfinger' ) {
            this.clickFinger = document.getElementById('clickfinger');
            this.clickFingerImg = document.getElementById('clickfinger-img');
            // set up a callback function for the click animation
            this.clickFingerImg.addEventListener('animationiteration', this.clickAnimationCycled.bind(this), false);
        }
        */

        // get all of the tools in the tray using getElementById
        this.help = document.getElementById('help');
        this.addOne = document.getElementById('addOne');
        this.addCluster = document.getElementById('addCluster');
        this.addSideKick = document.getElementById('addSideKick');
        this.hintButton = document.getElementById('hint');
        this.addPair; // not used yet
        this.save = document.getElementById('save');
        this.load = document.getElementById('loadLabel');

        // this is a set of other buttons in the tray i think? not used yet.
        //this.buttons = trayButtons.querySelectorAll('button');
        //if (this.buttons) { console.log("we have the buttons it's id is " + this.buttons.id); }

    }

    clickAnimationCycled() {
        this.clickAnimationCount++;
        //console.log("click animation cycled " + this.clickAnimationCount + " times");
        if (this.clickAnimationCount >= 2) {
            if (this.clickFingerImg) {
                this.clickFingerImg.remove('clickfingermove');
                this.clickFinger.style.display = "none";
                this.clickAnimationCount = 0;
            }
        }
    }

    hideAllTools() {
        this.help.style.display = "none";
        this.addOne.style.display = "none";
        this.addCluster.style.display = "none";
        this.addSideKick.style.diplay = "none";
        this.hintButton.style.display = "none";
        //this.addPair.style.display = "none"; // not used yet
        this.save.style.display = "none";
        this.load.style.display = "none";
        this.gear.style.display = "none";
        this.gearimg.style.display = "none";
        for( let i = 0 ; i < 6 ; i++ ) { 
            let stb = document.getElementById('st'+i);
            stb.display="none";
        }
    }

    showTools(tool) {
        if (tool === "help") { this.help.style.display = "block"; }
        if (tool === "addOne") { this.addOne.style.display = "block"; }
        if (tool === "addCluster") { this.addCluster.style.display = "block"; }
        if (tool === "addSideKick") { this.addSideKick.style.display = "block"; }
        if (tool === "addPair") { this.addPair.style.display = "block"; }
        if (tool === "hint") { this.hintButton.style.display = "block"; }
        if (tool === "save") { this.save.style.display = "block"; }
        if (tool === "file") { this.load.style.display = "block"; }
        if( tool === "stlevels") { 
            console.log("turning on st tools");
            for (let i = 0; i < 6; i++) {
                const id = 'st'+i;
                let stb = document.getElementById(id);
                console.log("id=" + id + " stb = " +JSON.stringify(stb));
                stb.style.display = "block";
            }
        }
        //console.log("done with stlevels");
    }

    showAllTools() {
        this.showTools("help");
        this.showTools("addOne");
        this.showTools("addCluster");
        this.showTools("addSideKick");
        this.showTools("hint")
        this.showTools("addPair");
        this.showTools("save");
        this.showTools("file");
    }

    toggleTrayBtn() { // expand/contract the tray
        if (!this.tray.classList.contains('show')) {
            this.openTrayBtn();
            this.puzzle.canvas.focus();
        }
        else {
            this.closeTrayBtn();
            this.puzzle.canvas.focus();
        }
    }
    openTrayBtn() { // expand the tray
        let currentlyOpen = this.tray.classList.contains('show');
        if (!currentlyOpen) {
            this.tray.classList.toggle('show');
            this.toolTray.style.top = 'calc(100% - 250px)';
            this.trayButtons.style.top = 'calc(100% - 200px)';
            this.trayToggleBtn.innerHTML = '-';
            // show the lower tray controls that should be included
            if (this.levels[this.currentLevel].controls) {
                if (this.levels[this.currentLevel].controls.rotate === "on") { this.showRotate(); }
                if (this.levels[this.currentLevel].controls.flip === "on") { this.showFlip(); }
                if (this.levels[this.currentLevel].controls.grid === "on") { this.showGrid(); }
                if (this.levels[this.currentLevel].controls.dots === "on") { this.showDots(); }
                if (this.levels[this.currentLevel].controls.gear === "on") { this.showGear(); }
                if (this.levels[this.currentLevel].controls.zoom === "on") { this.showZoom(); }
                if (this.levels[this.currentLevel].controls.saveLoad === "on") { this.showSaveLoad(); }
            }
        }
    }
    closeTrayBtn() { // close the tray
        let currentlyOpen = this.tray.classList.contains('show');
        if (currentlyOpen) {
            this.tray.classList.toggle('show');
            this.toolTray.style.top = 'calc(100% - 100px)';
            this.trayButtons.style.top = 'calc(100% - 70px)';
            this.trayToggleBtn.innerHTML = '+';
            // hide all lower tray controls
            this.hideRotate();
            this.hideFlip();
            this.hideGrid();
            this.hideDots();
            this.hideGear();
            this.hideZoom();
            this.hideSaveLoad();
        }
    }

    isSmallScreen() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
        const isPortrait = screenHeight > screenWidth;
        const visibleWidth = isPortrait ? screenWidth : screenHeight;
        return isMobile || visibleWidth <= 768; // adjust the threshold as needed
    }


    showRotate() { // show the rotation button in the lower tray 
        const lt = document.getElementById('lowerTray');
        lt.style.display = 'flex';
        this.rotateCCW.style.display = 'flex';
        this.rotateCW.style.display = 'flex';
        this.rotateCCWimg.style.display = 'block';
        this.rotateCWimg.style.display = 'block';
        //console.log("show rotate");
    }
    hideRotate() { // hide the rotation button in the lower tray
        this.rotateCW.style.display = 'none';
        this.rotateCCW.style.display = 'none';
        this.rotateCCWimg.style.display = 'none';
        this.rotateCWimg.style.display = 'none';
        //console.log("hide rotate");
    }
    showFlip() { // show the rotation button in the lower tray 
        const lt = document.getElementById('lowerTray');
        lt.style.display = 'flex';
        this.flip.style.display = 'flex';
        this.flipimg.style.display = 'flex';
    }
    hideFlip() { // hide the rotation button in the lower tray
        this.flip.style.display = 'none';
        this.flipimg.style.display = 'none';
    }
    showGrid() { // show the grid button in the lower tray
        const lt = document.getElementById('lowerTray');
        lt.style.display = 'flex';
        this.grid.style.display = 'flex';
        this.gridimg.style.display = 'flex';
    }
    hideGrid() { // hide the grid button in the lower tray
        this.grid.style.display = 'none';
        this.gridimg.style.display = 'none';
    }
    showDots() { // show the dots button in the lower tray
        const lt = document.getElementById('lowerTray');
        lt.style.display = 'flex';
        this.dots.style.display = 'flex';
        this.dotsimg.style.display = 'flex';
    }
    showGear() { // show the gear button in the lower tray
        const lt = document.getElementById('lowerTray');
        lt.style.display = 'flex';
        this.gear.style.display = 'flex';
        this.gearimg.style.display = 'flex';
    }
    hideDots() { // hide the dots button in the lower tray
        this.dots.style.display = 'none';
        this.dotsimg.style.display = 'none';
    }
    hideGear() { // hide the dots button in the lower tray
        this.gear.style.display = 'none';
        this.gearimg.style.display = 'none';
    }
    showZoom() { // show the zoom button in the lower tray
        if (!this.isSmallScreen()) {
            const lt = document.getElementById('lowerTray');
            lt.style.display = 'flex';
            this.zoomIn.style.display = 'flex';
            this.zoomInimg.style.display = 'flex';
            this.zoomOut.style.display = 'flex';
            this.zoomOutimg.style.display = 'flex';
        } else { this.hideZoom(); }
    }
    hideZoom() { // hide the zoom button in the lower tray
        this.zoomIn.style.display = 'none';
        this.zoomInimg.style.display = 'none';
        this.zoomOut.style.display = 'none';
        this.zoomOutimg.style.display = 'none';
    }
    showSaveLoad() {
        if (!this.isSmallScreen()) {
            this.save.style.display = 'block';
            this.load.style.display = 'block';
        }
        else { this.hideSaveLoad(); }
    }
    hideSaveLoad() {
        this.save.style.display = 'none';
        this.load.style.display = 'none';
    }

    hideAllTools() {
        this.help.display = "none";
        this.addOne.display = "none";
        this.addCluster.display = "none";
        this.addSideKick.display = "none";
        this.hintButton.display = "none";
        //this.addPair.display = "none"; // not used yet
        this.save.display = "none";
        this.load.display = "none";
    }

    showToolTray() {
        // show the canvas, tray and canvas-expander button again
        const canvasDiv = document.getElementById("canvas-container");
        const trayDiv = document.getElementById("tray");
        const helpBtn = document.getElementById("help");
        canvasDiv.style.display = 'flex';
        trayDiv.style.display = 'block';
        this.toolTray.style.display = 'block';
        helpBtn.style.display = 'block';
    }
    onDialogClick(event) {
        // hide the level dialog: it's id is found in the data-gamelevel attribute of the ok button.
        const okbtn = document.getElementById(event.target.id);
        const gamelevel = okbtn.dataset.gamelevel;
        const leveldialog = document.getElementById(gamelevel);
        leveldialog.style.display = 'none';

        if (this.levels[this.currentLevel].controls) {
            if (this.levels[this.currentLevel].controls.play === "skip") {
                this.currentLevel++;
                this.playNextGameLevel();
                return;
            }
        }
        this.showToolTray();
        this.puzzle.centerCanvas();
        this.puzzle.canvas.focus();


        /*
                // start any in-play animations, i don't expect many of these, hopefully only this one. 
                if (this.levels[this.currentLevel].demo === 'clickfinger') {
                    console.log("start clickfinger");
                    this.clickFinger = document.getElementById('clickfinger');
                    this.clickFingerImg = document.getElementById('clickfinger-img');
        
                    // the clickfinger sits in the same div as the tray buttons, so just set its top to 0
                    this.clickFinger.style.top = 0;
                    // start any in-play animations, i don't expect many of these, hopefully only this one. 
                    console.log("move the image");
                    this.clickFingerImg.classList.add('clickfingermove');
                    // set up a callback function for the click animation
                    this.clickFingerImg.addEventListener('animationiteration', this.clickAnimationCycled.bind(this), false);
                } else { console.log("no animation"); }
                */
    }

    setLevels() {
        this.levels = new Level().getData();
    } // end setLevels
} // end Class

let game = new Game();
game.playGame();