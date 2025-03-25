document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        xMoves: [],
        oMoves: [],
        scores: {
            X: 0,
            O: 0
        },
        gameActive: true,
        gameMode: 'pvp',
        aiDifficulty: 'medium'
    };

    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const currentPlayerDisplay = document.getElementById('current-player');
    const scoreXDisplay = document.getElementById('score-x');
    const scoreODisplay = document.getElementById('score-o');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const placeSound = document.getElementById('place-sound');
    const modeToggle = document.getElementById('mode-toggle');
    const difficultySelect = document.getElementById('difficulty-select');
    const gameBoard = document.querySelector('.game-board');
    const winnerDisplay = document.createElement('div');
    winnerDisplay.className = 'winner-display';

    // Add winner display to game board
    gameBoard.parentNode.insertBefore(winnerDisplay, gameBoard.nextSibling);

    // Initialize game
    initGame();

    // Event listeners
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    resetBtn.addEventListener('click', resetBoard);
    themeToggle.addEventListener('click', toggleTheme);
    modeToggle.addEventListener('click', toggleGameMode);
    difficultySelect.addEventListener('change', (e) => {
        gameState.aiDifficulty = e.target.value;
    });

    // Check for saved theme preference
    checkThemePreference();

    function initGame() {
        gameState.board.fill(null);
        gameState.currentPlayer = 'X';
        gameState.xMoves = [];
        gameState.oMoves = [];
        gameState.gameActive = true;
        
        // Clear the board visually
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.style.visibility = 'visible';
        });
        
        // Hide difficulty selector in PvP mode
        difficultySelect.style.display = gameState.gameMode === 'ai' ? 'block' : 'none';
        
        // Hide reset button and winner display during gameplay
        resetBtn.style.display = 'none';
        winnerDisplay.style.display = 'none';
        winnerDisplay.textContent = '';
        
        // Update turn indicator
        updateTurnIndicator();
    }

    function toggleGameMode() {
        gameState.gameMode = gameState.gameMode === 'pvp' ? 'ai' : 'pvp';
        modeToggle.textContent = gameState.gameMode === 'pvp' ? 'Switch to AI Mode' : 'Switch to 2 Player';
        difficultySelect.style.display = gameState.gameMode === 'ai' ? 'block' : 'none';
        resetBoard();
    }

    function handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));
        
        // Check if cell is empty and game is active
        if (gameState.board[index] || !gameState.gameActive) return;
        
        makeMove(index);
    }

    function makeMove(index) {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        
        // Play sound
        playSound();
        
        // Update game state
        gameState.board[index] = gameState.currentPlayer;
        
        // Add to current player's moves
        const currentPlayerMoves = gameState.currentPlayer === 'X' ? gameState.xMoves : gameState.oMoves;
        currentPlayerMoves.push(index);
        
        // Mark oldest move as dull if player has 3 moves
        if (currentPlayerMoves.length === 3) {
            const oldestCell = document.querySelector(`.cell[data-index="${currentPlayerMoves[0]}"]`);
            oldestCell.classList.add('dull');
        }
        
        // Update cell visually
        cell.textContent = gameState.currentPlayer;
        cell.classList.add(gameState.currentPlayer.toLowerCase());
        cell.classList.remove('dull'); // New moves are never dull
        
        // Check for win
        const winPattern = checkWin();
        if (winPattern) {
            endGame(winPattern);
            return;
        }
        
        // Remove oldest move if current player has more than 3 moves
        if (currentPlayerMoves.length > 3) {
            const oldestMove = currentPlayerMoves.shift();
            fadeOutCell(oldestMove, () => {
                gameState.board[oldestMove] = null;
            });
            
            // Mark new oldest as dull if we still have 3 moves
            if (currentPlayerMoves.length === 3) {
                const newOldestCell = document.querySelector(`.cell[data-index="${currentPlayerMoves[0]}"]`);
                newOldestCell.classList.add('dull');
            }
        }
        
        // Switch player
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        updateTurnIndicator();
        
        // AI move if in AI mode
        if (gameState.gameMode === 'ai' && gameState.gameActive && gameState.currentPlayer === 'O') {
            setTimeout(() => {
                const aiMove = getAIMove();
                if (aiMove !== -1) {
                    makeMove(aiMove);
                }
            }, 500);
        }
    }

    function fadeOutCell(index, callback) {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.classList.add('fade-out');
        
        setTimeout(() => {
            cell.textContent = '';
            cell.className = 'cell';
            if (callback) callback();
        }, 500);
    }

    function checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (gameState.board[a] && 
                gameState.board[a] === gameState.board[b] && 
                gameState.board[a] === gameState.board[c]) {
                return pattern;
            }
        }
        return null;
    }

    function endGame(winPattern) {
        gameState.scores[gameState.currentPlayer]++;
        updateScores();
        gameState.gameActive = false;
        
        // Display winner with confetti
        winnerDisplay.textContent = `${gameState.currentPlayer} Wins!`;
        winnerDisplay.className = `winner-display ${gameState.currentPlayer}-win`;
        winnerDisplay.style.display = 'block';
        createConfetti();
        
        // Show reset button
        resetBtn.style.display = 'block';
        
        // Highlight winning cells
        highlightWinningCells(winPattern);
    }

    function highlightWinningCells(winPattern) {
        cells.forEach(cell => {
            cell.classList.remove('win-highlight');
        });
        
        winPattern.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            cell.classList.add('win-highlight');
        });
    }

    function updateTurnIndicator() {
        currentPlayerDisplay.textContent = gameState.currentPlayer;
        currentPlayerDisplay.className = gameState.currentPlayer === 'X' ? 'X-turn' : 'O-turn';
    }

    function updateScores() {
        scoreXDisplay.textContent = gameState.scores.X;
        scoreODisplay.textContent = gameState.scores.O;
    }

    function resetBoard() {
        initGame();
    }

    function playSound() {
        if (placeSound) {
            placeSound.currentTime = 0;
            placeSound.play();
        }
    }

    function createConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        updateThemeIcon(isDarkMode);
    }

    function updateThemeIcon(isDarkMode) {
        const icon = themeToggle.querySelector('i');
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    function checkThemePreference() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
        updateThemeIcon(darkMode);
    }

    function getAIMove() {
        const emptyCells = gameState.board
            .map((cell, index) => cell === null ? index : null)
            .filter(val => val !== null);
        
        if (emptyCells.length === 0) return -1;
        
        switch (gameState.aiDifficulty) {
            case 'easy':
                return getRandomMove(emptyCells);
            case 'medium':
                return Math.random() < 0.5 ? getSmartMove(emptyCells) : getRandomMove(emptyCells);
            case 'hard':
                return getSmartMove(emptyCells);
            default:
                return getRandomMove(emptyCells);
        }
    }

    function getRandomMove(emptyCells) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    function getSmartMove(emptyCells) {
        // Check for immediate win
        for (const index of emptyCells) {
            const boardCopy = [...gameState.board];
            boardCopy[index] = 'O';
            if (checkWinOnBoard(boardCopy, 'O')) {
                return index;
            }
        }
        
        // Block opponent's immediate win
        for (const index of emptyCells) {
            const boardCopy = [...gameState.board];
            boardCopy[index] = 'X';
            if (checkWinOnBoard(boardCopy, 'X')) {
                return index;
            }
        }
        
        // Try to take center if available
        if (emptyCells.includes(4)) return 4;
        
        // Take a corner if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => emptyCells.includes(corner));
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any edge
        const edges = [1, 3, 5, 7];
        const availableEdges = edges.filter(edge => emptyCells.includes(edge));
        if (availableEdges.length > 0) {
            return availableEdges[Math.floor(Math.random() * availableEdges.length)];
        }
        
        // Fallback to random move
        return getRandomMove(emptyCells);
    }

    function checkWinOnBoard(board, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return board[a] === player && 
                   board[a] === board[b] && 
                   board[a] === board[c];
        });
    }
});