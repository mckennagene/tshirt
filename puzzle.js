
class Puzzle {
    static CANVAS_BUFFER = 0; // remove this from the code
    static KEY_SEPARATOR = "-";
    static CANVAS_PIXEL_LIMIT = 16384 * 0.8;
    static Action = { // this may not be in use
        ADD: 'add',
        REMOVE: 'remove'
    };
    /*static DRAW = { // i don't think this is in use
        DRAW: 'draw',
        ERASE: 'erase'
    };*/
    static WORLD_ROTATION = Math.PI / 2; // rotate the world 90 degrees
    static MIN_GRID_X = 1;
    static MAX_GRID_X = 10;
    static MIN_GRID_Y = 1;
    static MAX_GRID_Y = 10;
    static BORDER_BUFFER = 2;
    static KITE_SIZE = 15;

    // these are indices in the color array
    static palette = [
        {
            top: 'blue',
            default: 'white',
            bottom: 'white',
            surround: 'SkyBlue',
            disjoint: 'white',
            sideKick: 'yellow',
            background: 'seashell'
        },
        {
            top: '#a32a22',
            default: '#f4d3a8',
            bottom: '#f4d3a8',
            surround: '#e27531',
            disjoint: '#f4d3a8',
            sideKick: '#e4b33f',
            background: 'white',
        }
    ];

    constructor(game) {
        this.game = game;
        this.globalId = 0;
        this.name = "TShirt Puzzle";

        this.tshirts = new Set();

        this.hexCenterCols = 10;
        this.hexCenterRows = 10;
        this.hexTShirts = new Array(this.hexCenterCols);
        this.hexPhantomTShirts = new Array(this.hexCenterCols);

        this.canvas = document.getElementById('puzzle');
        this.canvas.setAttribute('tabindex', '0'); // make it so we can set it as the focus.
        this.ctx;
        this.canvCont = document.getElementById('canvas-container');
        // not clear i need both of these, we can probably just set the html canvas and reference it when needed.
        this.canvasOrigWidth; // going to set these two in initializeDataStructures
        this.canvasOrigHeight;
        this.canvas.width = 1000;
        this.canvas.height = 800;
        this.canvCont.style.width = '1000px';
        this.canvCont.style.height = '800px';
        this.canvasXOffset = 100;
        this.canvasYOffset = 0;
        // these will be computed during resetPuzzle, they represent the canvas coordinates
        // of the black line inside of which the puzzle must be fully covered to be complete.
        this.leftCanvasBorder = null;
        this.topCanvasBorder = null;
        this.rightCanvasBorder = null;
        this.bottomCanvasBorder = null;

        this.zoomLevel = 1;
        this.setupEventListeners();
        this.browserHeight = document.documentElement.clientHeight;
        this.browserWidth = document.documentElement.clientWidth;
        this.tshirtColors = Puzzle.palette[0];
        this.showBadNeighbors = false;
        this.showSurround = false;
        this.showSideKick = false;
        this.showHints = 0;
        this.guide = null;
        this.autoDrawShape = null;
        this.autoDrawLevel = null;
        this.superTileLevelIsOn = [];
        this.drawTShirts = true;

        this.selection = new Selection(); // the set of every object selected so we don't have to ask them all all the time
        this.controls;
        this.paletteIndex=0;
        this.newTilePause = false;

        // used for dragging, have to know where the drag starts
        this.initialCanvasX;
        this.initialCanvasY;
        // set on all mousemove
        this.lastCanvasX = null;
        this.lastCanvasY = null;
        this.prevTouches = null;
        this.mouseIsDown = false;

        // display related stuff
        this.SHOW_KITES = -1;
        this.SHOW_HEX_DOTS = 1;

        // supertile alignment
        this.SHOW_PHANTOMS = true;

        // this.backgroundColor = "#ffffff";
        
        this.moveCycles = 0; // count # of mouse movements, quick hack.
        this.commonPointCallCount = 0;
        this.superTile = [];
        this.T2Super = [];
        this.superTileRoot = null;
        this.SUPERTILE_DRAW_SUPPRESSION = false;
    }

    getNumberOfTShirts() { return this.tshirts.size; }
    getTShirts() { return this.tshirts; }
    getCTX() { return this.ctx; }
    pauseAdding() { this.newTilePause = true; }
    resumeAdding() { this.newTilePause = false; }
    getBadNeighborCount() {
        let unionSet = new Set(); // don't want to double count a tshirt
        for (const tshirt of this.tshirts) {
            for (let b of tshirt.getBadNeighbors()) { unionSet.add(b); }
        }
        return unionSet.size;
    }

    createStartingTShirts() {
        //console.log("new starting tshirt");
        this.tshirts.add(new TShirt(this, 4, 4, 0, 'white', TShirt.FLIP.TOP));
        this.validateTShirtLocations();
    }

    resetPuzzle(gridSize, buffer, zoom, palette, targets,
        showBadNeighbors, showSurround, showSideKick, showKites, autoDrawShape, autoDrawLevel, showHintsDefault,
        showMetaHints) {
        //console.log("Puzzle.resetPuzzle()");
        this.tshirtColors = palette;
        this.hexCenterCols = gridSize.x;
        this.hexCenterRows = gridSize.y;
        this.drawTShirts = true;

        Puzzle.MAX_GRID_X = gridSize.x - 1;
        Puzzle.MAX_GRID_Y = gridSize.y - 1;
        Puzzle.MIN_GRID_X = 1;
        Puzzle.MIN_GRID_Y = 1;

        Puzzle.BORDER_BUFFER = buffer;

        // redo the data structures
        this.initializeDataStructures({ width: gridSize.x, height: gridSize.y }, zoom);

        this.showHints = showHintsDefault;
        this.showMetaHints = 0;
        if (showMetaHints) { this.showMetaHints = showMetaHints; }

        this.targets = targets;
        this.showBadNeighbors = showBadNeighbors;
        this.showSurround = showSurround;
        this.showSideKick = showSideKick;
        this.SHOW_KITES = showKites ? 1 : -1;
        this.autoDrawShape = autoDrawShape;
        this.autoDrawLevel = autoDrawLevel;
        if (autoDrawShape && autoDrawLevel) {
            this.superTileRoot = SuperTile.generateSuperTile(autoDrawShape, autoDrawLevel, SuperTile.NORTH_EAST);
            this.superTileLevelIsOn[autoDrawLevel] = true;
            for (let i = 0; i < autoDrawLevel; i++) { this.superTileLevelIsOn[i] = true; }
            this.autoDraw();
            this.selection.clear();
        }
        this.fullRedraw();
        this.canvas.focus();
    }

    completedMove() {
        // the total # of triangles inside the rectangular border area
        // is the number of hex cells * 6 kites per hex cell * 2 triangles per kite
        let total = (this.hexCenterCols - 2 * Puzzle.BORDER_BUFFER) *
            (this.hexCenterRows - 2 * Puzzle.BORDER_BUFFER) * 6 * 2;
        //console.log("cols=" + this.hexCenterCols + " rows=" + this.hexCenterRows +
        //    " buffer=" + Puzzle.BORDER_BUFFER + " totalTris=" + total);
        let complete = 0;
        let numberTs = 0;
        // we really need to see how many of the kites are occupied in each hex grid
        for (let t of this.tshirts) {
            numberTs++;
            complete += this.trianglesWithinBorder(t.getTriangles());
        }

        let percentComplete = Math.floor((complete / total) * 100);
        this.game.completedMove(numberTs, percentComplete, complete);
    }


    setupEventListeners() {
        //console.log("setup canvas called with " + xsize + "," + ysize);
        //const xsize = 1000;//document.documentElement.clientWidth;
        //const ysize = 800;//document.documentElement.clientHeight;
        this.canvas = document.getElementById('puzzle');
        this.canvas.setAttribute('tabindex', '0'); // make it so we can set it as the focus.
        this.canvas.focus();

        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(1, 1);

        this.boundingRect = this.canvas.getBoundingClientRect();

        window.addEventListener('scroll', this.onScroll.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        this.canvas.addEventListener('keydown', this.onKeyDown.bind(this));
        // these two are added inside the mousedown. if the mouse is not down
        // we don't have any functionality for these events.
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mousemove', this.onMouseMoveDocument.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));

        //
        // save and load button
        //
        // these were the save/load buttons originally in the tool tray, can probably remove
        const saveBtn = document.getElementById('save');
        const uploadBtn = document.getElementById('load');
        saveBtn.addEventListener('click', this.downloadJSON.bind(this), false);
        uploadBtn.addEventListener('change', this.uploadJSON.bind(this), false); // the false is supposed to limit this to 1 file only
        // these are the save/load buttons in the settings dialog
        this.settingsSaveBtn = document.getElementById('settings-save');
        this.settingsLoadBtn = document.getElementById('settings-load');
        this.settingsSaveBtn.addEventListener('click', this.downloadJSON.bind(this), false);
        this.settingsLoadBtn.addEventListener('click', this.uploadJSON.bind(this), false);


        //
        // The Add New TShirt Buttons
        //
        //console.log("addOne Events Added");
        //const puzzle = this; // scoped to this method "setupCanvas()"
        const addBtn = document.getElementById('addOne');
        addBtn.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        addBtn.addEventListener('mousedown', this.onAddTileMouseDown.bind(this), false);
        addBtn.addEventListener('mouseup', this.onAddTileMouseUp.bind(this), false);
        addBtn.addEventListener('mousemove', this.onAddTileMouseMove.bind(this), false);

        //console.log("addCluster Events Added");
        const addClusterBtn = document.getElementById('addCluster');
        addClusterBtn.addEventListener('click', function (event) { event.stopPropagation(); });
        addClusterBtn.addEventListener('mousedown', this.onAddClusterMouseDown.bind(this), false);
        addClusterBtn.addEventListener('mouseup', this.onAddClusterMouseUp.bind(this), false);
        addClusterBtn.addEventListener('mousemove', this.onAddClusterMouseMove.bind(this), false);

        const addSideKickBtn = document.getElementById('addSideKick');
        addSideKickBtn.addEventListener('click', function (event) { event.stopPropagation(); });
        addSideKickBtn.addEventListener('mousedown', this.onAddSideKickMouseDown.bind(this), false);
        addSideKickBtn.addEventListener('mouseup', this.onAddSideKickMouseUp.bind(this), false);
        addSideKickBtn.addEventListener('mousemove', this.onAddSideKickMouseMove.bind(this), false);


        //
        // touch devices
        //

        this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this));
        this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
        this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
        addBtn.addEventListener('touchstart', this.onAddTileTouchStart.bind(this), false);
        addBtn.addEventListener('touchmove', this.onAddTileTouchMove.bind(this), false);
        addBtn.addEventListener('touchend', this.onAddTileTouchEnd.bind(this), false);
        addClusterBtn.addEventListener('touchstart', this.onAddClusterTouchStart.bind(this), false);
        addClusterBtn.addEventListener('touchmove', this.onAddClusterTouchMove.bind(this), false);
        addClusterBtn.addEventListener('touchend', this.onAddClusterTouchEnd.bind(this), false);
        addSideKickBtn.addEventListener('touchstart', this.onAddSideKickTouchStart.bind(this), false);
        addSideKickBtn.addEventListener('touchmove', this.onAddSideKickTouchMove.bind(this), false);
        addSideKickBtn.addEventListener('touchend', this.onAddSideKickTouchEnd.bind(this), false);

        document.addEventListener('touchmove', this.onTouchMoveDocument.bind(this));


        // 
        // Rotate and flip buttons
        //
        const cwBtn = document.getElementById('rotateCW');
        const ccwBtn = document.getElementById('rotateCCW');
        const flipBtn = document.getElementById('flip');
        const gridBtn = document.getElementById('grid');
        const dotsBtn = document.getElementById('dots');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        cwBtn.addEventListener('click', this.onRotateCW.bind(this));
        ccwBtn.addEventListener('click', this.onRotateCCW.bind(this));
        flipBtn.addEventListener('click', this.doFlip.bind(this));
        gridBtn.addEventListener('click', this.toggleGrid.bind(this));
        dotsBtn.addEventListener('click', this.toggleDots.bind(this));
        zoomInBtn.addEventListener('click', this.zoomIn.bind(this));
        zoomOutBtn.addEventListener('click', this.zoomOut.bind(this));

        // 
        // Gear
        //
        this.settingsDialog = document.getElementById('settings-dialog');
        this.gearimg = document.getElementById('gear');
        this.gearimg.addEventListener('click', this.displaySettings.bind(this), false);
        this.settingsDoneBtn = document.getElementById('settingsDoneButton');
        this.settingsDoneBtn.addEventListener('click', this.onCloseSettings.bind(this));
        this.gridLinesCheckBox = document.getElementById('grid-checkbox');
        this.hexDotsCheckBox = document.getElementById('dots-checkbox');
        this.gridLinesCheckBox.addEventListener('click', this.onGridLinesToggle.bind(this));
        this.hexDotsCheckBox.addEventListener('click', this.onHexDotsToggle.bind(this));

        // 
        // Help and Hint Buttons
        //
        const helpBtn = document.getElementById('help');
        helpBtn.addEventListener('click', this.displayHelp.bind(this), false);

        const hintBtn = document.getElementById('hint');
        hintBtn.addEventListener('click', this.displayHint.bind(this), false);

