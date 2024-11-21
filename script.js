$(document).ready(function () {
    let gridSize = 3; // Default grid size
    let moves = 0;

    // Create the grid
    const createGrid = () => {
        const gridContainer = $('#grid-container');
        gridContainer.empty(); // Clear any existing grid
        gridContainer.css({
            'grid-template-columns': `repeat(${gridSize}, 1fr)`,
            'grid-template-rows': `repeat(${gridSize}, 1fr)`,
        });

        for (let i = 0; i < gridSize * gridSize; i++) {
            const button = $('<button>')
                .addClass('on')
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

    // Handle grid size button click
    $('.grid-size-btn').on('click', function () {
        gridSize = parseInt($(this).data('size')); // Get grid size from button
        moves = 0; // Reset moves
        $('#move-counter').text(moves);
        createGrid(); // Recreate the grid
    });

    // Reset the grid
    $('#reset-btn').on('click', function () {
        moves = 0;
        $('#move-counter').text(moves);
        createGrid();
    });

    // Initialize the game
    createGrid();
});
