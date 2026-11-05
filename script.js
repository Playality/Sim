let nominatedPlayers = [];
let finalNominees = [];
let selectedPlayer = null;
let humanNominations = [];
let nominationPhaseStarted = false;
let houseguestPersonalities = [
    "Strategic",
    "Loyal",
    "Manipulative",
    "Confrontational",
    "Social",
    "Paranoid",
    "Competitive",
    "Unpredictable",
    "Follower"
];

let houseguestTraits = {};
let houseguestRelationships = {};
let nominationVotes = [];
let evictedPlayers = [];
let juryVoteHistory = [];
let finalChallengeWinner = "";
let finalChallengeChoice = "";
let spectatorMode = false;
let houseguestPopularity = {};
let houseEventPairs = [];
let seasonNominationHistory = [];
let publicVoteHistory = [];
let finalPlacements = {};
let finalPublicVotePercentages = {};

function startGame() {
    const castSize = Number(document.getElementById("castSize").value);
        finalPlacements = {};
        finalPublicVotePercentages = {};
    const playerSelect = document.getElementById("player");

    while (playerSelect.options.length > castSize) {
        playerSelect.remove(castSize);
    }
    houseguestPopularity = {};

Array.from(playerSelect.options).forEach(option => {
    houseguestPopularity[option.value] = 50;
});
renderPublicPopularity();

    document.getElementById("gameSetup").style.display = "none";
    document.querySelector(".houseguest-section").style.display = "block";
    document.querySelector(".dashboard-grid").style.display = "grid";

    updatePlayerStatuses();
}

function changePopularity(name, amount, reason) {
    if (houseguestPopularity[name] === undefined) return;

    houseguestPopularity[name] = Math.max(
        0,
        Math.min(100, houseguestPopularity[name] + amount)
    );

    console.log(
        name + "'s popularity changed by " + amount +
        " because: " + reason +
        ". New score: " + houseguestPopularity[name]
    );
    renderPublicPopularity();
}

// ============================================================
// PUBLIC POPULARITY DASHBOARD
// ============================================================

function renderPublicPopularity() {

    const panel = document.getElementById("publicPopularity");

    if (!panel) return;

    const players = Object.keys(houseguestPopularity);

    const rankings = players
        .map(name => ({
            name: name,
            popularity: houseguestPopularity[name]
        }))
        .sort((a, b) => b.popularity - a.popularity);

    panel.innerHTML = rankings.map((player, index) => `
        <div class="popularity-entry">

            <div class="popularity-info">
                <span>
                    ${index + 1}. ${player.name}
                </span>

                <strong>${player.popularity}/100</strong>
            </div>

            <div class="popularity-bar">
                <div
                    class="popularity-fill"
                    style="width: ${player.popularity}%">
                </div>
            </div>

        </div>
    `).join("");
}

// ============================================================
// PUBLIC VOTE CALCULATOR
// ============================================================

function generatePublicSaveVotes(nominees) {

    const totalVotes = 1000;
    const voteCounts = {};

    nominees.forEach(name => {
        voteCounts[name] = 0;
    });

    const popularityWeights = nominees.map(name => ({
        name: name,
        weight: Math.max(1, houseguestPopularity[name] || 50)
    }));

    const totalWeight = popularityWeights.reduce(
        (total, player) => total + player.weight,
        0
    );

    for (let i = 0; i < totalVotes; i++) {

        let randomVote = Math.random() * totalWeight;

        for (const player of popularityWeights) {

            randomVote -= player.weight;

            if (randomVote <= 0) {
                voteCounts[player.name]++;
                break;
            }
        }
    }

    return voteCounts;
}

function generateHouseEvent() {
    const players = Array.from(
        document.getElementById("player").options
    )
    .map(option => option.value)
    .filter(player => !evictedPlayers.includes(player));

    if (players.length < 2) return;

    const shuffled = players.sort(() => Math.random() - 0.5);
    const player1 = shuffled[0];
    const player2 = shuffled[1];

        const events = [
    {
        text: `${player1} and ${player2} had a heated argument!`,
        changes: [[player1, -12], [player2, -8]]
    },
    {
        text: `${player1} and ${player2} have secretly formed an alliance! 🤝`,
        changes: [[player1, 8], [player2, 8]]
    },
    {
        text: `${player1} helped ${player2} during a difficult moment.`,
        changes: [[player1, 10], [player2, 8]]
    },
    {
        text: `${player1} was caught gossiping about ${player2}!`,
        changes: [[player1, -15], [player2, 8]]
    },
    {
        text: `${player1} and ${player2} unexpectedly became friends!`,
        changes: [[player1, 9], [player2, 9]]
    },
    {
        text: `${player1} caused drama in the house!`,
        changes: [[player1, -10], [player2, -5]]
    },
    {
        text: `${player1} entertained the house with their humour!`,
        changes: [[player1, 12]]
    }
];

    const event = events[Math.floor(Math.random() * events.length)];

    event.changes.forEach(change => {
        changePopularity(
            change[0],
            change[1],
            event.text
        );
    });

    const houseEvents = document.getElementById("houseEvents");

    if (houseEvents.innerHTML.includes("No house events yet.")) {
        houseEvents.innerHTML = "";
    }

    const eventElement = document.createElement("p");
    eventElement.textContent = "✨ " + event.text;

    houseEvents.prepend(eventElement);
}

