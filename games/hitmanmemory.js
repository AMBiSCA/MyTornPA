const HitmanMemoryGame = (() => {
    let container, firebaseApp, score = 0, cards = [], flipped = [], matches = 0, timeLeft = 60;
    const totalPairs = 6; // 12 cards total

    function init(parentContainer, firebaseInstance) {
        container = parentContainer;
        firebaseApp = firebaseInstance;
        score = 0;
        matches = 0;
        timeLeft = 60;
        flipped = [];
        cards = [];

        renderGame();
        startTimer();
    }

    function renderGame() {
        container.innerHTML = `
            <h2>Hitman Memory</h2>
            <p>Match weapons to targets! 60 seconds countdown.</p>
            <div id="memory-game">
                <div id="card-grid"></div>
                <p>Score: <span id="score">0</span></p>
                <p>Time Left: <span id="time-left">60</span>s</p>
                <p id="feedback"></p>
            </div>
        `;

        const grid = container.querySelector("#card-grid");
        const cardValues = generateCards();

        cardValues.forEach(value => {
            const card = document.createElement("div");
            card.classList.add("memory-card");
            card.dataset.value = value;
            card.textContent = "?"; // hidden initially
            card.addEventListener("click", flipCard);
            grid.appendChild(card);
            cards.push(card);
        });
    }

    function generateCards() {
        const baseCards = [];
        for (let i = 1; i <= totalPairs; i++) {
            baseCards.push(i);
            baseCards.push(i);
        }
        // Shuffle
        for (let i = baseCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [baseCards[i], baseCards[j]] = [baseCards[j], baseCards[i]];
        }
        return baseCards;
    }

    function flipCard(e) {
        const card = e.target;
        if (flipped.includes(card) || card.classList.contains("matched")) return;

        card.textContent = card.dataset.value;
        flipped.push(card);

        if (flipped.length === 2) {
            checkMatch();
        }
    }

    function checkMatch() {
        const [card1, card2] = flipped;
        if (card1.dataset.value === card2.dataset.value) {
            card1.classList.add("matched");
            card2.classList.add("matched");
            score += 20;
            matches++;
        } else {
            score = Math.max(0, score - 5);
            setTimeout(() => {
                card1.textContent = "?";
                card2.textContent = "?";
            }, 800);
        }

        flipped = [];
        container.querySelector("#score").textContent = score;

        if (matches === totalPairs) {
            endGame(true);
        }
    }

    function startTimer() {
        const timerEl = container.querySelector("#time-left");
        const interval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                endGame(false);
            }
        }, 1000);
    }

    function endGame(won = false) {
        const feedback = container.querySelector("#feedback");
        if (won) {
            feedback.textContent = `You matched all pairs! Final Score: ${score}`;
        } else {
            feedback.textContent = `Time's up! Final Score: ${score}`;
        }

        // Save to Firebase
        const user = firebaseApp.auth().currentUser;
        if (user) {
            const db = firebaseApp.firestore();
            db.collection("arcadeScores").add({
                userId: user.uid,
                game: "hitmanmemory",
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