document.addEventListener("DOMContentLoaded", () => {
    const menu = document.getElementById("arcade-menu");
    const gameScreen = document.getElementById("game-screen");
    const gameContainer = document.getElementById("game-container");
    const backBtn = document.getElementById("back-to-menu");

    const games = {
        safecracker: SafecrackerGame,    // from safecracker.js
        chainrush: ChainRushGame,        // from chainrush.js
        hitmanmemory: HitmanMemoryGame   // from hitmanmemory.js
    };

    document.querySelectorAll(".play-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const gameName = e.target.closest(".game-card").dataset.game;
            menu.style.display = "none";
            gameScreen.style.display = "block";

            // Start the game
            gameContainer.innerHTML = ""; // clear old game
            games[gameName].init(gameContainer, firebase); // pass firebase for scoring
        });
    });

    backBtn.addEventListener("click", () => {
        gameScreen.style.display = "none";
        menu.style.display = "block";
        gameContainer.innerHTML = "";
    });
});