function generateHouseguestRelationships() {
    const players = Array.from(
        document.getElementById("player").options
    ).map(option => option.value);

    houseguestTraits = {};
    houseguestRelationships = {};

    players.forEach(player => {
        if (player === selectedPlayer) return;

        let personalities = [...houseguestPersonalities];

        let personality = personalities[
            Math.floor(Math.random() * personalities.length)
        ];

        let possibleConnections = players.filter(
            other => other !== player
        );

        let shuffled = possibleConnections.sort(
            () => Math.random() - 0.5
        );

        houseguestTraits[player] = personality;

        houseguestRelationships[player] = {
            ally: shuffled[0],
            rival: shuffled[1]
        };
    });
}

  
function nominatePlayer() {
    const playerSelect = document.getElementById("player");
    const totalPlayers = playerSelect.options.length;
    const player = playerSelect.value;

    if (nominatedPlayers.length >= totalPlayers) {
        return;
    }

    if (nominatedPlayers.includes(player)) {
        document.getElementById("result").textContent =
            player + " has already been nominated!";
    } else {
        nominatedPlayers.push(player);

        document.getElementById("nominationCounter").textContent =
            "Houseguests nominated: " +
            nominatedPlayers.length + " / " + totalPlayers;

        updatePlayerStatuses();

        if (nominatedPlayers.length === totalPlayers) {
            document.getElementById("ceremonyStatus").textContent =
                "The nomination ceremony is OVER!";
        }

        playerSelect.options[playerSelect.selectedIndex].disabled = true;

        document.getElementById("result").textContent =
            player + " has been NOMINATED!";
    }
}

function updatePlayerStatuses() {
  let players = document.getElementById("player").options;
  let statusList = document.getElementById("playerStatuses");

  statusList.innerHTML = "";

  
for (let i = 0; i < players.length; i++) {
  let name = players[i].value;
  let photoPaths = {
    Alex: "images/alex.webp",
    Jordan: "images/jordan.webp",
    Taylor: "images/taylor.webp",
    Sam: "images/sam.webp",
    Chris: "images/avatar.webp",
    Jamie: "images/avatar.webp",
    Morgan: "images/avatar.webp",
    Riley: "images/avatar.webp",
    Casey: "images/avatar.webp",
    Charlie: "images/avatar.webp"
};
  
let item = document.createElement("li");
item.className = "player-card";
item.onclick = function() {
    if (evictedPlayers.includes(name)) return;
    openDiaryRoom(name);
};

let photo = document.createElement("img");
photo.className = "houseguest-photo";
photo.src = photoPaths[name];
photo.alt = name + "'s profile photo";

let nameLabel = document.createElement("span");
nameLabel.className = "houseguest-name";
nameLabel.textContent = name;


  let badge = document.createElement("span");
  badge.className = "status-badge";

  if (evictedPlayers.includes(name)) {
    badge.textContent = "EVICTED";
    badge.classList.add("evicted");
    item.classList.add("evicted-player");
} else if (finalNominees.includes(name)) {
    badge.textContent = "NOMINATED";
    badge.classList.add("nominated");
    item.classList.add("nominated-player");
} else {
    badge.textContent = "SAFE";
    badge.classList.add("safe");
}

  item.appendChild(photo);
  item.appendChild(nameLabel);
  item.appendChild(badge);
  let pickButton = document.createElement("button");
pickButton.textContent = "PICK";
pickButton.className = "pick-button";
pickButton.onclick = function(event) {
    event.stopPropagation();
    selectedPlayer = name;
    generateHouseguestRelationships();
    generateHouseEvent();
    document.getElementById("ceremonyStatus").textContent =
        selectedPlayer + " is YOUR houseguest!";
    updatePlayerStatuses();
};

if (selectedPlayer === name) {
    item.classList.add("your-houseguest");
    pickButton.style.display = "none";
}

if (selectedPlayer !== null && selectedPlayer !== name) {
    pickButton.style.display = "none";
}

if (
    !evictedPlayers.includes(name) &&
    !evictedPlayers.includes(selectedPlayer)
) {
    item.appendChild(pickButton);
}
let nominateButton = document.createElement("button");
nominateButton.textContent = "NOMINATE";
nominateButton.className = "pick-button";
if (
    evictedPlayers.includes(name) ||
    evictedPlayers.includes(selectedPlayer)
) {
    nominateButton.style.display = "none";
}

nominateButton.onclick = function(event) {
    event.stopPropagation();

    if (selectedPlayer === null) return;
    if (name === selectedPlayer) return;
    if (evictedPlayers.includes(name)) return;
    if (humanNominations.length >= 2) return;
    if (humanNominations.includes(name)) return;

    humanNominations.push(name);

    nominationVotes.push({
        voter: selectedPlayer,
        nominee: name
    });

    if (!nominatedPlayers.includes(name)) {
        nominatedPlayers.push(name);
    }

    document.getElementById("nominationCounter").textContent =
        "Your nominations: " + humanNominations.length + " / 2";

    updatePlayerStatuses();

    if (humanNominations.length === 2) {
        document.getElementById("ceremonyStatus").textContent =
            "Your nominations are complete. The houseguests are now nominating...";

        generateBotNominations();
    }
};

if (
    selectedPlayer === null ||
    name === selectedPlayer ||
    evictedPlayers.includes(name) ||
    humanNominations.length >= 2
) {
    nominateButton.style.display = "none";
}

item.appendChild(nominateButton);
  statusList.appendChild(item);
}
}


