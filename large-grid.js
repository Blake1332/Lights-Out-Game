// Canvas-based renderer for large grids (> 20x20)
// Replaces thousands of DOM buttons with a single canvas element, also uses a bitwise solver for large grids ITS WAY FASTER! 
//this is only used for large grids, small grids use the DOM buttons whcih are easier to understand and more closly follow the 3 elemtary row operations of gaussian elimination

const largeGrid = (() => {
    let canvas, ctx;
    let gridSize = 0;
    let state = null; 
    let cellSize = 0;
    let gap = 2;
    let padding = 6;
    let onCellClick = null; // callback 

    const COLOR_ON = "#4caf50";
    const COLOR_OFF = "#000";
    const COLOR_BG = "#ccc";
    const COLOR_WIN = "#4caf50";

    // Calculate cell size to fit nicely on screen
    const calcCellSize = () => {
        const maxCanvas = Math.min(window.innerWidth - 40, 700);
        const available = maxCanvas - padding * 2 + gap;
        return Math.max(3, Math.floor(available / gridSize) - gap);
    };

    // canvas size
    const canvasSize = () => {
        return padding * 2 + gridSize * cellSize + (gridSize - 1) * gap;
    };

    // Draw a cell
    const drawCell = (index, color) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = padding + col * (cellSize + gap);
        const y = padding + row * (cellSize + gap);
        const radius = Math.min(3, cellSize / 4);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, radius);
        ctx.fill();
    };

    // Draw all the cells
    const drawAll = () => {
        const size = canvasSize();
        ctx.fillStyle = COLOR_BG;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < gridSize * gridSize; i++) {
            drawCell(i, state[i] === 1 ? COLOR_ON : COLOR_OFF);
        }
    };

    // Get cell index from mouse coordinates, or -1 if in gap/padding
    const cellFromCoords = (mx, my) => {
        const col = Math.floor((mx - padding) / (cellSize + gap));
        const row = Math.floor((my - padding) / (cellSize + gap));
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return -1;

        // Check if click is within the cell (not in the gap)
        const cellX = padding + col * (cellSize + gap);
        const cellY = padding + row * (cellSize + gap);
        if (mx < cellX || mx >= cellX + cellSize || my < cellY || my >= cellY + cellSize) return -1;

        return row * gridSize + col;
    };

    // Toggle a single cell in state and redraw it
    const toggleCell = (id) => {
        if (id < 0 || id >= gridSize * gridSize) return;
        state[id] ^= 1;
        drawCell(id, state[id] === 1 ? COLOR_ON : COLOR_OFF);
    };

    // Toggle cell and its neighbours
    const toggleNeighbours = (id) => {
        const row = Math.floor(id / gridSize);
        const col = id % gridSize;

        toggleCell(id);
        if (row > 0) toggleCell(id - gridSize);
        if (row < gridSize - 1) toggleCell(id + gridSize);
        if (col > 0) toggleCell(id - 1);
        if (col < gridSize - 1) toggleCell(id + 1);
    };

    // Click handler
    const handleClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        const id = cellFromCoords(mx, my);
        if (id !== -1 && onCellClick) {
            onCellClick(id);
        }
    };

    // Initialize the canvas
    const init = (size, initialState, clickCallback) => {
        gridSize = size;
        onCellClick = clickCallback;
        state = new Uint8Array(gridSize * gridSize);

        if (initialState) {
            for (let i = 0; i < state.length; i++) {
                state[i] = initialState[i] ? 1 : 0;
            }
        }

        cellSize = calcCellSize();

        canvas = document.getElementById("large-grid-canvas");
        ctx = canvas.getContext("2d");

        const dim = canvasSize();
        canvas.width = dim;
        canvas.height = dim;
        canvas.style.width = dim + "px";
        canvas.style.height = dim + "px";
        canvas.style.display = "block";

        // Remove old listener and add new one
        canvas.removeEventListener("click", handleClick);
        canvas.addEventListener("click", handleClick);

        drawAll();
    };

    // Hide the canvas
    const destroy = () => {
        if (canvas) {
            canvas.style.display = "none";
            canvas.removeEventListener("click", handleClick);
        }
        state = null;
        gridSize = 0;
    };

    // Return state as a regular array (for solver )
    const getState = () => {
        if (!state) return [];
        return Array.from(state);
    };

    // Check if all cells are off
    const checkAllOff = () => {
        if (!state) return true;
        for (let i = 0; i < state.length; i++) {
            if (state[i] === 1) return false;
        }
        return true;
    };

    // Bitwise solver using array
    // Each row of the coefficient matrix is an array of 32-bit words
    const solve = () => {
        const n = gridSize * gridSize;
        const words = Math.ceil(n / 32);

        // Build coefficient matrix as array
        const A = [];
        for (let i = 0; i < n; i++) {
            const row = new Uint32Array(words);
            // Set bit for current cell
            row[i >> 5] |= (1 << (i & 31));
            // Set bits for neighbours
            const r = Math.floor(i / gridSize);
            const c = i % gridSize;
            if (r > 0) { const nb = i - gridSize; row[nb >> 5] |= (1 << (nb & 31)); }
            if (r < gridSize - 1) { const nb = i + gridSize; row[nb >> 5] |= (1 << (nb & 31)); }
            if (c > 0) { const nb = i - 1; row[nb >> 5] |= (1 << (nb & 31)); }
            if (c < gridSize - 1) { const nb = i + 1; row[nb >> 5] |= (1 << (nb & 31)); }
            A.push(row);
        }

        const b = new Uint8Array(state);

        // Gaussian elimination in Z2 with XOR opp
        for (let i = 0; i < n; i++) {
            //check if bit is set in row for pivoting
            const word = i >> 5;
            const bit = 1 << (i & 31);

            let pivot = i;
            while (pivot < n && (A[pivot][word] & bit) === 0) pivot++;
            if (pivot === n) continue;

            // Swap rows
            if (pivot !== i) {
                const tmpA = A[i]; A[i] = A[pivot]; A[pivot] = tmpA;
                const tmpB = b[i]; b[i] = b[pivot]; b[pivot] = tmpB;
            }

            // Eliminate all other rows 
            for (let j = 0; j < n; j++) {
                if (j !== i && (A[j][word] & bit) !== 0) {
                    for (let k = 0; k < words; k++) {
                        A[j][k] ^= A[i][k];
                    }
                    b[j] ^= b[i];
                }
            }
        }

        // solution
        const solution = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            if (b[i] === 1) solution[i] = 1;
        }
        return solution;
    };

    // Win animation
    const playWinAnimation = (message, onComplete) => {
        if (!state || !canvas) {
            showModal(message, true);
            if (onComplete) onComplete();
            return;
        }

        canvas.removeEventListener("click", handleClick);

        const totalStyles = 12;
        const style = Math.floor(Math.random() * totalStyles);
        const centerR = (gridSize - 1) / 2;
        const centerC = (gridSize - 1) / 2;

        // Build animation
        const waves = new Int32Array(gridSize * gridSize);
        let maxWave = 0;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const idx = row * gridSize + col;
                let w;
                switch (style) {
                    case 0: w = row; break;
                    case 1: w = (gridSize - 1) - row; break;
                    case 2: w = col; break;
                    case 3: w = (gridSize - 1) - col; break;
                    case 4: w = row + col; break;
                    case 5: w = row + (gridSize - 1 - col); break;
                    case 6: w = (gridSize - 1 - row) + col; break;
                    case 7: w = (gridSize - 1 - row) + (gridSize - 1 - col); break;
                    case 8: w = Math.round(Math.abs(row - centerR) + Math.abs(col - centerC)); break;
                    case 9:
                        w = Math.round(Math.abs(row - centerR) + Math.abs(col - centerC));
                        w = Math.round(centerR + centerC) - w;
                        break;
                    case 10:
                        w = Math.max(Math.min(row, gridSize - 1 - row), Math.min(col, gridSize - 1 - col));
                        w = Math.floor((gridSize - 1) / 2) - w;
                        if (w < 0) w = 0;
                        break;
                    case 11:
                        w = Math.max(Math.round(Math.abs(row - centerR)), Math.round(Math.abs(col - centerC)));
                        break;
                }
                waves[idx] = w;
                if (w > maxWave) maxWave = w;
            }
        }

        // Use faster delays for large grids, or it takes too long
        const waveDelay = Math.max(10, Math.floor(80 / Math.max(1, gridSize / 20)));
        const holdTime = 300;

        // Light up wave 
        for (let w = 0; w <= maxWave; w++) {
            setTimeout(() => {
                for (let i = 0; i < waves.length; i++) {
                    if (waves[i] === w) {
                        drawCell(i, COLOR_WIN);
                    }
                }
            }, w * waveDelay);
        }

        // Fade out wave 
        const allLitTime = (maxWave + 1) * waveDelay;
        for (let w = 0; w <= maxWave; w++) {
            setTimeout(() => {
                for (let i = 0; i < waves.length; i++) {
                    if (waves[i] === w) {
                        drawCell(i, COLOR_OFF);
                    }
                }
            }, allLitTime + holdTime + (w * waveDelay));
        }

        //  Finish animation 
        const totalTime = allLitTime + holdTime + ((maxWave + 1) * waveDelay) + 200;
        setTimeout(() => {
            canvas.addEventListener("click", handleClick);
            if (onComplete) onComplete();
            showModal(message, true);
        }, totalTime);
    };

    return {
        init,
        destroy,
        toggleNeighbours,
        toggleCell,
        getState,
        checkAllOff,
        solve,
        drawAll,
        drawCell,
        playWinAnimation,
        get gridSize() { return gridSize; },
        get active() { return state !== null; }
    };
})();
