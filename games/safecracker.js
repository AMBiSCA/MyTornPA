const SafecrackerGame = (() => {
    let container, firebaseApp, score = 0, targetNumber, attempts = 0;
    let input, feedback, timerEl, gameInterval, timeLeft = 60; // 60-second timer

    function init(parentContainer, firebaseInstance) {
        container = parentContainer;
        firebaseApp = firebaseInstance;
        score = 0;
        attempts = 0;
        timeLeft = 60;

        // Generate a random 3-digit safe code
        targetNumber = Math.floor(Math.random() * 900) + 100;

        renderGame();
        startTimer();
    }

    function renderGame() {
        container.innerHTML = `
            <h2>Safecracker</h2>
            <p>Crack the 3-digit safe code! You have 60 seconds.</p>
            <div id="safe-game">
                <input type="number" id="safe-input" placeholder="Enter code" min="100" max="999">
                <button id="submit-code">Try!</button>
                <p id="feedback"></p>
                <p>Score: <span id="score">0</span></p>
                <p>Time Left: <span id="time-left">60</span>s</p>
            </div>
        `;

        input = container.querySelector("#safe-input");
        feedback = container.querySelector("#feedback");
        timerEl = container.querySelector("#time-left");

        container.querySelector("#submit-code").addEventListener("click", checkCode);
        input.addEventListener("keypress", function(e){
            if(e.key === "Enter") checkCode();
        });
    }

    function checkCode() {
        const guess = parseInt(input.value);
        if (!guess || guess < 100 || guess > 999) {
            feedback.textContent = "Enter a 3-digit number!";
            return;
        }

        attempts++;
        if (guess === targetNumber) {
            score += 100; // bonus for correct code
            feedback.textContent = `Correct! +100 points. New code generated.`;
            generateNewCode();
        } else {
            let hint = guess < targetNumber ? "Too low!" : "Too high!";
            feedback.textContent = `${hint} (-1 point)`;
            score = Math.max(0, score - 1);
        }
        container.querySelector("#score").textContent = score;
        input.value = "";
        input.focus();
    }

    function generateNewCode() {
        targetNumber = Math.floor(Math.random() * 900) + 100;
    }

    function startTimer() {
        gameInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        clearInterval(gameInterval);
        feedback.textContent = `Time's up! Final Score: ${score}`;

        // Save to Firebase
        const user = firebaseApp.auth().currentUser;
        if (user) {
            const db = firebaseApp.firestore();
            db.collection("arcadeScores").add({
                userId: user.uid,
                game: "safecracker",
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                feedback.textContent += " — Score saved!";
            }).catch(err => {
                console.error("Error saving score:", err);
            });
        } else {
            feedback.textContent += " — Log in to save your score.";
        }
    }

    return { init };
})();