updatePlayerStatuses();


function generateBotNominations() {
    const players = Array.from(
        document.getElementById("player").options
    ).map(option => option.value);

    players.forEach(bot => {
        if (bot === selectedPlayer || evictedPlayers.includes(bot)) return;

        let personality = houseguestTraits[bot];
        let relationships = houseguestRelationships[bot];

        let possibleTargets = players.filter(player =>
        player !== bot && !evictedPlayers.includes(player)
      );

        let targets = [];

const getTargetScore = (player) => {
    let score = Math.random() * 10;

    const votesReceived = nominationVotes.filter(
        vote => vote.nominee === player
    ).length;

    const votesAgainstBot = nominationVotes.filter(
        vote => vote.voter === player && vote.nominee === bot
    ).length;

    if (personality === "Confrontational" &&
        player === relationships.rival) {
        score += 100;
    }

    if (personality === "Manipulative" &&
        player === relationships.rival) {
        score += 60;
    }

    if ((personality === "Loyal" || personality === "Social") &&
        player === relationships.ally) {
        score -= 100;
    }

    if (personality === "Paranoid" && votesAgainstBot > 0) {
        score += 50;
    }

    if (personality === "Strategic") {
        score += votesReceived * 3;
    }

    if (personality === "Competitive") {
        score += votesReceived * 5;
    }

    if (personality === "Follower") {
        score += votesReceived * 8;
    }

    if (personality === "Unpredictable") {
        score += Math.random() * 30;
    }
// General alliance and rivalry influence
if (relationships && player === relationships.ally) {
    score -= 35;
}

if (relationships && player === relationships.rival) {
    score += 35;
}
    return score;
};

possibleTargets.sort((a, b) =>
    getTargetScore(b) - getTargetScore(a)
);

while (targets.length < 2 && possibleTargets.length > 0) {
            let target = possibleTargets.shift();

            if (!targets.includes(target)) {
                targets.push(target);
            }
        }

        targets.forEach(target => {
            nominationVotes.push({
                voter: bot,
                nominee: target
            });

            if (!nominatedPlayers.includes(target)) {
                nominatedPlayers.push(target);
            }
        });
    });

    updatePlayerStatuses();
    
const voteCounts = {};

players.forEach(player => {
    voteCounts[player] = nominationVotes.filter(
        vote => vote.nominee === player
    ).length;
});

const rankings = players
    .filter(player => !evictedPlayers.includes(player))
    .map((player, index) => ({
    name: player,
    votes: voteCounts[player],
    index: index
}));

rankings.sort((a, b) =>
    b.votes - a.votes || Math.random() - 0.5
);

const secondPlaceVotes = rankings[1].votes;

const nominees = rankings.filter(
    player => player.votes >= secondPlaceVotes
);
const trackerRoundNumber =
    document.querySelectorAll(".history-round").length + 1;

seasonNominationHistory.push({
    round: trackerRoundNumber,
    nominees: nominees.map(player => player.name),
    evicted: null,
    nominations: nominationVotes.map(vote => ({
        voter: vote.voter,
        nominee: vote.nominee
    })),
    votes: players.map(player => ({
        name: player,
        count: voteCounts[player] || 0
    }))
});

updateNominationTracker();

finalNominees = nominees.map(player => player.name);
finalNominees.forEach(name => {
    changePopularity(name, -5, "Being nominated");
});
updatePlayerStatuses();

const tallyText = rankings
    .map(player => player.name + " (" + player.votes + " votes)")
    .join(" | ");

const tallyRows = rankings.map(player =>
    `<div class="tally-row ${nominees.some(nominee => nominee.name === player.name) ? "final-nominee" : ""}">
        <span>${player.name}</span>
        <strong>${player.votes} ${player.votes === 1 ? "vote" : "votes"}</strong>
    </div>`
).join("");


const historyPanel = document.getElementById("nominationHistory");

const roundNumber =
    historyPanel.querySelectorAll(".history-round").length + 1;

const previousHistory = roundNumber === 1
    ? ""
    : historyPanel.innerHTML;

historyPanel.innerHTML = `
    <div class="history-round">
        <h4>ROUND ${roundNumber}</h4>
        <div class="tally-list">${tallyRows}</div>
    </div>
` + previousHistory;


document.getElementById("result").innerHTML =
    `<h3>FINAL NOMINEES</h3>
    <p>${nominees.map(player => player.name).join(" and ")}</p>
    ${spectatorMode ? "" : `<button onclick="runEviction()">START EVICTION VOTE</button>`}`;

if (spectatorMode) {
    runEviction();
}
    
}