        // add animation for the lower tray buttons
        document.querySelector('#lowerTray button').classList.add('show');

    }

    onCloseSettings(event) {
        this.settingsDialog.style.display = 'none';
    }

    displaySettings() {
        console.log("display settings sk=" + this.SHOW_KITES + " sd=" + this.SHOW_HEX_DOTS);
        this.settingsDialog.style.display = 'flex';
        if (this.SHOW_HEX_DOTS == 1) { this.hexDotsCheckBox.checked = true; }
        else { this.hexDotsCheckBox.checked = false; }
        if (this.SHOW_KITES == 1) { this.gridLinesCheckBox.checked = true; }
        else { this.gridLinesCheckBox.checked = false; }
    }

    resetTShirtData() {
        // clear out any existing tshirts
        this.tshirts.clear();
        this.selection.clear();
    }

    ensureZoomDoesntExceedPixelLimit() {
        // if the zoom level will result in us having a canvas that is too big, then reduce the zoom level
        let limitingDimension = this.canvasOrigWidth;
        if (this.canvasOrigHeight > this.canvasOrigWidth) { limitingDimension = this.canvasOrigHeight; }
        if (limitingDimension * this.zoomLevel > Puzzle.CANVAS_PIXEL_LIMIT) {
            this.zoomLevel = Puzzle.CANVAS_PIXEL_LIMIT / limitingDimension;
            //console.log("enforcec zoom limit, set it to  " + this.zoomLevel + " pixels = " + (limitingDimension * this.zoomLevel));
        } else {
            //console.log("did not enforcec zoom limit pixels = " + (limitingDimension * this.zoomLevel ));
        }
    }

    setCanvasSizeAndOffset() {
        this.ensureZoomDoesntExceedPixelLimit();
        this.canvas.width = this.canvasOrigWidth * this.zoomLevel;
        this.canvas.height = this.canvasOrigHeight * this.zoomLevel;
        this.canvCont.style.justifyContent = "center";// center horizontally
        this.canvCont.style.alignItems = "center"; // center vertically

        // step 1 the container should always be the same size as the window
        this.canvCont.style.width = window.innerWidth + "px";
        this.canvCont.style.height = window.innerHeight + "px";
        // step 2 we want the canvas to always be as wide or wider than the window
        // so if through normal computation the canvas ends up smaller, 
        // then we make it the same size and we record how much we expanded it putting
        // half that amount into the canvasXOffset 
        let fullWidth = document.body.scrollWidth;
        if (this.canvas.width < fullWidth) {
            this.canvasXOffset = ((fullWidth - this.canvas.width) / 2) / this.zoomLevel;
            this.canvas.width = fullWidth;
            //console.log("win.w="+window.innerWidth+" ocw=" + ow + " canvas.w="+this.canvas.width+" canvasXOffset="+this.canvasXOffset+" zoom="+this.zoomLevel);
        } else { this.canvasXOffset = 0; }
        let fullHeight = window.innerHeight; // document.body.scrollHeight; // window.innerHeight
        if (this.canvas.height < fullHeight) {
            this.canvasYOffset = ((fullHeight - this.canvas.height) / 2) / this.zoomLevel;
            this.canvas.height = fullHeight;

        } else {
            this.canvasYOffset = 0;
        }

        // if the canvas is larger than its container then set its container to the size of the window
        if (this.canvas.width > window.innerWidth) { // parseInt(this.canvCont.style.width)) {
            //this.canvCont.style.width = window.innerWidth + "px";
            this.canvCont.style.justifyContent = "flex-start";
        }
        if (this.canvas.height > window.innerHeight) { // parseInt(this.canvCont.style.height)) {
            //this.canvCont.style.height = window.innerHeight + "px";
            this.canvCont.style.alignItems = "flex-start";
        }

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        this.ctx.translate(this.canvasXOffset, this.canvasYOffset);

        return;
    }

    // creates the hexTShirts
    initializeDataStructures(size, zoom) {
        if (size) {
            //console.log("setting size to " + size.width + "," + size.height);
            this.hexCenterCols = size.width;
            this.hexCenterRows = size.height;
        }

        this.resetTShirtData();
        this.zoomLevel = zoom;
        this.ensureZoomDoesntExceedPixelLimit();
        this.hexTShirts = new Array(this.hexCenterCols); // which tshirt occupies a hex center
        this.hexPhantomTShirts = new Array(this.hexCenterCols); // which phantom tshirt occupies a hex center
        this.canvasOrigWidth = this.hexCenterCols * 3 * Puzzle.KITE_SIZE; // e.g. 3000, 
        this.canvasOrigHeight = 3 * Puzzle.KITE_SIZE + this.hexCenterRows * 2 * Puzzle.KITE_SIZE * Math.sqrt(3); // e.g. 3524

        // set the grid coordinate system. must have the right transformations first.
        this.setCanvasSizeAndOffset();
        for (let i = 0; i < this.hexCenterCols; i++) {
            this.hexTShirts[i] = new Array(this.hexCenterRows);
            this.hexPhantomTShirts[i] = new Array(this.hexCenterRows);
        }
    }

    recordLocation(x, y, tshirt) {
        if (x > this.hexCenterCols || y > this.hexCenterRows || x < 0 || y < 0) {
            console.log("ERROR: recordLocation out of bounds " + x + "," + y + " for tshirt " + tshirt.id);
            return;
        }
        //console.log("Puzzle.recordLocation - recording location " + x + "," + y + " for tshirt " + tshirt.id);
        if (!tshirt.phantom) { this.hexTShirts[x][y] = tshirt; }
        else { this.hexPhantomTShirts[x][y] = tshirt; }
    }
    // ensure that the tshirt passed is no longer recorded at the location.
    // possibly another tshirt is already there due to a group move
    clearLocation(x, y, tshirt) {
        if (!tshirt.phantom) {
            if (this.hexTShirts[x][y] === tshirt) { this.hexTShirts[x][y] = null; }
        } else {
            if (this.hexPhantomTShirts[x][y] === tshirt) { this.hexPhantomTShirts[x][y] = null; }
        }
        //else { console.log("did not clear " + x + "," + y); }
    }
    clearTShirtLocation(tshirt) {
        if (!this.SUPERTILE_DRAW_SUPPRESSION) {
            if (!tshirt.phantom) {
                if (this.hexTShirts[tshirt.gridX][tshirt.gridY] === tshirt) {
                    this.hexTShirts[tshirt.gridX][tshirt.gridY] = null;
                }
            }
            else {
                if (this.hexPhantomTShirts[tshirt.gridX][tshirt.gridY] === tshirt) {
                    this.hexPhantomTShirts[tshirt.gridX][tshirt.gridY] = null;
                }
            }
        }
        //else { console.log("did not clear " + tshirt.gridX + "," + tshirt.gridY); }
    }


    getTShirtAtLocation(x, y) {
        return this.hexTShirts[x][y];
    }


    isLocationOccupiedAndAligned(x, y, heading, flip) {
        //console.log("isLocationOccupiedAndAligned(" + x + "," + y + "," + heading + "," + flip );
        let t = this.hexTShirts[x][y];
        if (t) {
            //console.log("t.heading=" + t.heading + " t.flip=" + t.flip);
            return t.heading === heading && t.flip === flip;
        }
        else {
            //console.log("t is null");
            return false;
        }
    }

    validateTShirtLocations() {
        let toRemove = new Set();
        for (let t of this.tshirts) {
            let kites = t.kitesForThisPosition();
            let allowable = true;
            //            for (let kite of kites) {
            if (this.kitesAreOccupied(t, kites)) {
                //console.log("Tshirt " + tshirt.id + " is overlapping another tshirt");
                toRemove.add(t);
                allowable = false;
                break;
            }
            //           }
            if (allowable) {
                t.setLocationValidated();
                this.recordLocation(t.gridX, t.gridY, t);
            }
        }
        for (let r of toRemove) {
            this.tshirts.delete(r);
        }
    }

    drawAllTShirts() {
        if (!this.drawTShirts) { return; }
        for (const tshirt of this.tshirts) {
            // console.log("drawing tshirt " + tshirt.id + " @ grid " + tshirt.gridX + "," + tshirt.gridY 
            // + " and canvas " + tshirt.x + "," + tshirt.y);
            tshirt.draw(this.showBadNeighbors, this.showSurround, this.showSideKick);
        }
    }

    centerCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const x = rect.left + window.scrollX + rect.width / 2;
        const y = rect.top + window.scrollY + rect.height / 2;
        const a = x - window.innerWidth / 2;
        const b = y - window.innerHeight / 2;
        this.canvCont.scrollBy(a, b);
    }

    redoWorkAreas(workAreas, bg = false) {
        //console.log("REDO WORK AREAS: there are " + workAreas.length + " work areas");

        // erase
        this.ctx.fillStyle = this.tshirtColors.background;
        if (bg) { this.ctx.fillStyle = "grey"; }
        for (let wa of workAreas) {
            if (wa.hasPoints()) {
                let temp = wa.rectangle(Puzzle.KITE_SIZE * 4);
                this.ctx.fillRect(temp.x, temp.y, temp.width, temp.height);
            }
        }

        this.drawGrayZone();
        this.drawGridPoints(workAreas, Puzzle.KITE_SIZE * 4); // same buffer size as above when we erase
        this.drawShadows();

        // now we can draw the tshirts
        if (this.drawTShirts) {
            if (!this.mouseIsDown && !this.draggingPostPaste) {
                //console.log("identifying neighbors" ) ; 
                this.identifyNeighborMarkings(); // could be very expensive
                //console.log("here's who is disjointed");
                // i dont think this does anything, was probably debug
                for (const tshirt of this.tshirts) {
                    let dwid = 'n/a';
                    //let djwm = 'n/a';
                    if (tshirt.disjointWith) {
                        dwid = tshirt.disjointWith.id;
                    }
                }
            } //else { console.log("not identifying neighbors because mouseIsDown");}

            let drawnSet = new Set();
            for (let wa of workAreas) {
                if (wa.hasPoints()) {
                    //console.log("redraw around " + wa.getBBoxAsString());
                    let minPt = Puzzle.nearestGridCoordinate(wa.x1, wa.y1);
                    let maxPt = Puzzle.nearestGridCoordinate(wa.x2, wa.y2);

                    //console.log("checking for tshirts +/-3 around " + minPt.x + "," + minPt.y + " to " + maxPt.x + "," + maxPt.y);
                    for (let i = minPt.x - 3; i <= maxPt.x + 3; i++) {
                        for (let j = minPt.y - 3; j <= maxPt.y + 3; j++) {
                            if (i >= 0 && i < this.hexCenterCols && j >= 0 && j < this.hexCenterRows) {
                                let tshirt = this.hexTShirts[i][j];

                                if (tshirt) {
                                    if (tshirt.phantom) { console.log("ERROR found phantom tshirt " + tshirt.id + " at " + i + "," + j); }
                                    if (!drawnSet.has(tshirt)) {
                                        tshirt.draw(this.showBadNeighbors, this.showSurround, this.showSideKick);
                                        drawnSet.add(tshirt);
                                    }
                                } else {
                                    tshirt = this.hexPhantomTShirts[i][j];
                                    if (tshirt && this.SHOW_PHANTOMS) {
                                        if (!drawnSet.has(tshirt)) {
                                            tshirt.draw(false, false, false);
                                            drawnSet.add(tshirt);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // if we are dragging we have to draw the outline at the trial location
        for (let t of this.selection.getSelection()) {
            if (t.beingDragged) { t.drawTrialMove(); }
        }


        this.drawGuides();
        this.drawPuzzleBorder();
        /*
                // label the supertiles
                for (let tshirt of drawnSet) {
                    // label the super tiles
                    let st = this.superTile[tshirt.id];
                    if (st) {
                        this.ctx.font = "14px Arial";
                        if (tshirt.color === "white" || tshirt.color === "yellow") { this.ctx.fillStyle = "black"; } else { this.ctx.fillStyle = "white"; }
                        this.ctx.fillText(st.fullId, tshirt.centroidX, tshirt.centroidY);
                    }
                }
        */

        // draw a rectangle around any workareas that were debugOn, helps us see where specific bounding boxes are
        for (let wa of workAreas) {
            if (wa.isDebugOn()) {
                this.ctx.strokeStyle = "red";
                this.ctx.lineWidth = 1;
                let temp = wa.rectangle(Puzzle.KITE_SIZE * 4);
                this.ctx.strokeRect(temp.x, temp.y, temp.width, temp.height);
            }
        }
    }
    /**
     * for each tshirt that is bottom side up, find neighboring tshirts using grid points nearby
     * maintain a list of which pairs have been checked already (in either direction)
     * record if the shared points make the pair any one of 1-3). between any pairs, they can 
     * only have one of these relationships. but they can have other relationships with other tshirts.
     *     1) surround (part of a cluster, or "H" in the paper) - light blue
     *     2) sidekick (a pair called "P" in the paper) - grey
     *     3) disjoint 
     *     a solo (anything else) - white
     *     bad neighbors - these will be indicated with a red square 
     */
    identifyNeighborMarkings() {
        // get a set of tshirts whose neighbor relationships could have possibly changed
        // they have to be in the selection, or a registered neighbor of a tshirt in the selection
        const checkSet = new Set(this.selection.getSelection());

        // build up a list of every tshirt we should examine
        for (const t of this.selection.getSelection()) { // start with all tshirts in the selection
            for (const s of t.getBadNeighbors()) { checkSet.add(s); }
            if (t.isSideKick()) {
                for (const s of t.getSideKickNeighbors()) { checkSet.add(s); }
            }
            if (t.getSurroundedTop()) { checkSet.add(t.getSurroundedTop()); }
            if (t.getSurroundsMe().size > 0) { for (let s of t.getSurroundsMe()) { checkSet.add(s); } }
        }

        // now we have the set of tshirts might have changed neighbor relationships by moving directly or having one of their relationship partners move
        // next we eliminate all relationships involving the set that did move, and re-examine them to set new relationships
        // but we don't arbitrarily go remove relationships from tshirts that weren't in the selection as they may also have relationships
        // with other tshirts that were not part of the selection set and did not move.
        for (let t of this.selection.getSelection()) { t.clearAllNeighborIndicators(); }

        const reviewedMap = {};
        for (const t1 of checkSet) {
            //console.log("1) t1.id=" + t1.id + " gridX = " + t1.gridX + " gridY=" + t1.gridY);
            if (!t1.deleted && !t1.phantom) {
                //console.log("2)");
                for (let i = t1.gridX - 2; i <= t1.gridX + 2; i++) {
                    for (let j = t1.gridY - 2; j <= t1.gridY + 2; j++) {
                        //console.log("3)");
                        if (i >= 0 && i < this.hexCenterCols && j >= 0 && j < this.hexCenterRows) {
                            const t2 = this.hexTShirts[i][j];
                            //if( !t2 ) { console.log( "t2 from " + i + "," + j + " is null"); }
                            //else { console.log("4) t1=" + t1.id + " t2= " + t2.id + " t1.deleted=" + t1.deleted + " t2.deleted=" + t2.deleted); }
                            if (t2 && t2 != t1 && !t2.deleted && !t2.phantom) {
                                const keyPair = Puzzle.getPairKey(t1, t2);
                                //console.log("5)");
                                if (!reviewedMap[keyPair]) {
                                    reviewedMap[keyPair] = true;
                                    //let x = Puzzle.getPairKey(t1, t2);
                                    //console.log("reviewing pair:" + this.getPairKey(t1,t2));
                                    const sharedPoints = this.getCommonPoints(t1.getPoints(), t2.getPoints());
                                    //console.log("shared pts len=" + sharedPoints.length + " ids:" +t1.id +":" + t2.id + " flips:" + t1.flip + ":" + t2.flip + " pts" + JSON.stringify(sharedPoints));
                                    this.labelNeighbors(t1, t2, sharedPoints);
                                }
                            } // should review this pair 
                        } // the point considered is in bounds
                    } // for j
                } // for i
            } // if t1 isn't deleted
        } // for checkSet
    }

    labelNeighbors(t1, t2, sPoints) {
        //console.log("LABEL NEIGHBORS " + t1.id + "&" + t2.id + " " + JSON.stringify(sPoints));
        if (t1.flip != t2.flip) {
            //console.log("potential surround");
            if (this.pointsMatch(t1, t2, sPoints, TShirt.surroundPts)) {
                //console.log("setting surround");
                if (t1.flip === TShirt.FLIP.TOP) { t2.setSurround(t1); }
                else { t1.setSurround(t2); }
                return;
            } //else { console.log("not setting surround");}
        }
        // now check for sidekicks
        if (sPoints.length === 4) {
            //console.log("LABEL:\tsidekick check");
            if (this.pointsMatch(t1, t2, sPoints, TShirt.sideKickPts)) {
                t1.setSideKickNeighbor(t2); // will set mutually
                //console.log("identified sidekick between " + t1.id + "," + t2.id);
            }
            return;
        }
        // if t1 and t2 were sidekicks before, they failed the above test so they are no longer.
        if (t1.hasSideKickNeighbor(t2) || t2.hasSideKickNeighbor(t1)) {
            t1.removeSideKickNeighbor(t2); // does it in both directions.
            //console.log("removing sidekick between " + t1.id + "," + t2.id);
        }
        // now check for a disjoint neighbor relationship
        if (sPoints.length === 1) {
            //console.log("LABEL:\tdisjoint check");
            // these aren't fully reversible. the one that is disjoint is the one
            // with point 7, this is an ugly hack, but if we only have one test for 
            // disjoint, it's not too bad.
            if (this.pointsMatch(t1, t2, sPoints, TShirt.disjointPts)) {
                if (sPoints[0][1] == 7) { t2.setDisjoint(t1); }
                else { t1.setDisjoint(t2); }
                return;
            }
        }
        // now check if they are bad neighbors, this is orthogonal to other relationships
        if (sPoints.length < 4) { // if the # of sharedPoints is >= 4 then it is not bad.
            // are the sharedPoints the same as one of our defined goodPts or badPts?
            //console.log("LABEL:\tbad neighbor check");
            if (!this.pointsMatch(t1, t2, sPoints, TShirt.goodPts) &&
                this.pointsMatch(t1, t2, sPoints, TShirt.badPts)) {
                t1.addBadNeighbor(t2);
                t2.addBadNeighbor(t1); // this neighbor-pair is bad, each track the other
                //console.log("bad neighbor pair");
            }
            else {
                t1.removeBadNeighbor(t2);
                t2.removeBadNeighbor(t1); // this neighbor-pair is not bad, neither tracks the other
                //console.log("not bad neighbor pair");
            }
        } // end check for bad neighbors
        return;
    }

    static getPairKey(t1, t2) {
        if (t1.id < t2.id) { return t1.id + Puzzle.KEY_SEPARATOR + t2.id; }
        else { return t2.id + Puzzle.KEY_SEPARATOR + t1.id; }
    }

    selectAll() {
        for (const t of this.tshirts) { this.selection.add(t); }
    }

    touchAllSelected() {
        for (const t of this.selection.getSelection()) { t.gridMove(0, 0); }
    }
    fullRedraw() {
        this.ctx.fillStyle = this.tshirtColors.background;
        this.ctx.fillRect(0, 0, this.canvasOrigWidth + 100, this.canvasOrigHeight);
        this.drawGrayZone();
        this.drawGridPoints();
        this.identifyNeighborMarkings();
        this.drawShadows();
        this.drawAllTShirts();
        this.drawPuzzleBorder();
        this.drawGuides();
        this.drawSuperTiles(this.superTileRoot);
        this.ctx.save();
    }

    drawSuperTile(st) {
        let colors = ["black", "black", "red", "green", "blue", "fuchsia", "purple", "brown", "pink", "yellow"];
        if (!this.superTileLevelIsOn[st.level]) { return; }
        //console.log("drawing st " + st.fullId + " " + st.name + " " + st.level);
        let pts = st.getSuperTileShapePoints();

        //console.log( "for shape " + st.fullId + " received " + JSON.stringify( pts ) ) ;
        if (pts && pts.path) { //&& (st.fullId == "0.115" || st.fullId == "0.25")) {
            this.ctx.save();

            this.ctx.translate(pts.startPoint.x, pts.startPoint.y);
            this.ctx.rotate(pts.startRot);
            //console.log("for " + st.fullId + " " + st.name + "/"+ st.level + " startRot = " + pts.startRot + " " + Puzzle.radiansToDegrees(pts.startRot) + " degrees");

            this.ctx.strokeStyle = colors[st.level];
            this.ctx.fillStyle = "black";
            this.ctx.lineWidth = 2 + 4 * (st.level - 1);
            this.ctx.beginPath();

            this.ctx.moveTo(0, 0);
            this.ctx.fillText("0", 0, 0);

            for (let i = 0; i < pts.path.length; i += 2) {
                this.ctx.translate(pts.path[i], 0);
                this.ctx.rotate(pts.path[i + 1]);
                this.ctx.lineTo(0, 0);
                this.ctx.fillText((i + 2) / 2, 0, 0);
            }

            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        } else if (pts && pts.specificPoints) {
            this.ctx.strokeStyle = colors[st.level];
            this.ctx.fillStyle = "black";
            this.ctx.lineWidth = 2 + 4 * (st.level - 1);
            this.ctx.beginPath();

            this.ctx.moveTo(pts.specificPoints[0].x, pts.specificPoints[0].y);
            this.ctx.fillText("0", 0, 0);
            for (let i = 1; i < pts.specificPoints.length; i++) {
                this.ctx.lineTo(pts.specificPoints[i].x, pts.specificPoints[i].y);
                this.ctx.fillText((i + 1), 0, 0);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    drawSuperTiles(st) {
        if (!st) { return; }
        if (!st.childArray || st.childArray.length == 0 || !st.visible) { return; }
        for (const t of st.childArray) {
            this.drawSuperTiles(t);
        }
        this.drawSuperTile(st);
    }


    // do the shared points match any of the points in the definedPointsList?
    // and is the a.flip and b.flip forming our sharedPoints, the same as the flips for the definedPoint set?
    pointsMatch(t1, t2, sharedPoints, definedPointsList) {
        if (sharedPoints.length == 0) {
            //console.log("no points are shared between " +t1.id + " & " + t2.id ); 
            return false;
        }
        //console.log("in pointsMatch comparing id:" + t1.id + " and id:" + t2.id + " w/ " + sharedPoints.length + " shrdPts to any of " + definedPointsList.length + " defndPts");
        for (let definedPoints of definedPointsList) { // there are lists of defined points
            //console.log("compare " + sharedPoints.length + " sharedpoints to " + definedPoints.pairs.length + " definedPoints:" + definedPoints.matchType + " " + definedPoints.matchNumber );
            if (sharedPoints.length === definedPoints.pairs.length) {  // do our shared points and the defined points have the same length?
                // do we need to check boths ways? or will we ultimately iterate through all pairs twice, once in each direction?
                const standardFlip = definedPoints.a === t1.flip && definedPoints.b === t2.flip;
                const reverseFlip = definedPoints.a === t2.flip && definedPoints.b === t1.flip;// && definedPoints.matchType === "bad";
                //console.log("standardFlip=" + standardFlip + " reverseFlip=" + reverseFlip);
                if (standardFlip || reverseFlip) { // do the flips match? 
                    let matchCount = 0;
                    for (let i = 0; i < definedPoints.pairs.length; i++) {
                        //console.log("defined points " + i + " is " + definedPoints.pairs[i][0] + " f="+definedPoints.a + " and " + definedPoints.pairs[i][1] + " f="+definedPoints.b);//.pairs[0] + definedPoints.pairs[i].pairs[1] );
                        //console.log("\tstandrd flip type = " + standardFlip + " rev flip type = " + reverseFlip);
                        //console.log("\tstandard:" + sharedPoints[i][0] + " and " + sharedPoints[i][1] );
                        //console.log("\treverse:" + sharedPoints[i][1] + " and " + sharedPoints[i][0]);
                        if (standardFlip && definedPoints.pairs[i][0] === sharedPoints[i][0] && definedPoints.pairs[i][1] === sharedPoints[i][1] ||
                            reverseFlip && definedPoints.pairs[i][0] === sharedPoints[i][1] && definedPoints.pairs[i][1] === sharedPoints[i][0]) {
                            matchCount++;
                            //console.log("matchCount is now " + matchCount);
                        } // else { break ; } // this might be more efficient, not tested yet.
                    }
                    if (matchCount === definedPoints.pairs.length) { return true; } //console.log("got " + matchCount + " matches!"); return true; }
                    //else { console.log("got " + matchCount + " matches"); }
                } //else { console.log("flips are different " + definedPoints.a + " vs " + t1.flip + " and " + definedPoints.b + " vs " + t2.flip); }
            } //else { console.log("different length " + sharedPoints.length + " vs " + definedPoints.pairs.length); }
        }
        return false;
    }


    // relies on canvas to be not transformed
    drawGrayZone() {
        // undo the transform now to return to normal state. 
        // it's really the translate that has to be undone
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        this.ctx.fillStyle = "gray";
        // left 
        this.ctx.fillRect(0, 0, this.canvasXOffset + Puzzle.CANVAS_BUFFER, this.canvas.height / this.zoomLevel);
        // top
        this.ctx.fillRect(0, 0, this.canvas.width / this.zoomLevel, this.canvasYOffset + Puzzle.CANVAS_BUFFER);
        // bottom Math.sqrt(3) * 2 * Puzzle.KITE_SIZE * rowIndex + Puzzle.CANVAS_BUFFER + yOffset;
        this.ctx.fillRect(0, this.canvas.height / this.zoomLevel, this.canvas.width / this.zoomLevel,
            -(this.canvasYOffset + 2 * Puzzle.KITE_SIZE * Math.sqrt(3) - 10)); // why the -10? I don't understand but it works.
        // right
        this.ctx.fillRect(this.canvas.width / this.zoomLevel, 0, -this.canvasXOffset + Puzzle.CANVAS_BUFFER, this.canvas.height / this.zoomLevel);
        this.ctx.restore();
    }

    trianglesWithinBorder(triangles) {
        if (!triangles) { return 0; } // this happens when we click on the new tile icon, the new ones have no triangles yet, it's ok.
        // a tshirt has 8 kites each of which is 2 triangles. 
        // this returns the # of triangles passed that are inside the border area
        let numberInside = 0;
        for (let t = 0; t < triangles.length; t++) {
            // compute the midpoint of the triangle
            let x = (triangles[t][0].x + triangles[t][1].x + triangles[t][2].x) / 3;
            let y = (triangles[t][0].y + triangles[t][1].y + triangles[t][2].y) / 3;
            // console.log("midpoint:"+t + " is " + x + "," + y);

            let tolerance = 0.5;
            if (x + tolerance >= this.leftCanvasBorder &&
                x - tolerance <= this.rightCanvasBorder &&
                y + tolerance >= this.topCanvasBorder &&
                y - tolerance <= this.bottomCanvasBorder) {
                numberInside++;
            }
        }
        return numberInside;
    }

    drawPuzzleBorder() { //- Puzzle.BORDER_BUFFER
        this.leftCanvasBorder = Puzzle.gridToCanvas(Puzzle.BORDER_BUFFER, Puzzle.BORDER_BUFFER, Puzzle.KITE_SIZE).x;
        this.topCanvasBorder = Puzzle.gridToCanvas(Puzzle.BORDER_BUFFER, Puzzle.BORDER_BUFFER, Puzzle.KITE_SIZE).y;
        this.rightCanvasBorder = Puzzle.gridToCanvas(this.hexCenterCols - Puzzle.BORDER_BUFFER, Puzzle.BORDER_BUFFER, Puzzle.KITE_SIZE).x;
        this.bottomCanvasBorder = Puzzle.gridToCanvas(Puzzle.BORDER_BUFFER, this.hexCenterRows - Puzzle.BORDER_BUFFER, Puzzle.KITE_SIZE).y;// - Puzzle.BORDER_BUFFER).y;

        // draw a hard rectangular shape where the grid cuts off
        this.ctx.strokeStyle = 'black';
        this.ctx.setLineDash([0, 0]);
        this.ctx.lineWidth = 5 * this.zoomLevel;
        this.ctx.beginPath();
        this.ctx.moveTo(this.leftCanvasBorder, this.topCanvasBorder);
        this.ctx.lineTo(this.rightCanvasBorder, this.topCanvasBorder);
        this.ctx.lineTo(this.rightCanvasBorder, this.bottomCanvasBorder);
        this.ctx.lineTo(this.leftCanvasBorder, this.bottomCanvasBorder);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    toggleGrid() {
        this.SHOW_KITES = this.SHOW_KITES * -1;
        if (this.SHOW_KITES == 1) { this.gridLinesCheckBox.checked = true; }
        else { this.gridLinesCheckBox.checked = false; }
        this.fullRedraw();
    }
    toggleDots() {
        this.SHOW_HEX_DOTS = this.SHOW_HEX_DOTS * -1;
        if (this.SHOW_HEX_DOTS == 1) { this.hexDotsCheckBox.checked = true; }
        else { this.hexDotsCheckBox.checked = false; }
        this.fullRedraw();
    }

    static addToWorkAreas(workAreas, bbox) {
        if (bbox && bbox.hasPoints()) {
            // ensure the workAreas array doesn't already have bbox
            let found = false;
            for (const wa of workAreas) {
                if (wa.x1 == bbox.x1 && wa.y1 == bbox.y1 && wa.x2 == bbox.x2 && wa.y2 == bbox.y2) {
                    found = true;
                    break;
                }
            }
            if (!found) { workAreas.push(bbox); }
        }
    }

    doFlip() {
        //console.log("DO FLIP");
        const workAreas = [];

        // now we have to move all of them together or none at all. 
        // everyone mirrors about the keyTshirt.
        const keyTshirt = this.selection.getMinSelection();

        let canAllMove = true;
        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());

        const blockingTs = new Set();
        for (const tshirt of this.selection.getSelection()) {
            // we are going to get the kite positions if we move this one
            // -2*distance from keyTshirt's x (y unchanged) this will mirror position
            // rotate each -2 * current heading and flip it over, this will mirror orientation
            // here is where we start
            //console.log("\n\n\nFLIP\n\n\ntshirt " + tshirt.id + " @ " + tshirt.gridX + "," + tshirt.gridY +
            //    " heading " + tshirt.heading + " flip " + tshirt.flip);
            const xdist = tshirt.gridX - keyTshirt.gridX;
            const x = tshirt.gridX - xdist * 2; // what should new x be?
            const y = tshirt.gridY;
            const h = Puzzle.normalizeDegrees(tshirt.heading * -1); // what the new heading should be
            const f = tshirt.flip * -1;
            const kites = tshirt.kitesForPosition(x, y, h, f);
            if (!this.isInGridBounds(tshirt, - xdist * 2, 0)) {
                canAllMove = false;

            }
            if (this.kitesAreOccupied(tshirt, kites)) {
                canAllMove = false;
                blockingTs.add(tshirt);
                // console.log("no work:" + tshirt.id + " @ " + x + "," + y + " heading " + h + " flip " + f);
            }
        }
        if (canAllMove) {
            // dirty all current tshirt locations
            //for (const tshirt of this.selection.getSelection()) {
            //    this.selection.dirty(tshirt);
            //}
            for (const tshirt of this.selection.getSelection()) {
                const h = tshirt.heading * -2; // amount to change the heading
                const xdist = tshirt.gridX - keyTshirt.gridX
                tshirt.flipIt();
                tshirt.rotate(h);
                tshirt.gridMove(-xdist * 2, 0);
                //this.selection.dirty(tshirt);
                //console.log( "final tshirt: " + tshirt.id + " @ " + tshirt.gridX + "," + tshirt.gridY 
                //        + " heading " + tshirt.heading + " flip " + tshirt.flip);
            }
            Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
            //this.annotateBadNeighbors();
        } else { // rattle the blockint T's
            if (blockingTs.size > 0) { for (const b of blockingTs) { b.rattle(this.showSurround, this.showSideKick); } }
            return;
        }
        this.redoWorkAreas(workAreas);
    }

    isRotateValid(dheading) {
        if (this.selection.size() == 0) { return false; }
        // now we have to move all of them together or none at all. 
        const keyTshirt = this.selection.getMinSelection();
        // copy the keyTshirt's grid point to use as the rotation point, we don't want this
        // original reference point to change as we rotate all the tshirts in the selection.
        // let rotationPoint = Object.assign({}, { x: keyTshirt.gridX, y: keyTshirt.gridY });

        const blockingTs = new Set();

        for (const tshirt of this.selection.getSelection()) {
            //console.log("test tshirt" + tshirt.id + " @ " + tshirt.gridX + "," + tshirt.gridY );
            const newGrid = Puzzle.rotateGridVector(tshirt.getGridPoint(), keyTshirt.getGridPoint(), dheading);
            //console.log("\tnewGrid=" + newGrid.x + "," + newGrid.y);

            // if new grid is out of bounds, then we can't rotate
            if (newGrid.outOfBounds) { return false; }

            // is new position occupied by another?
            const kites = tshirt.kitesForPosition(newGrid.x, newGrid.y, tshirt.heading + dheading, tshirt.flip);
            const blockT = this.kitesAreOccupied(tshirt, kites);
            if (blockT) { blockingTs.add(blockT); }
        }

        if (blockingTs.size > 0) {
            for (const b of blockingTs) { b.rattle(this.showSurround, this.showSideKick); }
            return false;
        }
        return true;
    }

    // When a group is being rotated, we can't just rotate each member in the set, we have to pick one point
    // as a rotation point. The choice is arbitrary. We pick the member with the least id and use it's 0-point.
    // The key member rotates from that point. Others also rotate from the key member's 0 point, so we
    // compute a vector from the key's 0 point to a members 0-point, and find the new grid coordinates
    // for their 0 point by rotating that vector. We also have to deal with the hexagonal grid vertical offset
    // in odd/even columns. We check for overlaps with other T's, and then move the group all together, or none at all. 
    doRotate(dheading, light = false) {
        if (this.selection.size() == 0) { return; } // nothing selected, nothing to rotate
        // console.log("DO ROTATE " + dheading);

        const workAreas = [];
        const keyTshirt = this.selection.getMinSelection();
        // copy the keyTshirt's grid point to use as the rotation point, we don't want this
        // original reference point to change as we rotate all the tshirts in the selection.
        const rotationPoint = Object.assign({}, { x: keyTshirt.gridX, y: keyTshirt.gridY });

        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
        for (const tshirt of this.selection.getSelection()) {
            //console.log("ROTATING " + tshirt.id );
            const newGrid = Puzzle.rotateGridVector(tshirt.getGridPoint(), rotationPoint, dheading);
            //console.log("newGrid=" + newGrid.x + "," + newGrid.y);
            const gridAdjust = {
                x: newGrid.x - tshirt.getGridPoint().x //x:tshirt.getGridPoint().x-newGrid.x
                , y: newGrid.y - tshirt.getGridPoint().y
            };
            //console.log("gridAdjust=" + gridAdjust.x + "," + gridAdjust.y);
            tshirt.beingDragged = false;
            //this.selection.dirty(tshirt);
            //console.log("dirtied " + tshirt.id);
            tshirt.rotate(dheading);
            if (light) { tshirt.gridMoveLight(gridAdjust.x, gridAdjust.y); }
            else { tshirt.gridMove(gridAdjust.x, gridAdjust.y); }
        }
        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());

        if (!this.SUPERTILE_DRAW_SUPPRESSION) {
            this.redoWorkAreas(workAreas);
            this.completedMove();
        }
    }

    isGridMoveValid(dx, dy) {
        if (this.selection.size() == 0) { return; }
        // now we have to move all of them together or none at all. 
        const keyTshirt = this.selection.getMinSelection();
        const keyStart = keyTshirt.onEvenColumn();
        const blockingTs = new Set();

        for (const tshirt of this.selection.getSelection()) {
            let yadjust = 0;
            if (dy === 0 && Math.abs(dx) % 2 != 0 && tshirt.onEvenColumn() != keyStart) {
                if (!tshirt.onEvenColumn()) { yadjust = +1; }  // if you go from odd to even, you go up
                else { yadjust = -1; } // else you go from even to odd, so you go up.
                //if (Math.abs(tshirt.gridX-keyTShirt.gridX % 2 != 0)) { yadjust = 1; }
            }

            // is the new grid position in bounds?
            if (!this.isInGridBounds(tshirt, dx, dy + yadjust)) {
                return false;
            }

            // is new position occupied by another?
            const kites = tshirt.kitesForPosition(tshirt.gridX + dx, tshirt.gridY + dy + yadjust, tshirt.heading, tshirt.flip);
            const blockT = this.kitesAreOccupied(tshirt, kites);
            if (blockT) { blockingTs.add(blockT); }
        }
        if (blockingTs.size > 0) {
            for (let b of blockingTs) {
                b.rattle(this.showSurround, this.showSideKick);
            }
            return false;
        }
        else { return true; }
    }

    isInGridBounds(tshirt, dx, dy) {
        return tshirt.gridX + dx >= Puzzle.MIN_GRID_X &&
            tshirt.gridX + dx <= Puzzle.MAX_GRID_X &&
            tshirt.gridY + dy >= Puzzle.MIN_GRID_Y &&
            tshirt.gridY + dy <= Puzzle.MAX_GRID_Y;
    }

    doGridMove(dx, dy, light = false) {
        if (this.selection.size() == 0) { console.log("nothing selected, nothing to do"); return; }

        // it was designed to move in one direction at a time only. not really clear why it doesn't work in 
        // two directions at once, but this seems to do the job.
        if (dx != 0 && dy != 0) { this.doGridMove(dx, 0, light); this.doGridMove(0, dy, light); return; }

        const workAreas = [];

        // When a group is being moved, horizontal movement requires special treatment
        // because the hexagonal grid is vertically offset in every other column.
        // We pick one member of the group to be the "key" member (the choice is arbitrary
        // , we pick the member of the selection set with the least id). If the key one is
        // moving from an even column to an ODD column, it will appear to move down
        // even though its y-coordinate stays the same. Therefore any other member in the set
        // starting on an EVEN column will be moved -1 in their y-coordinate.
        // If the key one moves from an odd column to an even, then other members starting 
        // on an even column and going to an odd column will be moved +1 in the y. 
        const keyTShirt = this.selection.getMinSelection();
        const keyStart = keyTShirt.onEvenColumn();

        //console.log("keyT is " + keyTshirt.id + "  @ " + keyTshirt.gridX);
        if (!this.SUPERTILE_DRAW_SUPPRESSION) {
            Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
        }
        for (const tshirt of this.selection.getSelection()) {
            let yadjust = 0;
            if (dy === 0 && Math.abs(dx) % 2 != 0 && tshirt.onEvenColumn() != keyStart) {
                if (!tshirt.onEvenColumn()) { yadjust = +1; }  // if you go from odd to even, you go up
                else { yadjust = -1; } // else you go from even to odd, so you go up.
                //if (Math.abs(tshirt.gridX-keyTShirt.gridX % 2 != 0)) { yadjust = 1; }
            }

            tshirt.beingDragged = false;
            //console.log("moving the tshirt dx=" + dx + " dy=" + dy + " yadjust=" + yadjust + "=" + (dy + yadjust));
            if (light) { tshirt.gridMoveLight(dx, dy + yadjust); }
            else { tshirt.gridMove(dx, dy + yadjust); }
            // generally with arrow keys we only move by 1 in one direction and so we don't need to 
            // add another work area to clear and draw, it will fit within the original, but for debugging
            // we sometimes move by more so this is handy.

            if (!this.SUPERTILE_DRAW_SUPPRESSION) {
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
                }
                this.redoWorkAreas(workAreas);
                this.completedMove();
            }
        }

    }
    onScroll(event) { this.boundingRect = this.canvas.getBoundingClientRect(); }
    onResize(event) { this.zoom(0); } // resets the canvas size, xoffset, yoffset, and boundingRect, etc.
    onDocumentMouseUp(event) { ; } //console.log("document mouse up");
    onAddTileMouseDown(event) { if (this.newTilePause) { return; } this.onAddNewMouseDown(event, 1); }
    onAddTileMouseMove(event) { event.stopPropagation(); this.onMouseMove(event); }
    onAddTileMouseUp(event) { this.onMouseUp(event); }
    onAddClusterMouseDown(event) { if (this.newTilePause) { return; } this.onAddNewMouseDown(event, 4); }
    onAddClusterMouseMove(event) { event.stopPropagation(); this.onMouseMove(event); }
    onAddClusterMouseUp(event) { this.onMouseUp(event); }
    onAddSideKickMouseDown(event) { if (this.newTilePause) { return; } this.onAddNewMouseDown(event, 2); }
    onAddSideKickMouseMove(event) { event.stopPropagation(); this.onMouseMove(event); }
    onAddSideKickMouseUp(event) { this.onMouseUp(event); }

    handleTouchStart(event) {
        //console.log("touch start event=" + JSON.stringify(event));
        //event.stopPropagation(); 
        this.onMouseDown(this.touch2Mouse(event, "mousedown", false));
    }
    handleTouchMove(event) {
        //console.log("handling touch move event=" + JSON.stringify(event));
        const changedTouches = event.changedTouches;
        // Store the current touches as previous touches for the next event.

        // we only test for zoom if we have 2 or more touches, and at least one of them changed
        // and we know the previous value for all touches.
        if (changedTouches
            && changedTouches.length >= 1
            && event.touches.length > 1
            && this.prevTouches
            && this.prevTouches.length > 1) {  // multi-touch
            const prevDistance = this.distanceBetweenTouches(this.prevTouches[0], this.prevTouches[1]);
            const currDistance = this.distanceBetweenTouches(event.touches[0], event.touches[1]);
            const zoomThreshold = 0.05; // adjust this to your desired threshold
            const distanceDiff = currDistance - prevDistance;
            // console.log("dDiff=" + Math.floor(distanceDiff) + " pD=" + Math.floor(prevDistance) + " cD=" + Math.floor(currDistance) );
            if (Math.abs(distanceDiff) > zoomThreshold) {
                if (currDistance < prevDistance) {
                    //console.log("Z- " + currDistance + "<" + prevDistance + " d=" + distanceDiff);
                    console.log("4 Preventing default zoom behavior.");

                    event.preventDefault();
                    this.zoom(-.1);
                } else if (currDistance > prevDistance) {
                    //console.log("Z- " + currDistance + ">" + prevDistance + " d=" + distanceDiff);
                    console.log("3 Preventing default zoom behavior.");

                    event.preventDefault();
                    this.zoom(+.1);
                } else {
                    //console.log("Z  " + currDistance + "?" + prevDistance + " d=" + distanceDiff);
                    console.log("2 Preventing default zoom behavior.");

                    event.preventDefault();
                }
            } else {
                console.log("1 Preventing default zoom behavior.");

                event.preventDefault();
                // console.log("Z* " + currDistance + "~" + prevDistance + " d=" + distanceDiff);
            }
        }
        else { // single touch
            //event.stopPropagation(); 
            let pt = 0;
            if (this.prevTouches) { pt = this.prevTouches.length; }
            console.log("5 not Preventing default zoom behavior. tl=" + changedTouches.length + " etl=" + event.touches.length + " ptl=" + pt);

            this.onMouseMove(this.touch2Mouse(event, "mousemove", false));
        }
        // always record the previous touches.
        this.prevTouches = Array.from(event.touches);
    }

    distanceBetweenTouches(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }


    handleTouchEnd(event) {
        console.log("touchEnd");
        event.stopPropagation(); this.onMouseUp(event);
    }
    // replicate above for touch events.
    touch2Mouse(touchEvent, mouseEventName, preventDefault = true) {
        //console.log("touchEvent = " + touchEvent);
        // are there multiple touches?
        //if (touchEvent.changedTouches.length>1) { console.log("multi-touch");}
        //else { console.log("only one touch"); }
        //console.log("touches.length="+ touchEvent.touches.length);
        //console.log("changedTouches.length=" + touchEvent.changedTouches.length);

        const touch = touchEvent.changedTouches[0];
        const mouseEvent = new MouseEvent(mouseEventName, {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        if (preventDefault) { touchEvent.preventDefault(); }

        return mouseEvent;
    }

    onAddTileTouchStart(event) {
        console.log("add tile touch start");
        if (this.newTilePause) { return; } this.onAddNewMouseDown(this.touch2Mouse(event, "mousedown", true), 1);
    }
    onAddTileTouchMove(event) { this.onAddTileMouseMove(this.touch2Mouse(event, "mousemove", true)); }
    onAddTileTouchEnd(event) { this.onMouseUp(event, "mousedown", true); }
    onAddClusterTouchStart(event) { if (this.newTilePause) { return; } this.onAddNewMouseDown(this.touch2Mouse(event, "mousedown", true), 4); }
    onAddClusterTouchMove(event) { event.stopPropagation(); this.onMouseMove(this.touch2Mouse(event, "mousemove", true)); }
    onAddClusterTouchEnd(event) { this.onMouseUp(event, "mouseup", true); }
    onAddSideKickTouchStart(event) { if (this.newTilePause) { return; } this.onAddNewMouseDown(this.touch2Mouse(event, "mousedown", true), 2); }
    onAddSideKickTouchMove(event) { event.stopPropagation(); this.onMouseMove(this.touch2Mouse(event, "mousemove", true)); }
    onAddSideKickTouchEnd(event) { this.onMouseUp(event, "mouseup", true); }
    onTouchMoveDocument(event) { this.onMouseMoveDocument(this.touch2Mouse(event, "mousemove", false)); }
    onRotateCW() { this.doRotate(-60); }
    onRotateCCW() { this.doRotate(60); }

    onAddNewFromPaste() {
        if (this.draggingPostPaste) { return; } // can't paste again until we have placed the previous paste.
        let workAreas = [];

        this.draggingPostPaste = true;
        const clickX = this.lastCanvasX;
        const clickY = this.lastCanvasY;

        // things the puzzle needs to know to implement drag, this is where the drag starts.
        this.initialCanvasX = clickX;
        this.initialCanvasY = clickY;

        let gridPT = Puzzle.nearestGridCoordinate(clickX, clickY);//canvasPt.x, canvasPt.y);
        if (gridPT.y >= this.hexCenterRows) { gridPT.y = this.hexCenterRows - 1; }
        if (gridPT.x <= 0) { gridPT.x = 1; } // at extreme zoom in can be a problem


        // we are now dragging but without having the mouse button down.
        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox()); // to ensure the unselected ones redraw w/out selection outline
        this.selection.clear(); // clear selection, new selection will be the copy we make below

        let keyT = this.selection.getMinClipboard();
        // i don't love this but it was a quick solution to the never ending problem of the even/odd column adjustments for y coordinates.
        if (Math.abs(gridPT.x - keyT.gridX) % 2 != 0) { gridPT.x += 1; }
        let dx = 0;// gridPT.x - keyT.gridX;
        let dy = 0;//gridPT.y - keyT.gridY;

        // we don't use the clip board, we make a new copy of the clipboard, and use that.
        let pasteCopy = this.selection.copyClipboardForPasting();

        for (let t of pasteCopy) {
            this.selection.add(t);
            t.beingDragged = true;
            this.tshirts.add(t);
            // update its position from where it was when copied to where mouse is now
            //let newPt = { x: t.gridX + dx, y: t.gridY + dy };
            //t.updateLocationOnPaste(newPt);
            t.computePoints(t.kitesForThisPosition());
        }
        this.redoWorkAreas(workAreas);
        this.completedMove();
    }

    onAddNewMouseDown(event, numTiles) {
        event.stopPropagation();
        this.mouseIsDown = true;

        let workAreas = [];
        Puzzle.addToWorkAreas(workAreas, this.selection.clear());

        let canvasPt = this.mouseToCanvasCoordinates(this.canvas, event);
        //const raiseAboveToolPanel = 0;
        //canvasPt.y -= raiseAboveToolPanel / this.zoomLevel;
        this.initialCanvasX = canvasPt.x;
        this.initialCanvasY = canvasPt.y;

        let gridPT = Puzzle.nearestGridCoordinate(canvasPt.x, canvasPt.y);
        // don't let it be too low, or it will be hidden by tool panel
        if (gridPT.y >= this.hexCenterRows) { gridPT.y = this.hexCenterRows - 1; }
        if (gridPT.x <= 0) { gridPT.x = 1; } // at extreme zoom in can be a problem
        let data;

        if (numTiles == 1) {
            data = [{ x: 0, y: 0, h: 60, c: Puzzle.palette.default, f: TShirt.FLIP.BOTTOM }]
        } else if (numTiles == 2) {
            let yoffset = 0; // even column or odd column?
            if (gridPT.x % 2 == 0) { yoffset = 0; } else { yoffset = -1; }
            data = [
                { x: 0, y: 0 + yoffset, h: 0, c: Puzzle.palette.sideKick, f: TShirt.FLIP.BOTTOM }, // arm over guy
                { x: -1, y: -1, h: 60, c: Puzzle.palette.sideKick, f: TShirt.FLIP.BOTTOM }, // arm straight guy
            ];
        } else if (numTiles == 4) {
            let yoffset = 0; // even column or odd column?
            if (gridPT.x % 2 == 0) { yoffset = 0; } else { yoffset = -1; }
            data = [ // design this to work if we start with the main one on an even column number
                { x: 0, y: 0, h: -60, c: Puzzle.palette.top, f: TShirt.FLIP.TOP }, // main
                { x: 1, y: 0 - yoffset, h: 240, c: Puzzle.palette.surround, f: TShirt.FLIP.BOTTOM }, // right
                { x: 1, y: -1 - yoffset, h: 0, c: Puzzle.palette.surround, f: TShirt.FLIP.BOTTOM },// top 
                { x: 0, y: 1, h: 0, c: Puzzle.palette.surround, f: TShirt.FLIP.BOTTOM } // left side
            ];
        }

        let prevT;
        let tshirt;
        let firstT;
        for (let d of data) {
            tshirt = new TShirt(this, gridPT.x + d.x, gridPT.y + d.y, d.h, d.c, d.f);
            //console.log("made new tshirt from data @ " + tshirt.gridX + "," + tshirt.gridY + " flip=" + tshirt.flip);
            this.tshirts.add(tshirt);
            tshirt.beingDragged = true;
            tshirt.computePoints(tshirt.kitesForThisPosition());
            tshirt.drawOutline();
            // when we make a cluster larger than 1, create a linked list of the tshirts
            // where each will point to the one in the cluster made after it.
            if (prevT) { prevT.setGroupMate(tshirt); } //console.log(prevT.id + " linking to " + tshirt.id); }
            else { firstT = tshirt; }
            prevT = tshirt;
            this.selection.add(tshirt);
        }
        // is prevT ever null here?
        if (prevT) { prevT.setGroupMate(firstT); }
        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
        this.redoWorkAreas(workAreas);
        this.completedMove();
    }
    selectTShirtsByIds(tshirtIds) {
        this.selection.clear();
        for (let i = 0; i < tshirtIds.length; i++) {
            let t = this.getTShirtById(tshirtIds[i]);
            if (t) { this.selection.add(t); }
        }
    }
    getTShirtById(id) {
        for (let t of this.tshirts) {
            if (t.id == id) { return t; }
        }
    }
    gmMove(tshirtIds, x, y) {
        this.selectTShirtsByIds(tshirtIds);
        this.doGridMove(x, 0);
        this.doGridMove(0, y);

    }
    gmRotate(tshirtIds, degrees) {
        this.selectTShirtsByIds(tshirtIds);
        this.doRotate(degrees);
    }

    selectTShirtsBySTId(stIds) {
        this.selection.clear();
        for (let i = 0; i < stIds.length; i++) {
            let t = this.getTShirtBySTId(stIds[i]);
            if (t) { this.selection.add(t); }
        }
    }
    getTShirtBySTId(id) {
        return this.T2Super[id];
    }

    stMove(stId, x, y) {
        let superTile = this.superTileRoot.getById(stId);
        this.selection.clear();
        let tshirts = superTile.getAllTShirts();
        for (let t of tshirts) {
            this.selection.add(t);
        }
        this.doGridMove(x, y);
    }

    // input a range of super tile ids, and a rotation
    stRotate(stId, degrees) {
        let superTile = this.superTileRoot.getById(stId);
        this.selection.clear();
        let tshirts = superTile.getAllTShirts();
        for (let t of tshirts) {
            this.selection.add(t);
        }
        this.doRotate(degrees);
    }

    autoDraw() {
        this.superTileLevelsDrawn = 0;
        //console.time("autoDraw");
        this.SUPERTILE_DRAW_SUPPRESSION = true;
        this.autoDrawSuperTile(this.superTileRoot, Math.floor(this.hexCenterCols / 2), Math.floor(this.hexCenterRows / 2));
        // delete all the phantom t's that were used for alignment
        //console.timeEnd("autoDraw");

        //console.time("deleteOptionals");
        this.selection.clear();
        for (let t of this.tshirts) { if (t.phantom) { this.selection.add(t, false); } }
        this.deleteSelected();
        //console.timeEnd("deleteOptionals");

        // now select everything remaining and do a full redraw
        // some in the center are not getting neighbor marking colors- why?
        //console.time("gridMove");
        this.selection.clear();
        for (let t of this.tshirts) { this.selection.add(t, false); }

        this.doGridMove(0, 0);
        //console.timeEnd("gridMove");

        this.SUPERTILE_DRAW_SUPPRESSION = false;
        //console.time("fullRedraw");
        this.fullRedraw();
        this.drawSuperTiles(this.superTileRoot);
        //console.timeEnd("fullRedraw");
        this.selection.clear();
    }

    /**
    * 
    * Orientations get set top down as the SuperTiles are first made.
    * Now we build t-shirts and compute placements from the bottom up.
    * We start at level 1 (a level above the individual t-shirts) and create, then rotate all the children of a parent.
    * These will be small little clusters - an Cluster (H) of 4 T's, some F's and P's of two T's each, and a single T.
    * After a parent is create and we know everything at this level except final position, we move up a level and do positioning as a group.
    * So we make everything at essentially 0,0 (startX,startY) and spin them around. grid adjust as necessary for spinning.
    * then we move up a level and position the lower level.
    * then we move up a level and position the lower level.
    * repeat until we reach the top
    */
    autoDrawSuperTile(st, startX, startY) {
        if (st.level == 1) {
            //console.log(st.id + " " + st.name + "/" + st.level + " create the children");
            this.levelZeroCreateAndPlace(st, startX, startY);
            return;
        }
        // if level==1 we don't get here due to the return above, so for levels above 1 now ...
        if (st.children) {
            //console.log(st.fullId + " " + st.name + "/" + st.level + " has " + st.totalChildren + " children");
            for (const child of st.childArray) {
                this.autoDrawSuperTile(child, startX, startY);
            }
        } else { console.log("ERROR " + st.id + " " + st.name + "/" + st.level + " no children to do"); return; } // shouldn't ever see
        // done with children, do parent level stuff
        //console.log(st.id + " " + st.name + "/" + st.level + " " + st.totalChildren + " children done, parental duties next");
        this.higherLevelRotateAndMove(st);
        if (st.level > 2) {
            this.selection.clear();
            for (const t of st.getAllTShirts()) {
                if (t.phantom) { this.selection.add(t, false); }
            }
            this.deleteSelected();
        }
        //console.log("ending autoDrawSuperTile " + st.id + " " + st.name + "/" + st.level);
    }

    // when we hit this at level2, all of the children of level1 have been created (all the leave-level t-shirts)
    // they are sitting there in small clusters of t1, h1, p1, f1, just 1-4 tshirts, all at 0,0. they have been 
    // locally rotated to match their level 1 parent, so if you had an h2, the 3 h1's inside will all be rotated
    // accordingly, like one will be 240, another also 240, and a third 90.
    // so here we take those little buggers and we align them using the optional elements for placements, e.g. the optional
    // p on an h aligns to the p the next level up?
    //
    // then we rotate again, now that a higher level shape is put together, what rotation does the whole group need?
    higherLevelRotateAndMove(st) {
        //if (st.level >= SuperTile.requestedLevels - 1) {
        //    console.log("HLRM level " + st.level);
        //}
        const logHead = "\tHL R&M: id=" + st.fullId + " " + st.name + "/" + st.level + " ";
        const first = st.childZero; // what is the first SuperTile chld of this SuperTile

        // select and rotate the tshirts 
        // an h2 as part of an h3 has to be rotCCW from the center h1
        // my h2's are made as 240,240,0 (NE,NE,S) which is fine and dandy if they are centered on 
        this.selection.clear();
        for (const l of st.getAllTShirts()) { this.selection.add(l, false); };
        let desiredFirstOrientation = null;
        let stDeltaRot = null;
        let tshirtDeltaRot = null;

        if (st.name == "h") { desiredFirstOrientation = SuperTile.hParentSuperChildOrientationMap[st.orientation]; }
        else if (st.name == "t") { desiredFirstOrientation = SuperTile.tParentSuperChildOrientationMap[st.orientation]; }
        else if (st.name == "f" || st.name == "p") {
            desiredFirstOrientation = SuperTile.pfParentSuperChildOrientationMap[st.orientation];
            //console.log(logHead + " using fparentsuperchild[" + st.orientation + "] = " + desiredTShirtRotation);
        }

        stDeltaRot = SuperTile.getNumberRotations(first.orientation, desiredFirstOrientation);
        tshirtDeltaRot = stDeltaRot * -60;

        // rotate all the children of st
        this.doRotate(tshirtDeltaRot, true);
        // now we've rotated the t-shirts, but we have not updated the supertiles containing those t-shirts. we need to go through
        // all the child supertiles and update their orientation to their new actual orientation
        // you might ask, why isn't this all done long before we start creating t-shirts and so on.
        // because at the lowest level, we want to create the t-shirts while the ST's still have their default orientations. 
        // because we don't have an "alignBy" function at that level, we have hard-wired it. 
        // so we need them at a specific rotation in level 1, and then we can rotate them all together at higher levels.
        st.rotateChildrenToMatch(); // we may have just computed this above

        // move the t-shirts
        // done with children, now move them all based on the Fs info. he says hopefully.
        //console.log(logHead + "Now I will move the tshirts by ...");
        // if this is the first child in whole thing
        if (!this.parent && st.level > 1) { // dont do anything at the top level or level 1
            if (st.alignmentSibling) {
                //console.log(logHead + "aligning to sibling " + st.alignmentSibling.fullId);
                // 97 phantom goes on top of 17 real - (the 4th F child of - the 2nd hidden f) sits on the 1st f of the 1st h
                //                                     AP SuperTile 143 sits on top of Super Tile 26

                // to align an h2 to the center h12, its tshirts 39 and 4
                let alignBy = st.alignBy();
                // the damn odd/even column stuff strikes again, when you move an odd amount in x, your y-measurement may
                // now be off by 1. taking the lazy approach right now and just moving in x first, then recomputing the y
                // and moving the y second.
                this.doGridMove(alignBy.x, 0, true);
                alignBy = st.alignBy();
                this.doGridMove(0, alignBy.y, true);
                //console.log(logHead + " moved everyone by computed alignment " + alignBy.x + "," + alignBy.y);
            }
        }
    }

    levelZeroCreateAndPlace(st, startX, startY) {
        const logHead = "\tL0H C&P: id=" + st.fullId + " " + st.name + "/" + st.level + " ";
        // setup
        const first = st.childZero;// // at level one we had st.getFirstChild("t")
        //console.log(logHead + "got the zero child it is " + first.fullId + " " + first.name + "/" + first.level);

        // now we have to loop through all children (little t's) create them, rotate them, move them in that order
        for (const shapeName of st.children.keys()) {
            const children = st.children.get(shapeName);
            this.selection.clear();
            for (const c of children) {
                //console.log("supertile is visible = " + st.visible);
                // only make a tshirt if this child is visible, or if this is the zero cihld and the parent is not visible
                // then we make this so we can see the zerochild as a phantom t, or if this child itself is marked as not visible 
                // then make it so we can see it as a phantom t. this last case only happens on level 1 SuperTiles 
                if ((st.visible && c.visible) || st.childZero.id == c.id) {
                    let yadjust = 0;
                    const totalMove = startX; // this would change at a higher level
                    if (Math.abs(totalMove) % 2 != 0) {
                        if (Math.abs(c.x % 2 != 0)) { yadjust = 1; } // this would change at a higher level
                    }

                    const tshirt = new TShirt(this, startX + c.x, startY + c.y + yadjust, c.theading, null, c.tflipped);
                    if (!st.visible && c.id || !c.visible) { tshirt.phantom = true; }

                    // console.log("for child of " + st.fullId + " child " + c.fullId + " made tshirt " + tshirt.id);
                    this.superTile[tshirt.id] = c;
                    this.T2Super[c.id] = tshirt;
                    this.tshirts.add(tshirt);
                    c.setTShirt(tshirt);
                    this.selection.add(tshirt, false);

                }
            }
        }
        // rotate the tshirts 
        let desiredTShirtRotation = null;
        let deltaRot = null;
        //console.log(logHead + "find dcr st.name=" + st.name + " and st.orientation=" + st.orientation);
        // we need a way to decide when to use the *ParentSuperChildOrientationMap vs the *ParentChildOrientationMap
        // it's probably just at level = X or greater

        if (st.name == "h") { desiredTShirtRotation = SuperTile.hParentChildOrientationMap[st.orientation]; }
        else if (st.name == "t") { desiredTShirtRotation = SuperTile.tParentChildOrientationMap[st.orientation]; }
        else if (st.name == "f" || st.name == "p") { desiredTShirtRotation = SuperTile.pfParentChildOrientationMap[st.orientation]; }
        // the selection is still filled with all the t's at this level from the creation step above

        deltaRot = desiredTShirtRotation - first.theading;
        //console.log(logHead + "dcr = " + desiredTShirtRotation + " for its gang of " + this.selection.size() + " t's, first child is @ " + first.theading + " so rot by " + deltaRot);
        //console.log(logHead + "rotated " + st.fullId + " " + st.name + "/" + st.level + " and its " + this.selection.size() + " kids by " + deltaRot + " to match the " + st.orientation + " need");
        this.doRotate(deltaRot, true); // this rotates the t-shirts to align with what the SuperTile needs to be

        //levelZeroCreateAndPlace, rotation done now move all the children of st
        this.doGridMove(st.x, st.y, true); // at this level the alignment is hard-wired, at later levels it is computed
        //console.log( logHead + "moved " + st.fullId + " " + st.name + "/" + st.level + " and its " + this.selection.size() + " kids by hard-wired amt " + st.x+","+st.y);
    }

    quickAndDirtyAdd(data) {
        let workAreas = [];
        // this is what needs to happen
        Puzzle.addToWorkAreas(workAreas, this.selection.clear());
        let prevT;
        let tshirt;
        let firstT;
        for (let d of data) {
            //console.log("make new tshirt from data @ " + );
            let c = this.tshirtColors.default;
            if (d.flipped) { c = this.tshirtColors.top; }
            tshirt = new TShirt(this, d.x, d.y, d.heading, c, d.flipped);
            //console.log("made t" + tshirt.id + " @" + tshirt.gridX + "," + tshirt.gridY + " flip=" + tshirt.flip);
            this.tshirts.add(tshirt);
            tshirt.beingDragged = false;
            //tshirt.computePoints(tshirt.kitesForThisPosition());
            //tshirt.drawOutline();
            tshirt.gridMove(0, 0);
            tshirt.setLocationValidated();
            // when we make a cluster larger than 1, create a linked list of the tshirts
            // where each will point to the one in the cluster made after it.
            if (prevT) { prevT.setGroupMate(tshirt); } //console.log(prevT.id + " linking to " + tshirt.id); }
            else { firstT = tshirt; }
            prevT = tshirt;
            this.selection.add(tshirt);
        }
        // is prevT ever null here?
        if (prevT) { prevT.setGroupMate(firstT); }

        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
        this.redoWorkAreas(workAreas);
    }

    onMouseDown(event) {
        let workAreas = [];

        if (this.draggingPostPaste) { return; } // don't treat it as a new click.
        event.stopPropagation();
        this.mouseIsDown = true;

        // get the point in canvas coordinates where the user clicked
        let canvasPt = this.mouseToCanvasCoordinates(this.canvas, event);

        //console.log("click @" + event.clientX + "," + event.clientY + " canvas X=" + clickX + " Y=" + clickY);
        // things the puzzle needs to know to implement drag, this is where the drag starts.
        this.initialCanvasX = canvasPt.x;
        this.initialCanvasY = canvasPt.y;

        // if shift key is down 
        if (event.shiftKey) {
            for (const t of this.tshirts) {
                if (t.isPointInside(canvasPt.x, canvasPt.y)) {
                    if (t.selected) { // if the click is inside a tshirt already selected, deselect it
                        //workAreas.push(this.selection.remove(t)); // and remove any members of its group as well.
                        Puzzle.addToWorkAreas(workAreas, this.selection.remove(t));
                    } else {
                        //workAreas.push(this.selection.add(t));    // and add any members of its group as well
                        Puzzle.addToWorkAreas(workAreas, this.selection.add(t));
                    }
                }
            } // if the click is not inside any, do nothing
        } else { // if shift key is not down
            // is this click inside a tshirt? and is that shirt an already selected one?
            let insideTShirt = false;
            let insideAlreadySelected = false;
            var selectedT;
            for (const t of this.tshirts) {
                if (t.isPointInside(canvasPt.x, canvasPt.y)) {
                    insideTShirt = true;
                    if (t.selected) { insideAlreadySelected = true; }
                    selectedT = t;
                    break;
                }
            }
            // if the click is not inside any tshirt, unselect all
            // if the click is inside a non-selected tshirt, unselect all and select that one

            // unselect all, then if this click is on a new one, select it
            if (!insideTShirt || (insideTShirt && !insideAlreadySelected)) {
                Puzzle.addToWorkAreas(workAreas, this.selection.clear()); // clear puzzles record of what's selected, inform each tshirt
                //workAreas.push(wa);
            }
            if (insideTShirt && !insideAlreadySelected) {
                //let wa = this.selection.add(selectedT);
                //workAreas.push(wa);
                Puzzle.addToWorkAreas(workAreas, this.selection.add(selectedT));
            }
        }
        this.redoWorkAreas(workAreas);
        this.completedMove();
    }

    // define a function to return the indices of shared points.
    getCommonPoints(points1, points2) {
        this.commonPointCallCount++;
        const sharedPoints = [];
        //console.log("getCommonPoints: " + JSON.stringify(points1) + " vs " + JSON.stringify(points2) );
        const tolerance = 1.6;
        //console.log("length of points1=" + points1.length + " length of points2=" + points2.length);
        for (let i = 0; i < points1.length; i++) {
            for (let j = 0; j < points2.length; j++) {
                if (Math.abs(points1[i].x - points2[j].x) < tolerance && Math.abs(points1[i].y - points2[j].y) < tolerance) {
                    //console.log("points1["+i+"]="+ points1[i].x +"," + points1[i].y + 
                    //       " and points2["+j+"]="+ points2[j].x +"," + points2[j].y + " are close enough");
                    const newPt = [i, j];
                    sharedPoints.push(newPt);
                }
            }
        }
        return sharedPoints;
    }

    // define a function to find the number of points in common between two sets of T-shirts
    countCommonPointsInSets(set1, tshirt2, reviewedMap) { //set2) {
        let count = 0;
        for (const tshirt1 of set1) {
            if (tshirt1 != tshirt2) {
                const keyPair = Puzzle.getPairKey(tshirt1, tshirt2);
                if (!reviewedMap[keyPair]) {
                    reviewedMap[keyPair] = true;
                    const points1 = tshirt1.getPoints();
                    const points2 = tshirt2.getPoints();
                    count += this.getCommonPoints(points1, points2).length;
                }
            }
        }
        return count;
    }


    isContiguousWithSelection(test, reviewedMap) {
        return this.countCommonPointsInSets(this.selection.getSelection(), test, reviewedMap) >= 1;
    }

    inBounds(x, y) {
        return true;
    }

    onMouseMoveDocument(event) {
        if (this.selection.size() === 0) { return; }
        if (!this.mouseIsDown && !this.draggingPostPaste) { return; }
        // scroll up or down?
        const tray = document.getElementById('tray');
        const trayHeight = tray.offsetHeight;
        const scrollFactor = 10 / this.zoomLevel;
        if (event.clientY > (window.innerHeight - trayHeight * .8) * 0.9) { this.canvCont.scrollBy(0, scrollFactor); }
        if (event.clientY < window.innerHeight * 0.1) { this.canvCont.scrollBy(0, -scrollFactor); }
        // scroll left or right?
        if (event.clientX > (window.innerWidth * .8) * 0.9) { this.canvCont.scrollBy(scrollFactor, 0); }
        if (event.clientX < window.innerWidth * 0.1) { this.canvCont.scrollBy(-scrollFactor, 0); }
        this.onMouseMove(event);
    }

    onMouseMove(event) {
        // get the point in canvas coordinates where the mouse is
        let canvasPt = this.mouseToCanvasCoordinates(this.canvas, event);
        this.lastCanvasX = canvasPt.x;
        this.lastCanvasY = canvasPt.y;

        //console.log("mouse move @ " + event.clientX + "," + event.clientY);
        if (this.selection.size() === 0 || (!this.mouseIsDown && !this.draggingPostPaste)) {
            // not dragging a tshirt, nothing to do except maybe every 10 times ask the game to assess if the puzzle is done.
            if (this.moveCycles++ == 50) {
                this.moveCycles = 0;
                this.completedMove();
            }
            return;
        }

        let workAreas = [];
        // Calculate the new shape position based on the mouse movement, the new canvas position
        // is not involved in validity testing, it's just to show it at the exact point which may be
        // between grid points as we drag it around.
        const dxCanvas = canvasPt.x - this.initialCanvasX;
        const dyCanvas = canvasPt.y - this.initialCanvasY;
        //console.log( "click @ " + canvasPt.x + ", " + canvasPt.y + " initial canvas pt = (" + this.initialCanvasX + "," + this.initialCanvasY + ")");
        // Calculate the grid delta movement based on the mouse movement. It is important that all
        // objects in the selection have the exact same grid delta move. Previously we computed it 
        // one off for each object based on mapping that object's canvas move to it's nearest grid point
        // but in some rare cases that resulted in different grid moves for different objects in the selection
        const keyT = this.selection.getMinSelection();
        const keyNewGrid = Puzzle.nearestGridCoordinate(keyT.preChangeCanvasX + dxCanvas, keyT.preChangeCanvasY + dyCanvas);
        const dxGrid = keyNewGrid.x - keyT.preChangeGridX;
        const dyGrid = keyNewGrid.y - keyT.preChangeGridY;  // fix the dyGrid for the odd/even thing on each tshirt as it moves

        if (!this.isTrialMoveValid(keyT, dxCanvas, dyCanvas, dxGrid, dyGrid)) {
            // can we find the nearest point that is valid? 
            //console.log("trial move invalid returning - can't move " + dxGrid + "," + dyGrid);
        } else {
            Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
            for (const tshirt of this.selection.getSelection()) {
                tshirt.beingDragged = true;
                tshirt.canvasTrialMove();
            }
            // may be the same workarea, but it won't get added twice.
            Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());

        }
        this.redoWorkAreas(workAreas);
    }

    isTrialMoveValid(keyT, dxCanvas, dyCanvas, dxGrid, dyGrid) {
        if (this.selection.size() == 0) { return false; }

        let keyX = keyT.preChangeGridX;//  gridX; // what is keyX currently on
        let keyIsOnEven = (keyT.preChangeGridX) % 2 === 0; // is keyX currently on an even grid point?
        let keyWillBeOnEven = Math.abs(keyX + dxGrid) % 2 === 0;// will the key's new x position be even?
        let xMoveIsEven = Math.abs(dxGrid) % 2 === 0;

        for (const tshirt of this.selection.getSelection()) {
            let yadjust = 0;
            let thisXDist = tshirt.preChangeGridX - keyX; // how far in x distance is this tshirt from the key? 
            let thisXDistEven = Math.abs(thisXDist) % 2 === 0; // is this distance from key even?

            // we're moving an odd amount, and this tshirt is an odd amount away from the key
            // if we are currently on even then this tshirt needs a yadjust
            if (!xMoveIsEven && !thisXDistEven && keyIsOnEven) { yadjust = 1; }
            if (!xMoveIsEven && !thisXDistEven && keyWillBeOnEven) { yadjust = -1; }

            //let pt = Puzzle.nearestGridCoordinate(tshirt.gridX + dx, tshirt.gridY + dy);
            //console.log("  " + tshirt.id + " dyGrid=" + dyGrid + " this on even=" + tshirt.onEvenColumn() + " keyStart=" + keyStart + " yadj=" + yadjust);
            if (!tshirt.testCanvasTrialMove(dxCanvas, dyCanvas, dxGrid, dyGrid + yadjust)) {
                //console.log("isTrialMoveValid: t:" + tshirt.id + " is not valid here");
                return false;
            }
        }
        //console.log("isTrialMoveValid: all valid here");
        return true;
    }


    onMouseUp(event) {
        event.stopPropagation();
        this.mouseIsDown = false;
        this.draggingPostPaste = false;

        if (this.selection.size() === 0) { return; } // not dragging a tshirt, nothing to do
        let blockingTs = new Set();
        let workAreas = [];
        let wa = null;

        // now we have to move all of them together or none at all. 
        let canAllMove = true;
        for (const tshirt of this.selection.getSelection()) {
            if (!this.inBounds(tshirt.x, tshirt.y)) {
                canAllMove = false;
                break;
            }
            let kites = tshirt.kitesForPosition(tshirt.gridX, tshirt.gridY, tshirt.heading, tshirt.flip);
            let blockT = this.kitesAreOccupied(tshirt, kites);
            if (blockT) {
                canAllMove = false;
                blockingTs.add(blockT);
            }
        }

        // get where these T's are now.
        //if( this.selection.size()>0) { workAreas.push( this.selection.generateBBox() ) ;}
        Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());


        if (canAllMove) {
            // add a work area for the prechange position. this is not for snapping back really. it's to ensure repainting
            // of old neighbors that may have had neighbor labels. that may no longer apply after we have dragged the 
            // selection off to a new location.
            //wa = this.selection.generateBBox(true);
            //if (wa) { workAreas.push(wa); } // true indicates get the pre-change location
            Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox(true));
            for (const tshirt of this.selection.getSelection()) {
                tshirt.beingDragged = false;
                tshirt.gridMove(0, 0);
                tshirt.setLocationValidated();
            }
            // had we actually moved something other than 0,0 we would get a work area where they moved to.
        } else {
            //console.log("all can't move:" + this.selection.getSelection().size + " in selection");
            let deleteSet = new Set(); // we can't delete out of the set we are iterating through
            let keyT = this.selection.getMinSelection();
            if (!keyT.hasValidLocation()) { // we were dragging in from the "add new" buttons and these never landed on a valid home
                for (const tshirt of this.selection.getSelection()) {
                    tshirt.beingDragged = false;
                    this.tshirts.delete(tshirt);
                    deleteSet.add(tshirt);
                }
                this.selection.clear();
                // don't want to delete out of selection while we are iterating through selection so need this 2nd loop.
                //for (const tshirt of deleteSet) {
                //    this.selection.remove(tshirt);
                //}
            } else { // snap back to previous location
                for (const tshirt of this.selection.getSelection()) {
                    tshirt.beingDragged = false;
                    tshirt.restorePrechangeGrid(); // snap back to previous location
                }
                //wa = this.selection.generateBBox();
                //if( wa ) { workAreas.push(wa) }; // get area where they snapped back to
                Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());

            }
        }

        this.redoWorkAreas(workAreas);

        if (blockingTs.size > 0) { for (let b of blockingTs) { b.rattle(this.showSurround, this.showSideKick); } }

        this.canvas.focus();
        this.completedMove();
    }

    onPhantomsToggle() {
        if (this.SHOW_PHANTOMS) { this.SHOW_PHANTOMS = false; }
        else { this.SHOW_PHANTOMS = true; }
        this.fullRedraw();
    }
    onGridLinesToggle() {
        this.SHOW_KITES = this.SHOW_KITES * -1;
        this.fullRedraw();
    }
    onHexDotsToggle() {
        this.SHOW_HEX_DOTS = this.SHOW_HEX_DOTS * -1;
        this.fullRedraw();
    }
    copySelection() {
        if (this.draggingPostPaste) { return; } // can't copy again if you are still dragging around (haven't yet placed) the last copy
        this.selection.copySelectionToClipboard();
    }
    onKeyDown(event) {
        const dx = 1; // distance to move in honeycomb grid coordinates
        const dy = 1;
        const dHeading = 60;

        if ((event.metaKey || event.ctrlKey) && event.keyCode === 67) {
            this.copySelection();
        }
        // Mac: Command+V (Key code: 86), Windows: Ctrl+V (Key code: 86)
        else if ((event.metaKey || event.ctrlKey) && event.keyCode === 86) {
            this.onAddNewFromPaste();
        }
        // Handle other key presses using switch statement
        else {
            switch (event.key) {
                case "g":
                    this.onGridLinesToggle();
                    break;
                case "p":
                    this.onPhantomsToggle();
                    break;
                case "m":
                    Shape.autoArrange(this, this.ctx);
                    break;
                case "d":
                    this.onHexDotsToggle();
                    break;
                case "ArrowUp":
                    if (this.isGridMoveValid(0, -dy)) { this.doGridMove(0, -dy); }
                    break;
                case "ArrowDown":
                    if (this.isGridMoveValid(0, dy)) { this.doGridMove(0, dy); }
                    break;
                case "ArrowLeft":
                    if (this.isGridMoveValid(-dx, 0)) { this.doGridMove(-dx, 0); }
                    break;
                case "ArrowRight":
                    if (this.isGridMoveValid(dx, 0)) { this.doGridMove(dx, 0); }
                    break;
                case "r":
                    if (this.isRotateValid(dHeading)) { this.doRotate(dHeading); }
                    break;
                case "t":
                    if (this.isRotateValid(-dHeading)) { this.doRotate(-dHeading); }
                    break;
                case "f":
                    this.doFlip(); // this will first check if its valid
                    break;
                case "x":
                    this.deleteSelected();
                    break;
                case "_":
                    this.zoom(-1);
                    break;
                case "-":
                    this.zoom(-1);
                    break;
                case "+":
                    this.zoom(1);
                    break;
                case "=":
                    this.zoom(1);
                    break;
                case "0":
                    this.zoom(999); // kind of a hack, special number to reset zoom to 1
                    break;
                case "c":
                    this.paletteIndex++;
                    this.tshirtColors=Puzzle.palette[this.paletteIndex % Puzzle.palette.length];
                    this.fullRedraw();
                    break;
                case "i":
                    console.log("selection:" + this.selection.logInfo());
                    break;
                //case "s":
                //    console.log("superTile:");
                //    this.superTileRoot = SuperTile.generateSuperTile("h", 5, SuperTile.SOUTH_WEST);
                //    this.autoDraw();
                //    //this.superTileRoot.logTheTree(true);
                //    break;
                case "1":
                    this.toggleSuperTileDrawLevel(1);
                    break;
                case "2":
                    this.toggleSuperTileDrawLevel(2);
                    break;
                case "3":
                    this.toggleSuperTileDrawLevel(3);
                    break;
                case "4":
                    this.toggleSuperTileDrawLevel(4);
                    break;
                case "5":
                    this.toggleSuperTileDrawLevel(5);
                    break;
                case "6":
                    this.toggleSuperTileDrawLevel(6);
                    break;
                case "z":
                    this.toggleShowingTShirts();
                    break;
            }
        }
    }


    toggleSuperTileDrawLevel(level) {
        if (this.autoDrawShape) {
            if (this.superTileLevelIsOn[level]) { this.superTileLevelIsOn[level] = false; }
            else { this.superTileLevelIsOn[level] = true; }
            this.fullRedraw();
        }
    }
    toggleShowingTShirts() {
        if (this.autoDrawShape) { // only enable this if we have an autodraw shape
            if (this.drawTShirts) { this.drawTShirts = false; }
            else { this.drawTShirts = true; }
            this.fullRedraw();
        }
    }

    deleteSelected() {
        let workAreas = null;
        if (!this.SUPERTILE_DRAW_SUPPRESSION) {
            workAreas = [];
            Puzzle.addToWorkAreas(workAreas, this.selection.generateBBox());
        }
        for (let t of this.selection.getSelection()) {
            t.delete();
            this.tshirts.delete(t);
            this.clearTShirtLocation(t);
        }
        if (!this.SUPERTILE_DRAW_SUPPRESSION) {
            this.redoWorkAreas(workAreas);
            this.completedMove();
        }
        this.selection.clear(); // put this after redoWorkAreas so that we can do a neighbor relationship check on those deleted
    }

    // select the one clicked on and all contiguous to it
    onDoubleClick(event) {
        // Inelegant: we have to keep going through all of them until you stop adding more new ones.
        // is there a better way?
        let size = this.selection.size();
        const reviewedMap = {};
        do {
            size = this.selection.size();
            for (const t of this.tshirts) {
                if (!this.selection.getSelection().has(t)) {
                    if (this.isContiguousWithSelection(t, reviewedMap)) { this.selection.add(t); }
                }
            }
        }
        while (size != this.selection.size());
        this.redoWorkAreas([this.selection.generateBBox()]);
        this.completedMove();
    }

    zoomIn() { this.zoom(1); }
    zoomOut() { this.zoom(-1); }
    zoom(x) {

        let left = this.canvCont.scrollLeft / this.zoomLevel;
        let right = left + this.canvCont.clientWidth / this.zoomLevel;
        let top = this.canvCont.scrollTop / this.zoomLevel;
        let bottom = top + this.canvCont.clientHeight / this.zoomLevel;

        const preCenterX = (right - left) / 2 + left;
        const preCenterY = (bottom - top) / 2 + top;

        //console.log("zoom " + x + " from zoom level " + this.zoomLevel);
        // bit of a hack with a special number to reset zoom to 1
        if (x == 999) { this.zoomLevel = 1; }
        else {
            this.zoomLevel = this.zoomLevel * (1 + (x / 10));
            if (this.zoomLevel < 0.03) { this.zoomLevel = 0.03; }
            else if (this.zoomLevel > 4.0) { this.zoomLevel = 4.0; }
        }
        this.setCanvasSizeAndOffset(); // note this may alter the zoom to ensure it doesn't exceed pixel limits
        this.fullRedraw();

        left = this.canvCont.scrollLeft / this.zoomLevel;
        right = left + this.canvCont.clientWidth / this.zoomLevel;
        top = this.canvCont.scrollTop / this.zoomLevel;
        bottom = top + this.canvCont.clientHeight / this.zoomLevel;

        const postCenterX = (right - left) / 2 + left;
        const postCenterY = (bottom - top) / 2 + top;

        // compute scroll amount in canvas coordinates and then convert to screen pixels
        let xScroll = (preCenterX - postCenterX) / 2;
        let yScroll = (preCenterY - postCenterY) / 2;
        this.canvCont.scrollBy(xScroll * this.zoomLevel * 2, yScroll * this.zoomLevel * 2);

    }

    displayHelp() {
        //console.log("display help");
        this.game.displayHelpDialog();
    }

    displayHint() {
        //console.log("hints are " + this.showHints);
        this.showHints += 1;
        // 0 no hints
        // 1 shadows
        // 2 guides
        // 3 guides and shadows
        if (!this.showMetaHints && this.showHints > 1) { this.showHints = 0; } // we have no guide
        if (this.showHints > 3) { this.showHints = 0; } // roll over
        console.log("changed hint to " + this.showHints);
        this.fullRedraw();
    }

    // define the download function
    downloadJSON() {
        const data = {
            grid: { width: this.hexCenterCols, height: this.hexCenterRows, borderBuffer: Puzzle.BORDER_BUFFER, zoomLevel: this.zoomLevel },
            tshirts: []
        };

        for (const tshirt of this.tshirts) {
            const td = tshirt.serialize();
            data.tshirts.push(td);
        }

        const filename = 'tshirts.json';
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  
    uploadJSON(event) {
        var that = this; // store reference to this
        var files = event.target.files; // FileList object
        let f = "";
        for (var i = 0; f = files[i]; i++) {
            var reader = new FileReader();
            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    let json = JSON.parse(e.target.result);
                    that.initializeDataStructures(json.grid, json.grid.zoomLevel); // clear out all other data structures
                    Puzzle.BORDER_BUFFER = 0;
                    if (json.grid.borderBuffer) { Puzzle.BORDER_BUFFER = json.grid.borderBuffer; } 
                    let newTs = TShirt.createTShirtsFromJSON(that, json.tshirts);
                    for (let t of newTs) { that.tshirts.add(t); }
                    that.validateTShirtLocations();
                    that.selectAll();
                    that.touchAllSelected(); // forces a recompute, via gridmove(0,0);
                    that.fullRedraw();
                }
            })(f);
            reader.readAsText(f);
        }
    }

    /*
    *  At right, we see in our hexagonal grid, the even numbered columns sit above on the this.canvas coordinate system
    *  while the odd numbered columns sit below. All three of the cells shown have the same y-coordinate in the hex grid.
    *  
    *                                          0 1  2  
    *                                         __    __
    *                                        /  \__/  \
    *                                        \__/  \__/
    *                                        /  \__/  \
    *                                        \__/  \__/
    */

    findNeighboringHexagon(x, y, heading) {
        if (heading < 0) { heading = 360 + heading; }
        if (heading >= 360) { heading = heading - 360; }
        if (x % 2 == 0) { // the even columns
            switch (heading) {
                case 0: return { x: x, y: y - 1 }; break;
                case 60: return { x: x - 1, y: y - 1 }; break;
                case 120: return { x: x - 1, y: y }; break;
                case 180: return { x: x, y: y + 1 }; break;
                case 240: return { x: x + 1, y: y }; break;
                case 300: return { x: x + 1, y: y - 1 }; break;
            }
        }
        else { // the odd columns
            switch (heading) {
                case 0: return { x: x, y: y - 1 }; break;
                case 60: return { x: x - 1, y: y }; break;
                case 120: return { x: x - 1, y: y + 1 }; break;
                case 180: return { x: x, y: y + 1 }; break;
                case 240: return { x: x + 1, y: y + 1 }; break;
                case 300: return { x: x + 1, y: y }; break;
            }
        }
    }

    /**
     * move from g.x,g.y by dx,dy adjusting for odd/even column alignment
     * then rotate the vector from original point to the adjusted point by r degrees
     * return the point at the end of the rotated vector
     * @param g.x x-coordinate of starting grid point
     * @param g.y y-coordinate of starting grid point
     * @param dx - amount offset from g.x
     * @param dy - amount offset from g.y
     * @param r - amount to rotate the vector dx,dy arounf g.x,g.y
     * @returns 
     */
    static gridCoordinateAdjust(g, dx, dy, r = g.heading) {
        let yoffset = 0;
        if (g.x % 2 == 1 && Math.abs(dx) % 2 == 1) { yoffset = 1; }

        // now we need to add rotateGridVector, and then do we need to repeat the yoffset bit?
        let np = { x: g.x + dx, y: g.y + dy + yoffset };
        let d = Puzzle.normalizeDegrees(r);
        let np2 = Puzzle.rotateGridVector(np, g, Puzzle.normalizeDegrees(d));
        return { x: np2.x, y: np2.y };
    }

    /**
     * 
     * @param {*} gridPoint the end of the vector you want rotated 
     * @param {*} rotationOrigin the origin  of the vector, the point about which you are rotating it
     * @param {*} angle the angle through which it should be rotated
     * @returns 
     */
    // should probably be static method like above
    static rotateGridVector(gridPoint, rotationOrigin, angle) {
        //console.log("rotateGridVector: gridPoint is " + gridPoint.x + "," + gridPoint.y 
        //+ " rotationOrigin is " + rotationOrigin.x + "," + rotationOrigin.y + " angle is " + angle );
        angle *= -1;
        let canvasPoint = Puzzle.gridToCanvas(gridPoint.x, gridPoint.y, Puzzle.KITE_SIZE);
        let canvasOrigin = Puzzle.gridToCanvas(rotationOrigin.x, rotationOrigin.y, Puzzle.KITE_SIZE);
        let canvasVector = { x: canvasPoint.x - canvasOrigin.x, y: canvasPoint.y - canvasOrigin.y };

        let rotVector = {
            x: canvasVector.x * Math.cos(Puzzle.degreesToRadians(angle))
                - canvasVector.y * Math.sin(Puzzle.degreesToRadians(angle)),
            y: canvasVector.x * Math.sin(Puzzle.degreesToRadians(angle))
                + canvasVector.y * Math.cos(Puzzle.degreesToRadians(angle))
        };
        //console.log("rotVector is " + rotVector.x + "," + rotVector.y);
        let newCanvasPt = { x: rotVector.x + canvasOrigin.x, y: rotVector.y + canvasOrigin.y };
        //console.log( "newCanvasPt is " + newCanvasPt.x + "," + newCanvasPt.y );
        let newGridPt = Puzzle.nearestGridCoordinate(newCanvasPt.x, newCanvasPt.y);
        //console.log( "newGridPt is " + newGridPt.x + "," + newGridPt.y );
        return newGridPt;
    }

    rotateKites(heading, flip, kites) {
        //console.log("rotateKites received: heading=" + heading + " flip=" + flip + " kites=" + kites);
        let newKites = [];
        let rot = Math.round(heading / 60);
        // (for every 60-degree rotation add 1 at each index)
        for (let k of kites) {
            newKites.push((k + rot) % 6);
        }
        //console.log("rotateKites returning: " + newKites);
        return newKites;
    }

    kitesAreOccupied(tshirt, kitesData) {
        // this tshirt can only occupy kites at its location and neighboring locations
        // so let's just check in the grid area +/- 1 around this 
        for( let x = tshirt.gridX -1 ; x<=tshirt.gridX+1; x++ ) { 
            for( let y = tshirt.gridY -1 ; y<=tshirt.gridY+1; y++ ) {
                let t = this.getTShirtAtLocation( x,y ) ;
                //  for (const t of this.tshirts) {
                if( t && t != tshirt && !t.selected) { if (t.hasKite(kitesData) && !t.phantom) { return t; } }
            }
        }
        return null;
    }

    static degreesToRadians(d) { return d * Math.PI / 180.0; }
    static radiansToDegrees(r) { return r * 180 / Math.PI; }
    static normalizeDegrees(d) {
        if (d < 0) { d += 360; }
        if (d >= 360) { d -= 360; }
        return d;
    }

    mouseToCanvasCoordinates(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = this.zoomLevel; //window.innerWidth / this.canvas.width ; 
        const scaleY = this.zoomLevel; // window.innerHeight / this.canvas.height; 

        const xscroll = window.scrollX;// we don't scroll the window, we are only scrolling the canvas.
        const yscroll = window.scrollY;
        const x = (event.clientX - rect.left - xscroll) / scaleX - this.canvasXOffset;
        const y = (event.clientY - rect.top - yscroll) / scaleY - this.canvasYOffset;
        /* 
                // debugging  code  
                const containerWidth = this.canvCont.offsetWidth;
             
                console.log("zl="+ this.zoomLevel + " xScale=" + scaleX + 
                    "\nrect=" + rect.left + "," + rect.top + " to " + rect.right + "," + rect.bottom +
                    "\nwin.width=" + window.innerWidth + " can.width=" + this.canvas.width +
                    "\ncontainer.width=" + containerWidth +
                    "\nxoffset=" + this.canvasXOffset + " yoffset=" + this.canvasYOffset +
                    "\nmouse @ " + event.clientX +"," + event.clientY + " => canvas " + x + "," + y);
                
                // to debug, this is where the click is in canvas coordinates 
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(x,y,10,10);
        */
        return { x: x, y: y };
    }

    static gridToCanvas(x, y, size) {
        let yOffset = 0;
        const cx = 3 * size * x + Puzzle.CANVAS_BUFFER;
        if (Math.abs(x % 2) == 1) {
            yOffset = size * Math.sqrt(3);
        }
        const cy = Math.sqrt(3) * 2 * size * y + Puzzle.CANVAS_BUFFER + yOffset;
        return { x: cx, y: cy };
    }

    static nearestGridCoordinate(canvasX, canvasY) {
        let yOffset = 0;
        let x = Math.floor((canvasX - Puzzle.CANVAS_BUFFER) / (3 * Puzzle.KITE_SIZE) + 0.5); // floor + half instead of 'round up'
        if (x % 2 == 1) { yOffset = Puzzle.KITE_SIZE * Math.sqrt(3); }
        let y = Math.floor((canvasY - Puzzle.CANVAS_BUFFER - yOffset) / (Math.sqrt(3) * 2 * Puzzle.KITE_SIZE) + 0.5);
        return this.annotateGridPointInBounds({ x: x, y: y, outOfBounds: false, bestX: x, bestY: y });
    }

    static annotateGridPointInBounds(gp) {
        gp.outOfBounds = false;
        if (gp.x < Puzzle.MIN_GRID_X) { gp.outOfBounds = true; gp.bestX = Puzzle.MIN_GRID_X; }
        if (gp.y < Puzzle.MIN_GRID_Y) { gp.outOfBounds = true; gp.bestY = Puzzle.MIN_GRID_Y; }
        if (gp.x > Puzzle.MAX_GRID_X) { gp.outOfBounds = true; gp.bestX = Puzzle.MAX_GRID_X; }
        if (gp.y > Puzzle.MAX_GRID_Y) { gp.outOfBounds = true; gp.bestY = Puzzle.MAX_GRID_Y; }
        //  console.log("gridPoint is " + gp.x + "," + gp.y + " out of bounds = " + gp.outOfBounds);
        return gp;
    }

    // all this effort to bring in the workAreas and only draw points inside them was 
    // to prevent the gridpoints from being drawn on top of themselves multiple times 
    // which apparently causes them to get bigger on the canvas. 
    drawGridPoints(workAreas, buffer) {
        if (!workAreas) {
            workAreas = [];
            let bb = new BoundingBox("full redraw");
            let upperLeft = Puzzle.gridToCanvas(-2, -2, Puzzle.KITE_SIZE);
            let lowerRight = Puzzle.gridToCanvas(this.hexCenterCols + 2, this.hexCenterRows + 2, Puzzle.KITE_SIZE);
            bb.addPoint(upperLeft.x, upperLeft.y);
            bb.addPoint(lowerRight.x, lowerRight.y);
            workAreas.push(bb);
        }
        if (this.SHOW_HEX_DOTS == -1) { return; }

        for (let i = -2; i < this.hexCenterCols + 2; i++) {
            for (let j = -2; j < this.hexCenterRows + 2; j++) {
                let center = Puzzle.gridToCanvas(i, j, Puzzle.KITE_SIZE);
                if (center) {
                    // only draw the point if its in a work area, 
                    // otherwise the points get bigger and thicker from redrawing them on top of each other
                    for (let wa of workAreas) {
                        if (wa.contains(center, buffer)) {
                            this.ctx.fillStyle = 'black'; // dot color
                            this.ctx.fillRect(Math.floor(center.x) - 1.0, Math.floor(center.y) - 1.0, 2.0, 2.0);
                            //this.ctx.fillText( ( i + "," + j), center.x, center.y - 5)
                        } //else { console.log("point not in workarea");}
                    }
                }
            }
        }
    }


    drawShadows() {
        //console.log("drawShadows() showHints=" + this.showHints );
        if (this.showHints == 1 || this.showHints == 3) {
            if (this.targets) {
                //console.log("we have shadows");
                for (let i = 0; i < this.targets.length; i++) {
                    let shape = this.targets[i];
                    let shadows = shape.getAllShadows();
                    //console.log("got all shadows of shape: " + shape.id + ", there are " + shadows.length + " of them");
                    for (let j = 0; j < shadows.length; j++) {
                        let t = shadows[j];
                        if (!this.isLocationOccupiedAndAligned(t.x, t.y, t.heading, t.flip)) {
                            let canvasPt = Puzzle.gridToCanvas(t.x, t.y, Puzzle.KITE_SIZE);
                            TShirt.drawOutlineShadow(canvasPt.x, canvasPt.y,
                                Puzzle.normalizeDegrees(t.heading),
                                t.flip, t.colorName,
                                Puzzle.KITE_SIZE,
                                this.ctx, i);
                        }
                    }
                }
            }
        }
    }

    drawGuides() {
        if (!this.targets) { return; }
        if (this.showMetaHints && (this.showHints == 2 || this.showHints == 3)) {
            //console.log("draw guides we have some" );
            let rt3 = Math.sqrt(3);
            for (let g of this.targets) {
                g.drawShape(this.ctx, Puzzle.KITE_SIZE, g.shapeLevel);
            }
        }
    }

    logStats() {
        let total = 0;
        let flipped = 0;
        //let solo = 0; 
        for (let t of p.tshirts) {
            if (!t.phantom) { total++; }
            if (t.flip == 1 && !t.phantom) { flipped++; }
            //if (t.flip == 0 && !t.surround && !t.disjoint && (this.sideKickNeighbors == null || this.sideKickNeighbors.size == 0)) { solo++; } 
        }
        console.log("total T's " + total);
        console.log("flipped " + flipped);
        //console.log( "solo " + solo );
    }

};

