const ChainRushGame = (() => {
    let container, firebaseApp, score = 0, targets = [], spawnInterval, gameInterval, timeLeft = 30; // 30-second game
    const maxTargets = 5;

    function init(parentContainer, firebaseInstance) {
        container = parentContainer;
        firebaseApp = firebaseInstance;
        score = 0;
        timeLeft = 30;
        targets = [];

        renderGame();
        startSpawning();
        startTimer();
    }

    function renderGame() {
        container.innerHTML = `
            <h2>Chain Rush</h2>
            <p>Click the targets fast to keep your chain alive! 30 seconds countdown.</p>
            <div id="chain-game">
                <div id="target-area"></div>
                <p>Score: <span id="score">0</span></p>
                <p>Time Left: <span id="time-left">30</span>s</p>
                <p id="feedback"></p>
            </div>
        `;

        container.querySelector("#target-area").addEventListener("click", targetClicked);
    }

    function spawnTarget() {
        const area = container.querySelector("#target-area");
        if (targets.length >= maxTargets) return;

        const target = document.createElement("div");
        target.classList.add("target");
        target.style.top = Math.random() * 80 + "%";
        target.style.left = Math.random() * 80 + "%";
        area.appendChild(target);
        targets.push(target);

        // Remove target after 2 seconds if not clicked
        setTimeout(() => {
            if (targets.includes(target)) {
                area.removeChild(target);
                targets = targets.filter(t => t !== target);
            }
        }, 2000);
    }

    function targetClicked(e) {
        if (!e.target.classList.contains("target")) return;

        // Remove target and update score
        const area = container.querySelector("#target-area");
        area.removeChild(e.target);
        targets = targets.filter(t => t !== e.target);
        score += 10;
        container.querySelector("#score").textContent = score;
    }

    function startSpawning() {
        spawnInterval = setInterval(spawnTarget, 800); // spawn every 0.8s
    }

    function startTimer() {
        const timerEl = container.querySelector("#time-left");
        gameInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    function endGame() {
        clearInterval(gameInterval);
        clearInterval(spawnInterval);
        container.querySelector("#feedback").textContent = `Time's up! Final Score: ${score}`;

        // Save to Firebase
        const user = firebaseApp.auth().currentUser;
        if (user) {
            const db = firebaseApp.firestore();
            db.collection("arcadeScores").add({
                userId: user.uid,
                game: "chainrush",
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                container.querySelector("#feedback").textContent += " — Score saved!";
            }).catch(err => {
                console.error("Error saving score:", err);
            });
        } else {
            container.querySelector("#feedback").textContent += " — Log in to save your score.";
        }
    }

    return { init };
})();