function runEviction() {

    document.getElementById("result").innerHTML = `
        <h3>📢 THE PUBLIC VOTE</h3>
        <p>The public have been voting to SAVE their favourite nominee!</p>
        <p>1,000 votes have been counted...</p>
    `;

    castEvictionVote(null);
}

function castEvictionVote(yourVote) {

    const nominees = finalNominees;

    // Generate 1,000 public SAVE votes
    const votes = generatePublicSaveVotes(nominees);

    // The nominee with the fewest SAVE votes is evicted
    const lowestVotes = Math.min(...Object.values(votes));

    const possibleEvictees = nominees.filter(
        nominee => votes[nominee] === lowestVotes
    );

    const evictedPlayer = possibleEvictees[
        Math.floor(Math.random() * possibleEvictees.length)
    ];

    // Record public voting history
    publicVoteHistory.push({
        round: publicVoteHistory.length + 1,
        nominees: [...nominees],
        votes: { ...votes },
        evicted: evictedPlayer
    });

    evictedPlayers.push(evictedPlayer);

    const latestRound = seasonNominationHistory[
        seasonNominationHistory.length - 1
    ];

    if (latestRound) {
        latestRound.evicted = evictedPlayer;
    }

    // Update popularity
    nominees.forEach(nominee => {
        if (nominee === evictedPlayer) {
            changePopularity(nominee, -10, "Public eviction");
        } else {
            changePopularity(nominee, 5, "Survived public vote");
        }
    });

    updatePlayerStatuses();

    const voteResults = nominees.map(nominee => `
        <div class="tally-row ${nominee === evictedPlayer ? "final-nominee" : ""}">
            <span>${nominee}</span>
            <strong>${((votes[nominee] / 1000) * 100).toFixed(1)}% OF THE PUBLIC VOTE</strong>
        </div>
    `).join("");

    const nextStep = evictedPlayer === selectedPlayer
        ? `<button onclick="startNextRound(true)">CONTINUE AS SPECTATOR</button>`
        : `<button onclick="startNextRound(false)">START NEXT ROUND</button>`;

    const historyPanel = document.getElementById("nominationHistory");

    const currentRound = historyPanel.querySelector(".history-round:first-child");

    if (currentRound) {
        currentRound.insertAdjacentHTML("beforebegin", `
            <h4>PUBLIC VOTE RESULTS</h4>
            <div class="tally-list">${voteResults}</div>
        `);
    }

    document.getElementById("result").innerHTML = `
        <h2>📢 THE PUBLIC HAS DECIDED!</h2>
        <h3>PUBLIC SAVE VOTE RESULTS</h3>
        <div class="tally-list">
            ${voteResults}
        </div>
        <h2>${evictedPlayer.toUpperCase()} HAS BEEN EVICTED!</h2>
        ${nextStep}
    `;
}


function generateHouseEvent() {
    const players = Array.from(
        document.getElementById("player").options
    )
    .map(option => option.value)
    .filter(player => !evictedPlayers.includes(player));

    if (players.length < 2) return;

    const availablePairs = [];

for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
        const pairKey = [players[i], players[j]].sort().join("|");

        if (!houseEventPairs.includes(pairKey)) {
            availablePairs.push({
                first: players[i],
                second: players[j],
                key: pairKey
            });
        }
    }
}

if (availablePairs.length === 0) return;

const chosenPair = availablePairs[
    Math.floor(Math.random() * availablePairs.length)
];

const first = chosenPair.first;
const second = chosenPair.second;

