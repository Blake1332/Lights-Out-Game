// Show a message instead of alert
const showModal = (message, isWin = false) => {
    const box = $("#modal-box");
    $("#modal-message").text(message);
    box.removeClass("win");
    if (isWin) box.addClass("win");
    $("#modal-overlay").addClass("visible");
};

$("#modal-close-btn").on("click", function() {
    $("#modal-overlay").removeClass("visible");
});

$("#modal-overlay").on("click", function(e) {
    if (e.target === this) {
        $(this).removeClass("visible");
    }
});

$(document).ready(function() {
    let gridSize = 6; // Default grid size
    let moves = 0; // Counter for moves
    let solution = []; // Store the solution globally

    const isLargeGrid = () => gridSize > 20;

    // canvas (large grid mode)
    const onCanvasCellClick = (id) => {
        largeGrid.toggleNeighbours(id);
        moves++;
        $("#move-counter").text(moves);
        checkWin();
    };

    // Create the grid
    const createGrid = (initialState = null) => {
        if (isLargeGrid()) {
            // Canvas mode for large grids
            $('#grid-container').hide().empty();
            largeGrid.init(gridSize, initialState, onCanvasCellClick);
        } else {
            // DOM buttons for small grids
            largeGrid.destroy();
            const gridContainer = $('#grid-container');
            gridContainer.show().empty();
            gridContainer.css({
                "grid-template-columns": `repeat(${gridSize}, 1fr)`,
                "grid-template-rows": `repeat(${gridSize}, 1fr)`,
            });

            for (let i = 0; i < gridSize * gridSize; i++) {
                const button = $("<button>")
                    .addClass(initialState && initialState[i] === 1 ? "on" : "off")
                    .attr("data-id", i);
                gridContainer.append(button);
            }
        }
    };

    // Toggle light state
    const toggleLight = (id) => {
        if (isLargeGrid()) {
            largeGrid.toggleCell(id);
        } else {
            const button = $(`[data-id="${id}"]`);
            button.toggleClass("on off");
        }
    };

    // Toggle current button and neighbours
    const toggleNeighbours = (id) => {
        if (isLargeGrid()) {
            largeGrid.toggleNeighbours(id);
        } else {
            const row = Math.floor(id / gridSize);
            const col = id % gridSize;

            toggleLight(id); // Current button
            if (row > 0) toggleLight(id - gridSize); // Top
            if (row < gridSize - 1) toggleLight(id + gridSize); // Bottom
            if (col > 0) toggleLight(id - 1); // Left
            if (col < gridSize - 1) toggleLight(id + 1); // Right
        }
    };

    // Randomize the current grid
    const randomizeGrid = () => {
        moves = 0;
        solution = [];
        $("#move-counter").text(moves);
        const state = Array.from(
            { length: gridSize * gridSize },
            () => Math.round(Math.random())
        );
        createGrid(state);
    };

    // Check if the game is won
    const checkWin = () => {
        const allOff = isLargeGrid()
            ? largeGrid.checkAllOff()
            : $("#grid-container button").filter(".on").length === 0;
        if (allOff) {
            const message = `Congratulations! You won in ${moves} moves!`;
            if (isLargeGrid()) {
                largeGrid.playWinAnimation(message, randomizeGrid);
            } else {
                playWinAnimation(message, randomizeGrid);
            }
        }
    };

    // Handle button click on the grid
    $("#grid-container").on("click", "button", function() {
        const id = parseInt($(this).attr("data-id"));
        toggleNeighbours(id);
        moves++;
        $("#move-counter").text(moves);
        checkWin();
    });

    // When grid size button is clicked
    $(".grid-size-btn").on("click", function() {
        stopAutoSolve();
        gridSize = parseInt($(this).data("size")); // Get grid size from button
        moves = 0; // Reset moves
        solution = []; // Reset solution
        $("#move-counter").text(moves);
        const initialState = Array.from(
            { length: gridSize * gridSize },
            () => Math.round(Math.random())
        );
        createGrid(initialState); 
    });

    // Reset button is clicked
    $("#reset-btn").on("click", function() {
        stopAutoSolve();
        moves = 0;
        solution = []; // Reset solution
        $("#move-counter").text(moves);
        createGrid(null); 
    });

    // Get the current state of the grid
    const getGridState = () => {
        if (isLargeGrid()) {
            return largeGrid.getState();
        }
        const buttons = $("#grid-container button");
        const state = [];
        buttons.each(function() {
            state.push($(this).hasClass("on") ? 1 : 0);
        });
        return state;
    };

    // Solve the game using linear algebra
    const solveGame = () => {
        //this uses the bitwise solver for large grids, its way faster
        //its more complex to understand and the method below is easier to understand and more closly follow the 3 elemtary row operations of gaussian elimination
        
        if (isLargeGrid()) {
            return largeGrid.solve();
        }
        const n = gridSize * gridSize;
        const A = []; // Coefficient matrix
        const b = getGridState(); // Current state of the grid

        // Construct the coefficient matrix A
        for (let i = 0; i < n; i++) {
            const row = new Array(n).fill(0);
            row[i] = 1; // Current button
            const r = Math.floor(i / gridSize);
            const c = i % gridSize;
            if (r > 0) row[i - gridSize] = 1; // Top
            if (r < gridSize - 1) row[i + gridSize] = 1; // Bottom
            if (c > 0) row[i - 1] = 1; // Left
            if (c < gridSize - 1) row[i + 1] = 1; // Right

            A.push(row);
        }

        // Gaussian elimination in Z2
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
    $('#solve-btn').on('click', function() {
        // If no solution exists yet, generate one
        if (solution.length === 0) {
            solution = solveGame();

            // Check if the grid is unsolvable
            if (solution === null) {
                showModal("No solution exists");
                return; // Exit the function early
            }
        }

        //im evil (:
        // the old way used to always pick the first cell and then the second cell and so on
        //if you know anything about linear algebra you know that the order of the cells does not matter
        //so we pick a random cell from the remaining solution presses
        // this way it looks more random and less predictable (and more fun)
        const remaining = [];
        solution.forEach((press, idx) => { if (press === 1) remaining.push(idx); });
        if (remaining.length > 0) {
            const nextStepIndex = remaining[Math.floor(Math.random() * remaining.length)];
            toggleNeighbours(nextStepIndex);
            moves++;
            $('#move-counter').text(moves);
            solution[nextStepIndex] = 0;
        } else {
            showModal("No solution exists. Refresh page if stuck.");
        }

        checkWin();
    });

    // Set custom grid from user input
    $("#set-custom-grid").on("click", function() {
        let input = $("#custom-grid-input").val().trim();

        // Remove commas from the input if possible
        input = input.replace(/,/g, "");

        if (input.length === gridSize * gridSize) {
            const initialState = input.split("").map(Number);
            moves = 0; // Reset moves
            solution = []; // Reset solution
            $("#move-counter").text(moves);
            createGrid(initialState); // Create grid with custom state
        } else {
            showModal("Please enter a valid state.");
        }
    });

    // Handle custom grid size button click
    $("#custom-size-btn").on("click", function() {
        stopAutoSolve();
        const customSize = parseInt($("#custom-size-input").val());
        if (customSize && customSize >= 1 && customSize <= 100) { //we should set a upper bound but that is no fun for now lets keep it 100 and make the cpu hate us (:
            gridSize = customSize;
            moves = 0;
            solution = []; 
            $("#move-counter").text(moves);
            const initialState = Array.from(
                { length: gridSize * gridSize },
                () => Math.round(Math.random())
            );
            createGrid(initialState); 
        } else {
            showModal("Please enter a valid grid size (1-100).");
        }
    });

    // Initialize the game 
    const initialState = Array.from(
        { length: gridSize * gridSize },
        () => Math.round(Math.random())
    );
    createGrid(initialState);
});

// Auto-solver stuff
let autoSolveIntervalId = null;

const stopAutoSolve = () => {
    if (autoSolveIntervalId !== null) {
        clearInterval(autoSolveIntervalId);
        autoSolveIntervalId = null;
        $("#auto-solve-btn").prop("disabled", false);
    }
};

$("#auto-solve-btn").on("click", function() {
    // Disable the auto-solve button when its pressed
    $(this).prop("disabled", true);

    autoSolveIntervalId = setInterval(function() {
        // Check if solved
        const allOff = largeGrid.active
            ? largeGrid.checkAllOff()
            : $("#grid-container button").filter(".on").length === 0;
        if (allOff) {
            stopAutoSolve();
            const message = "The game has been solved!";
            if (largeGrid.active) {
                largeGrid.playWinAnimation(message, randomizeGrid);
            } else {
                playWinAnimation(message, randomizeGrid);
            }
            return;
        }

        // Call the hint button
        $("#solve-btn").click();

        if (solution.length === 0) {
            stopAutoSolve();
            showModal("The game is unsolvable.");
        }
    }, Math.max(1, parseInt($("#solve-speed-input").val()) || 250));
});


$(document).ready(function() {
    $("#toggle-experimental-btn").on("click", function() {

        const experimentalSection = $("#experimental");

        if (experimentalSection.is(":visible")) {

            experimentalSection.hide();

            $(this).text("Show Advanced Options");

        } else {

            experimentalSection.show();

            $(this).text("Hide Advanced Options");

        }

    });

    // Toggle How to Play popup
    $("#rules-toggle-btn").on("click", function() {
        $("#rules-popup").toggle();
    });

});
