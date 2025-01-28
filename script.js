$(document).ready(function () {
    let gridSize = 3; // Default grid size
    let moves = 0;
    let solution = []; // Store the solution globally

    // Create the grid
    const createGrid = (initialState = null) => {
        const gridContainer = $('#grid-container');
        gridContainer.empty(); // Clear any existing grid
        gridContainer.css({
            'grid-template-columns': `repeat(${gridSize}, 1fr)`,
            'grid-template-rows': `repeat(${gridSize}, 1fr)`,
        });

        for (let i = 0; i < gridSize * gridSize; i++) {
            const button = $('<button>')
                .addClass(initialState && initialState[i] === 1 ? 'on' : 'off')
                .attr('data-id', i);
            gridContainer.append(button);
        }
    };

    // Toggle light state
    const toggleLight = (id) => {
        const button = $(`[data-id="${id}"]`);
        button.toggleClass('on off');
    };

    // Toggle current button and neighbours
    const toggleNeighbours = (id) => {
        const row = Math.floor(id / gridSize);
        const col = id % gridSize;

        toggleLight(id); // Current button
        if (row > 0) toggleLight(id - gridSize); // Top
        if (row < gridSize - 1) toggleLight(id + gridSize); // Bottom
        if (col > 0) toggleLight(id - 1); // Left
        if (col < gridSize - 1) toggleLight(id + 1); // Right
    };

    // Check if the game is won
    const checkWin = () => {
        const allOff = $('#grid-container button').filter('.on').length === 0;
        if (allOff) {
            alert(`Congratulations! You won in ${moves} moves!`);
        }
    };

    // Handle button click on the grid
    $('#grid-container').on('click', 'button', function () {
        const id = parseInt($(this).attr('data-id'));
        toggleNeighbours(id);
        moves++;
        $('#move-counter').text(moves);
        checkWin();
    });

    // when grid size button is clicked
    $('.grid-size-btn').on('click', function () {
        gridSize = parseInt($(this).data('size')); // Get grid size from button
        moves = 0; // Reset moves
        solution = []; // Reset solution
        $('#move-counter').text(moves);
        createGrid(); // Recreate the grid
    });

    // reset button is clicked
    $('#reset-btn').on('click', function () {
        moves = 0;
        solution = []; // Reset solution
        $('#move-counter').text(moves);
        createGrid();
    });

    // Get the current state of the grid
    const getGridState = () => {
        const buttons = $('#grid-container button');
        const state = [];
        buttons.each(function () {
            state.push($(this).hasClass('on') ? 1 : 0);
        });
        return state;
    };

    // Solve the game using linear algebra
    const solveGame = () => {
        const n = gridSize * gridSize;
        const A = []; // Coefficient matrix
        const b = getGridState(); // Current state of the grid

        // Construct the coefficient matrix A
        for (let i = 0; i < n; i++) {
            const row = new Array(n).fill(0);
            row[i] = 1; //current
            const r = Math.floor(i / gridSize);
            const c = i % gridSize;
            if (r > 0) row[i - gridSize] = 1; // Top 
            if (r < gridSize - 1) row[i + gridSize] = 1; // Bottom 
            if (c > 0) row[i - 1] = 1; // Left 
            if (c < gridSize - 1) row[i + 1] = 1; // Right
            A.push(row);
        }
        // Gaussian elimination Z2
        for (let i = 0; i < n; i++) {
            let pivot = i;
            while (pivot < n && A[pivot][i] === 0) pivot++;
            if (pivot === n) continue; // No pivot found, skip

            // Swap rows
            if (pivot !== i) {
                [A[i], A[pivot]] = [A[pivot], A[i]];
                [b[i], b[pivot]] = [b[pivot], b[i]];
            }

            // Eliminate all other rows
            for (let j = 0; j < n; j++) {
                if (j !== i && A[j][i] === 1) {
                    for (let k = 0; k < n; k++) {
                        A[j][k] ^= A[i][k];
                    }
                    b[j] ^= b[i];
                }
            }
        }
        
        // Extract the solution
        const solution = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            if (b[i] === 1) {
                solution[i] = 1;
            }
        }
        return solution;
    };


// Solve the game step by step
$('#solve-btn').on('click', function () {
    // Always regenerate the solution based on the current grid state
    //I dont think this is needed but its here
    solution = solveGame();

    // Find the next step in the solution
    const nextStepIndex = solution.findIndex((press) => press === 1);
    if (nextStepIndex !== -1) {
        toggleNeighbours(nextStepIndex);
        moves++;
        $('#move-counter').text(moves);
        solution[nextStepIndex] = 0; 
    } else {
        alert("No more hints available.");
    }

    checkWin();
});

    // Set custom grid from user input
    $('#set-custom-grid').on('click', function () {
        let input = $('#custom-grid-input').val().trim();

        // Remove commas from the input if possible
        input = input.replace(/,/g, '');

        if (input.length === gridSize * gridSize) {
            const initialState = input.split('').map(Number);
            moves = 0; // Reset moves
            solution = []; // Reset solution
            $('#move-counter').text(moves);
            createGrid(initialState); // Create grid with custom state
        } else {
            alert("Please enter a valid grid state.");
        }
    });

    // Initialize the game
    createGrid();
});

$(document).ready(function() {
    // Event listener for grid size buttons
    $('.grid-size-btn').click(function() {
        const size = $(this).data('size');
        $('#solvability-message').text('');
        // unsolvable
        if (size === 4 || size ===5) {
            $('#solvability-message').text('Not always solvable');
        }
       
    });


});