houseEventPairs.push(chosenPair.key);

    const events = [
    {
        type: "alliance",
        text: `🤝 ${first} and ${second} have secretly formed an alliance!`,
        effect: () => {
            houseguestRelationships[first].ally = second;
            houseguestRelationships[second].ally = first;
            changePopularity(first, 10, "Forming an alliance");
            changePopularity(second, 10, "Forming an alliance");
        }
    },
    {
        type: "argument",
        text: `💥 ${first} and ${second} had a massive argument!`,
        effect: () => {
            houseguestRelationships[first].rival = second;
            houseguestRelationships[second].rival = first;
            changePopularity(first, -12, "Having a public argument");
            changePopularity(second, -8, "Having a public argument");
        }
    },
    {
        type: "friendship",
        text: `❤️ ${first} and ${second} are becoming close friends!`,
        effect: () => {
            houseguestRelationships[first].ally = second;
            houseguestRelationships[second].ally = first;
            changePopularity(first, 10, "A heartwarming friendship");
            changePopularity(second, 10, "A heartwarming friendship");
        }
    },
    {
        type: "betrayal",
        text: `🐍 ${first} has betrayed ${second}!`,
        effect: () => {
            houseguestRelationships[first].ally = null;
            houseguestRelationships[second].ally = null;
            houseguestRelationships[first].rival = second;
            houseguestRelationships[second].rival = first;
            changePopularity(first, -15, "Betraying an ally");
            changePopularity(second, 8, "Being betrayed");
        }
    },
    {
        type: "popularity",
        text: `⭐ ${first} is becoming increasingly popular in the house!`,
        effect: () => {
            changePopularity(first, 15, "Becoming a fan favourite");
        }
    },
    {
        type: "plotting",
        text: `👀 ${first} and ${second} were caught plotting nominations!`,
        effect: () => {
            houseguestRelationships[first].rival = second;
            changePopularity(first, -10, "Being caught plotting");
            changePopularity(second, -5, "Being involved in plotting");
        }
    }
];

    const event = events[Math.floor(Math.random() * events.length)];

    event.effect();

    const panel = document.getElementById("houseEvents");

    panel.innerHTML =
        `<p>${event.text}</p>` + panel.innerHTML;
}
function startNextRound(juryMode = false) {
    spectatorMode = juryMode || evictedPlayers.includes(selectedPlayer);
        const remainingHouseguests = Array.from(
        document.getElementById("player").options
    )
    .map(option => option.value)
    .filter(player => !evictedPlayers.includes(player));

    if (remainingHouseguests.length === 3) {
        startFinalThree(remainingHouseguests);
        return;
    }
    nominatedPlayers = [];
    finalNominees = [];
    humanNominations = [];
    nominationVotes = [];
    houseEventPairs = [];

    document.getElementById("nominationCounter").textContent =
    spectatorMode ? "YOU ARE ON THE JURY" : "Your nominations: 0 / 2";

document.getElementById("ceremonyStatus").textContent =
    "A new nomination round has begun!";

document.getElementById("result").textContent =
    spectatorMode
        ? "The remaining houseguests are making their nominations."
        : "Choose two houseguests to nominate.";

updatePlayerStatuses();

for (let i = 0; i < 3; i++) {
    generateHouseEvent();
}

if (spectatorMode) {
    generateBotNominations();
}
}

function startFinalThree(remainingHouseguests) {

    document.getElementById("nominationCounter").textContent =
        "FINAL 3";

    document.getElementById("ceremonyStatus").textContent =
        "The Final 3 have been decided!";

    document.getElementById("result").innerHTML = `
        <h2>🏆 THE FINAL 3 🏆</h2>
        <h3>THE FINALISTS</h3>

        <div class="tally-list">
            ${remainingHouseguests.map(player => `
                <div class="tally-row">
                    <span>${player}</span>
                    <strong>FINALIST</strong>
                </div>
            `).join("")}
        </div>

        <p>The jury will now decide who deserves to win Big Brother!</p>

        <button onclick="runFinalThreeVote()">
            REVEAL THE PUBLIC VOTE
        </button>
    `;
}

