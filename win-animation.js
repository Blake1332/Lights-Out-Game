// Win animation - cascading green waterfall across grid cells
//this is fun to look at but not good for performance

let winAnimationPlaying = false;

const playWinAnimation = (message, onComplete = null) => {
    if (winAnimationPlaying) return;
    winAnimationPlaying = true;

    const buttons = $("#grid-container button");
    const totalCells = buttons.length;
    if (totalCells === 0) {
        showModal(message, true);
        winAnimationPlaying = false;
        if (onComplete) onComplete();
        return;
    }

    const gridSize = Math.round(Math.sqrt(totalCells));

    // Disable grid clicks during animation
    $("#grid-container").css("pointer-events", "none");

    // Pick at random! (:
    const totalStyles = 12;
    const style = Math.floor(Math.random() * totalStyles);

   
    const cells = [];

 
    const centerR = (gridSize - 1) / 2;
    const centerC = (gridSize - 1) / 2;

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            let wave;

            switch (style) {
                case 0: // Top to bottom
                    wave = row;
                    break;
                case 1: // Bottom to top
                    wave = (gridSize - 1) - row;
                    break;
                case 2: // Left to right
                    wave = col;
                    break;
                case 3: // Right to left
                    wave = (gridSize - 1) - col;
                    break;
                case 4: // Diagonal from top-left
                    wave = row + col;
                    break;
                case 5: // Diagonal from top-right
                    wave = row + (gridSize - 1 - col);
                    break;
                case 6: // Diagonal from bottom-left
                    wave = (gridSize - 1 - row) + col;
                    break;
                case 7: // Diagonal from bottom-right
                    wave = (gridSize - 1 - row) + (gridSize - 1 - col);
                    break;
                case 8: // Rings expanding from center (diamond)
                    wave = Math.round(Math.abs(row - centerR) + Math.abs(col - centerC));
                    break;
                case 9: // Rings collapsing to center
                    wave = Math.round(Math.max(Math.abs(row - centerR) + Math.abs(col - centerC)) );
                    // Invert so outer ring is wave 0
                    wave = Math.round(centerR + centerC) - wave;
                    break;
                case 10: // Box rings from outside in (chebyshev)
                    wave = Math.max(
                        Math.min(row, gridSize - 1 - row),
                        Math.min(col, gridSize - 1 - col)
                    );
                    // Invert: outermost ring first
                    wave = Math.floor((gridSize - 1) / 2) - wave;
                    if (wave < 0) wave = 0;
                    break;
                case 11: // Box rings from inside out ( reverse chebyshev)
                    wave = Math.max(
                        Math.round(Math.abs(row - centerR)),
                        Math.round(Math.abs(col - centerC))
                    );
                    break;
            }

            cells.push({ index, wave });
        }
    }

   
    const maxWave = Math.max(...cells.map(c => c.wave));

    const waveDelay = 130; // ms between each wave
    const holdTime = 400; // ms to hold all lit before fading out

    //Light up wave 
    for (let w = 0; w <= maxWave; w++) {
        setTimeout(() => {
            cells.filter(c => c.wave === w).forEach(c => {
                buttons.eq(c.index).addClass("win-glow").removeClass("off on");
            });
        }, w * waveDelay);
    }

    // Fade out wave 
    const allLitTime = (maxWave + 1) * waveDelay;

    for (let w = 0; w <= maxWave; w++) {
        setTimeout(() => {
            cells.filter(c => c.wave === w).forEach(c => {
                buttons.eq(c.index).removeClass("win-glow").addClass("off");
            });
        }, allLitTime + holdTime + (w * waveDelay));
    }

    //  finish animation
    const totalTime = allLitTime + holdTime + ((maxWave + 1) * waveDelay) + 200;
    setTimeout(() => {
        $("#grid-container").css("pointer-events", "");
        winAnimationPlaying = false;
        if (onComplete) onComplete();
        showModal(message, true);
    }, totalTime);
};