function runFinalThreeVote() {

    const finalists = Array.from(
        document.getElementById("player").options
    )
    .map(option => option.value)
    .filter(player => !evictedPlayers.includes(player));

    // The public casts 1,000 votes
    const votes = generatePublicSaveVotes(finalists);
    finalPublicVotePercentages = {};

finalists.forEach(player => {
    finalPublicVotePercentages[player] = (
        votes[player] / 10
    ).toFixed(1);
});

    // The finalist with the most votes wins
    const highestVotes = Math.max(...Object.values(votes));

    const possibleWinners = finalists.filter(
        player => votes[player] === highestVotes
    );

    const winner = possibleWinners[
        Math.floor(Math.random() * possibleWinners.length)
    ];

    // Record the final placements
    const placements = [
        { name: winner, votes: votes[winner] },
        ...finalists
            .filter(player => player !== winner)
            .map(player => ({
                name: player,
                votes: votes[player]
            }))
            .sort((a, b) => b.votes - a.votes)
    ];

    placements.forEach((player, index) => {
        finalPlacements[player.name] = index + 1;
    });

    updateNominationTracker();

    // Display the public vote results
    document.getElementById("result").innerHTML = `
        <h2>📢 THE PUBLIC HAS DECIDED!</h2>
        <h3>FINAL PUBLIC VOTE RESULTS</h3>

        <div class="tally-list">
            ${placements.map(player => `
                <div class="tally-row">
                    <span>${player.name}</span>
                    <strong>${(player.votes / 10).toFixed(1)}%</strong>
                </div>
            `).join("")}
        </div>
    `;

    // Add the final results to Game History
    const historyPanel = document.getElementById("nominationHistory");

    historyPanel.insertAdjacentHTML("afterbegin", `
        <div class="history-round">
            <h2>🏆 BIG BROTHER WINNER: ${winner.toUpperCase()} 🏆</h2>
            <h3>FINAL PUBLIC VOTE</h3>
            <div class="tally-list">
                ${placements.map(player => `
                    <div class="tally-row">
                        <span>${player.name}</span>
                        <strong>${(player.votes / 10).toFixed(1)}%</strong>
                    </div>
                `).join("")}
            </div>
        </div>
    `);

    document.getElementById("ceremonyStatus").textContent =
        "The public has crowned its Big Brother winner!";
}

function countFinalThreeVotes(yourVote) {

    const finalists = Array.from(
    document.getElementById("player").options
)
.map(option => option.value)
.filter(player => !evictedPlayers.includes(player));

    const votes = {};

    finalists.forEach(player => {
        votes[player] = 0;
    });

    // Count the player's jury vote
    if (
        !finalists.includes(selectedPlayer) &&
        yourVote
    ) {
        votes[yourVote]++;

        juryVoteHistory.push({
            juror: selectedPlayer,
            votedFor: yourVote
        });
    }

    // Count the remaining jury votes
    evictedPlayers.forEach(juror => {

        if (juror === selectedPlayer) return;

        const choice = finalists[
            Math.floor(Math.random() * finalists.length)
        ];

        votes[choice]++;

        juryVoteHistory.push({
            juror: juror,
            votedFor: choice
        });
    });

    const highestVotes = Math.max(...Object.values(votes));

    const winners = finalists.filter(
        player => votes[player] === highestVotes
    );

    const winner = winners[
        Math.floor(Math.random() * winners.length)
    ];

    const placements = finalists
        .map(player => ({
            name: player,
            votes: votes[player]
        }))
        .sort((a, b) => b.votes - a.votes);

    placements.forEach((player, index) => {
        finalPlacements[player.name] = index + 1;
    });

    updateNominationTracker();

    document.getElementById("result").innerHTML = `
        <h2>🏆 THE JURY HAS DECIDED! 🏆</h2>
        <h3>FINAL JURY VOTE RESULTS</h3>

        <div class="tally-list">
            ${placements.map(player => `
                <div class="tally-row">
                    <span>${player.name}</span>
                    <strong>${player.votes} votes</strong>
                </div>
            `).join("")}
        </div>

    `;

    const historyPanel = document.getElementById("nominationHistory");

    const juryRows = juryVoteHistory.map(vote => `
        <div class="tally-row">
            <span>${vote.juror}</span>
            <strong>Voted for ${vote.votedFor}</strong>
        </div>
    `).join("");

    historyPanel.insertAdjacentHTML("afterbegin", `
        <div class="history-round">
            <h2>🏆 BIG BROTHER WINNER: ${winner.toUpperCase()} 🏆</h2>
            <h3>FINAL JURY VOTES</h3>
            <div class="tally-list">
                ${juryRows}
            </div>
        </div>
    `);

    document.getElementById("ceremonyStatus").textContent =
        "Big Brother has crowned its winner!";
}

function chooseFinalist(player, thirdPlace) {
    evictedPlayers.push(thirdPlace);
    finalPlacements[thirdPlace] = 3;
    updatePlayerStatuses();

    finalChallengeWinner = selectedPlayer;
    finalChallengeChoice = player;
    showFinalTwo(selectedPlayer, player);
}

function showFinalTwo(firstFinalist, secondFinalist) {

    document.getElementById("nominationCounter").textContent =
        "THE FINAL 2";

    document.getElementById("ceremonyStatus").textContent =
        "The final two houseguests have been decided!";

    document.getElementById("result").innerHTML = `
    <h2>THE FINAL TWO</h2>
    <h3>${firstFinalist} VS ${secondFinalist}</h3>
    <p>As a member of the jury, who deserves to win Big Brother?</p>

    <button onclick="runFinalVote('${firstFinalist}', '${secondFinalist}', '${firstFinalist}')">
        VOTE FOR ${firstFinalist.toUpperCase()}
    </button>

    <button onclick="runFinalVote('${firstFinalist}', '${secondFinalist}', '${secondFinalist}')">
        VOTE FOR ${secondFinalist.toUpperCase()}
    </button>
`;
}

function runFinalVote(firstFinalist, secondFinalist, yourVote) {
    const votes = {
        [firstFinalist]: 0,
        [secondFinalist]: 0
    };

    if (
    yourVote &&
    selectedPlayer !== firstFinalist &&
    selectedPlayer !== secondFinalist
) {
    votes[yourVote]++;

    juryVoteHistory.push({
        juror: selectedPlayer,
        votedFor: yourVote
    });
}

evictedPlayers.forEach(juror => {
    if (juror === selectedPlayer) return;

    const choice = Math.random() < 0.5
        ? firstFinalist
        : secondFinalist;

    votes[choice]++;

    juryVoteHistory.push({
    juror: juror,
    votedFor: choice
});
});

    let winner;

    if (votes[firstFinalist] > votes[secondFinalist]) {
        winner = firstFinalist;
    } else if (votes[secondFinalist] > votes[firstFinalist]) {
        winner = secondFinalist;
    } else {
        winner = Math.random() < 0.5
            ? firstFinalist
            : secondFinalist;
    }

        const runnerUp = winner === firstFinalist
        ? secondFinalist
        : firstFinalist;

    finalPlacements[winner] = 1;
    finalPlacements[runnerUp] = 2;
    updateNominationTracker();

    document.getElementById("result").innerHTML = `
        <h2>BIG BROTHER FINAL VOTE</h2>
        <div class="tally-list">
            <div class="tally-row">
                <span>${firstFinalist}</span>
                <strong>${votes[firstFinalist]} votes</strong>
            </div>
            <div class="tally-row">
                <span>${secondFinalist}</span>
                <strong>${votes[secondFinalist]} votes</strong>
            </div>
        </div>
    `;


    const historyPanel = document.getElementById("nominationHistory");

const juryRows = juryVoteHistory.map(vote => `
    <div class="tally-row">
        <span>${vote.juror}</span>
        <strong>Voted for ${vote.votedFor}</strong>
    </div>
`).join("");

historyPanel.insertAdjacentHTML("afterbegin", `
    <div class="history-round">
    <h2 class="winner-heading">
    <span>🏆</span>
    <span>BIG BROTHER WINNER: ${winner.toUpperCase()}</span>
    <span>🏆</span>
</h2>
     <h3>FINAL JURY VOTES</h3>
        <div class="tally-list">
            ${juryRows}
        </div>
        <h3>FINAL 3 CHALLENGE</h3>
        <div class="tally-list">
            <div class="tally-row">
                <span>Challenge Winner</span>
                <strong>${finalChallengeWinner}</strong>
            </div>
            <div class="tally-row">
                <span>Chosen Finalist</span>
                <strong>${finalChallengeChoice}</strong>
            </div>
        </div>

       

        
    </div>
`);

    document.getElementById("ceremonyStatus").textContent =
        "Big Brother has crowned its winner!";
}

function openDiaryRoom(name) {
    // Remove an existing Diary Room if one is open
    const existingRoom = document.getElementById("diaryRoom");
    if (existingRoom) existingRoom.remove();

    const room = document.createElement("div");
    room.id = "diaryRoom";

    room.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 20px;
    `;
    
    
    const diaryConfessionals = {
    Strategic: "I'm always thinking three steps ahead. Nobody in this house is playing me.",
    Loyal: "I just want to be there for my friends, but I'm starting to question who I can trust.",
    Manipulative: "Everyone thinks I'm on their side. That's exactly how I want it.",
    Confrontational: "If somebody has a problem with me, they can say it to my face.",
    Social: "I'm trying to get along with everyone, but this house is full of surprises.",
    Paranoid: "I feel like people are talking about me behind my back. I don't trust anyone.",
    Competitive: "I didn't come here to make friends. I came here to win.",
    Unpredictable: "Even I don't know what I'm going to do next. That's what makes this fun.",
    Follower: "I'm just trying to stay out of trouble and make sure I'm on the right side."
};

const personality = houseguestTraits[name] || "Social";
const confession = diaryConfessionals[personality];
const relationships = houseguestRelationships[name] || {};

const ally = relationships.ally || "No current ally";
const rival = relationships.rival || "No current rival";
    room.innerHTML = `
        <div style="
            background: #202638;
            border: 2px solid #d9ad2e;
            border-radius: 15px;
            padding: 30px;
            width: 450px;
            max-width: 100%;
            color: white;
            text-align: center;
        ">
            <h2 style="color: #e5b82e;">🎥 THE DIARY ROOM</h2>
            <h1>${name}</h1>
            <p>PUBLIC POPULARITY: ${houseguestPopularity[name] ?? 50}/100</p>
            <p>🤝 CURRENT ALLY: ${ally}</p>
            <p>💥 CURRENT RIVAL: ${rival}</p>
            <p>Welcome to the Diary Room.</p>
            <p style="font-style: italic; line-height: 1.6;">
    "${confession}"
</p>
<p style="color: #e5b82e;">PERSONALITY: ${personality.toUpperCase()}</p>
            <button id="closeDiaryRoom" style="
                background: #d9ad2e;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
            ">LEAVE DIARY ROOM</button>
        </div>
    `;

    document.body.appendChild(room);

    document.getElementById("closeDiaryRoom").onclick = function() {
        room.remove();
    };
}

function updateNominationTracker() {
    const tracker = document.getElementById("nominationTracker");

    if (seasonNominationHistory.length === 0) {
        tracker.innerHTML = "<p>No nominations recorded yet.</p>";
        return;
    }

    let table = `
        <table class="nomination-table">
            <thead>
                <tr>
                    <th>HOUSEGUEST</th>
                    ${seasonNominationHistory.map(round =>
                        `<th>ROUND ${round.round}</th>`
                    ).join("")}
                    <th>FINALE</th>
                    <th>NOMINATIONS RECEIVED</th>
                </tr>
            </thead>
            <tbody>
    `;

    const allPlayers = Array.from(
    document.getElementById("player").options
).map(option => option.value);

const placedPlayers = Object.keys(finalPlacements).sort(
    (a, b) => finalPlacements[a] - finalPlacements[b]
);

const remainingPlayers = allPlayers.filter(
    player => !placedPlayers.includes(player)
);

const activePlayers = remainingPlayers.filter(
    player => !evictedPlayers.includes(player)
);

const evictedPlayersInOrder = [...evictedPlayers]
    .reverse()
    .filter(player => !placedPlayers.includes(player));

const players = [
    ...placedPlayers,
    ...activePlayers,
    ...evictedPlayersInOrder
];

    players.forEach(player => {
        let total = 0;

        const roundCells = seasonNominationHistory.map(round => {
            const nominations = round.nominations
                .filter(vote => vote.voter === player)
                .map(vote => vote.nominee);

            const received = round.votes.find(
                vote => vote.name === player
            );

            total += received ? received.count : 0;

            const evictionRound = seasonNominationHistory.findIndex(
    item => item.evicted === player
);

const isAfterEviction =
    evictionRound !== -1 &&
    seasonNominationHistory.indexOf(round) > evictionRound;

return `
    <td class="${isAfterEviction ? "tracker-after-eviction" : ""}">
        ${nominations.length
            ? nominations.join("<br>")
            : "—"}
    </td>
`;
        }).join("");

        const isEvicted = evictedPlayers.includes(player);
        const placement = finalPlacements[player];

const placementLabel = placement
    ? placement === 1
        ? "🏆 WINNER"
        : placement === 2
            ? "RUNNER-UP"
            : "THIRD PLACE"
    : "—";
const finalePercentage = finalPublicVotePercentages[player];

const finaleLabel = placement
    ? `
        <strong>${placementLabel}</strong>
        ${finalePercentage !== undefined
            ? `<br>${finalePercentage}%`
            : ""}
    `
    : "—";

table += `
    <tr>
        <td>${player}</td>
        ${roundCells}
        <td class="finale-cell ${!placement ? "tracker-after-eviction" : ""}">
        ${finaleLabel}
    </td>
        <td><strong>${total}</strong></td>
    </tr>
`;
    });

        table += `
    <tr class="nominees-row">
        <td><strong>NOMINEES</strong></td>
        ${seasonNominationHistory.map(round =>
            `<td>${round.nominees.join("<br>")}</td>`
        ).join("")}
        <td>—</td>
        <td>-</td>
    </tr>

    <tr class="eviction-results-row">
        <td><strong>EVICTED</strong></td>
        ${seasonNominationHistory.map((round, index) => {

            const result = publicVoteHistory[index];

            if (!result) return "<td>—</td>";

            const totalVotes = Object.values(result.votes)
                .reduce((total, votes) => total + votes, 0);

            const percentage = (
                result.votes[result.evicted] / totalVotes * 100
            ).toFixed(1);

            return `
                <td>
                    <strong>${result.evicted}</strong><br>
                    ${percentage}% OF SAVE VOTE
                </td>
            `;
        }).join("")}
        <td>—</td>
        <td>-</td>
    </tr>
    </tbody>
</table>
`;

    tracker.innerHTML = table;
}