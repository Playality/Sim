
// ============================================================
// SURVIVOR SIMULATOR
// All castaways are AI-controlled.
// ============================================================

let survivorTribes = [];
let survivorEpisode = 0;
let survivorEliminated = [];
let survivorHistory = [];
let survivorGameStarted = false;
let survivorCast = [];
let survivorMerged = false;
let survivorJury = [];
let survivorWinner = "";
let survivorDay = 0;
let survivorRelationships = {};
let survivorAlliances = [];
let survivorPersonalities = {};

const survivorTribeNames = [
    "Arawa", "Kavala", "Tavua", "Manono",
    "Yasur", "Koror", "Samburu", "Drake",
    "Chapera", "Casaya", "Tandang", "Naviti",
    "Dakal", "Sele", "Solana", "Rattana"
];

const survivorTribeColours = [
    "#e74c3c", "#3498db", "#f1c40f",
    "#2ecc71", "#9b59b6", "#e67e22",
    "#1abc9c", "#e84393", "#795548",
    "#607d8b"
];

// ============================================================
// GAME SELECTION
// ============================================================

function startSelectedGame() {
    const mode = document.getElementById("gameMode").value;

    if (mode === "bigbrother") {
        startGame();
    }

    if (mode === "survivor") {
        startSurvivor();
    }
}

// ============================================================
// START SURVIVOR
// ============================================================

function startSurvivor() {
    const castSize = Number(
        document.getElementById("castSize").value
    );

    const playerSelect = document.getElementById("player");

    survivorCast = Array.from(playerSelect.options)
        .slice(0, castSize)
        .map(option => option.value);

    survivorTribes = generateSurvivorTribes(survivorCast);
    initialiseSurvivorStrategy(survivorCast);
    generateSurvivorAlliances();

    survivorEpisode = 0;
    survivorEliminated = [];
    survivorHistory = [];
    survivorJury = [];
    survivorWinner = "";
    survivorDay = 0;
    survivorMerged = false;
    survivorGameStarted = true;

    survivorHistory.push({
        type: "tribes",
        tribes: survivorTribes.map(tribe => ({
            name: tribe.name,
            colour: tribe.colour,
            members: [...tribe.members]
        }))
    });

    document.getElementById("gameSetup").style.display = "none";
    document.getElementById("survivorScreen").style.display = "block";
    const tracker = document.querySelector(".nomination-tracker");

if (tracker) {
    tracker.style.display = "none";
}

    survivorAddStyles();
    renderSurvivorScreen(true);
}

// ============================================================
// TRIBE GENERATOR
// ============================================================

function generateSurvivorTribes(cast) {
    const players = survivorShuffle(cast);
    const names = survivorShuffle(survivorTribeNames);
    const colours = survivorShuffle(survivorTribeColours);

    const split = Math.ceil(players.length / 2);

    return [
        {
            name: names[0],
            colour: colours[0],
            members: players.slice(0, split)
        },
        {
            name: names[1],
            colour: colours[1],
            members: players.slice(split)
        }
    ];
}

// ============================================================
// CASTAWAY PERSONALITIES AND RELATIONSHIPS
// ============================================================

const survivorPersonalityTypes = [
    "Strategic",
    "Loyal",
    "Manipulative",
    "Social",
    "Competitive",
    "Paranoid",
    "Unpredictable",
    "Quiet",
    "Confrontational",
    "Friendly"
];

function initialiseSurvivorStrategy(cast) {

    survivorPersonalities = {};
    survivorRelationships = {};
    survivorAlliances = [];

    cast.forEach(player => {

        survivorPersonalities[player] =
            survivorPick(survivorPersonalityTypes);

        survivorRelationships[player] = {};

        cast.forEach(otherPlayer => {

            if (player !== otherPlayer) {

                survivorRelationships[player][otherPlayer] =
                    Math.floor(Math.random() * 5) - 2;

            }

        });

    });
}

// ============================================================
// SECRET ALLIANCES
// ============================================================

function generateSurvivorAlliances() {

    survivorAlliances = [];

    const players = survivorShuffle(survivorActiveCast());

    while (players.length >= 2) {

        const allianceSize = Math.min(
            players.length,
            Math.random() < 0.4 ? 3 : 2
        );

        const members = players.splice(0, allianceSize);

        survivorAlliances.push({
            id: survivorAlliances.length + 1,
            name: members.join(" & ") + " Alliance",
            members: members,
            strength: Math.floor(Math.random() * 30) + 70
        });
    }

}

// ============================================================
// GENERAL HELPERS
// ============================================================

function survivorShuffle(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function survivorPick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function survivorActiveCast() {
    return survivorCast.filter(
        name => !survivorEliminated.includes(name)
    );
}

function survivorEscape(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ============================================================
// MERGE
// ============================================================

function survivorMergeThreshold() {
    return Math.min(
        10,
        Math.max(5, Math.ceil(survivorCast.length * 0.65))
    );
}

function survivorMerge() {
    const active = survivorActiveCast();

    const usedNames = survivorTribeNames.filter(
        name => !survivorTribes.some(
            tribe => tribe.name === name
        )
    );

    survivorTribes = [
        {
            name: usedNames.length
                ? survivorPick(usedNames)
                : "Rattana",

            colour: "#8bc400",
            members: [...active]
        }
    ];

    survivorMerged = true;

    survivorHistory.push({
        type: "merge",
        episode: survivorEpisode,
        day: survivorDay,
        text: `The remaining ${active.length} castaways have merged into one tribe!`
    });
}

// ============================================================
// NEXT EPISODE
// ============================================================

function survivorCreateEpisode() {
    if (!survivorGameStarted || survivorWinner) return;

    let active = survivorActiveCast();

    if (active.length <= 3) {
        survivorFinishSeason();
        return;
    }

    survivorEpisode++;
    survivorDay += 3;

    const events = [];

    // MERGE CHECK

    if (
        !survivorMerged &&
        active.length <= survivorMergeThreshold()
    ) {
        survivorMerge();

        events.push(
            `THE MERGE: All ${active.length} remaining castaways are now one tribe.`
        );
    }

    active = survivorActiveCast();

    let immunePlayer = "";
    let winningTribe;
    let losingTribe;
    let councilMembers = [];

    // TRIBE IMMUNITY

    if (!survivorMerged) {
        winningTribe = survivorPick(survivorTribes);

        losingTribe = survivorTribes.find(
            tribe => tribe !== winningTribe
        );

        events.push(
            `IMMUNITY CHALLENGE: ${winningTribe.name} wins immunity.`
        );

        councilMembers = losingTribe.members.filter(
            name => !survivorEliminated.includes(name)
        );

        events.push(
            `${losingTribe.name} must attend Tribal Council.`
        );

    } else {

        // INDIVIDUAL IMMUNITY

        immunePlayer = survivorPick(active);

        events.push(
            `INDIVIDUAL IMMUNITY: ${immunePlayer} wins immunity and cannot be voted out.`
        );

        councilMembers = active.filter(
            name => name !== immunePlayer
        );

        winningTribe = survivorTribes[0];
        losingTribe = survivorTribes[0];

        events.push(
            "The remaining castaways head to Tribal Council."
        );
    }

    // CAMP EVENTS

    const campPair = survivorShuffle(councilMembers).slice(0, 2);

    if (campPair.length === 2) {
        const campEvent = survivorPick([
            `${campPair[0]} and ${campPair[1]} are seen talking strategy.`,
            `${campPair[0]} is questioning whether ${campPair[1]} can be trusted.`,
            `${campPair[0]} and ${campPair[1]} agree to work together for now.`,
            `${campPair[0]} is trying to convince ${campPair[1]} to change their vote.`
        ]);

        events.push(`AT CAMP: ${campEvent}`);
    }

    // TRIBAL COUNCIL VOTING

    const voteRecords = [];
    const voteCounts = {};

    councilMembers.forEach(name => {
        voteCounts[name] = 0;
    });

    const possibleTargets = councilMembers.filter(
        name => name !== immunePlayer
    );

    const target = possibleTargets.length
        ? survivorPick(possibleTargets)
        : "";

    councilMembers.forEach(voter => {
        const otherOptions = councilMembers.filter(
            name => name !== voter
        );

        if (!otherOptions.length) return;

        let votedFor;

        const voterAlliance = survivorAlliances.find(
            alliance => alliance.members.includes(voter)
        );

        const relationship = survivorRelationships[voter]?.[target] ?? 0;

let voteChance = voterAlliance ? 0.95 : 0.72;

// Friends are less likely to vote against each other
if (relationship >= 2) {
    voteChance -= 0.25;
}

// Rivals are more likely to target each other
if (relationship <= -2) {
    voteChance += 0.10;
}

voteChance = Math.max(0.1, Math.min(0.99, voteChance));

        if (
            voter !== target &&
            Math.random() < voteChance
        ) {
            votedFor = target;
        } else {
            votedFor = survivorPick(otherOptions);
        }

        voteCounts[votedFor]++;

        voteRecords.push({
            voter: voter,
            votedFor: votedFor
        });
    });

    // DETERMINE ELIMINATION

    let eliminated = "";
    let voteSummary = "No vote";

    if (councilMembers.length > 1) {
        const highest = Math.max(
            ...Object.values(voteCounts)
        );

        const tied = Object.keys(voteCounts).filter(
            name => voteCounts[name] === highest
        );

        eliminated = survivorPick(tied);

        voteSummary = Object.entries(voteCounts)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => `${count}–${name}`)
            .join(" · ");

        survivorEliminated.push(eliminated);
        survivorJury.push(eliminated);

        survivorTribes.forEach(tribe => {
            tribe.members = tribe.members.filter(
                name => name !== eliminated
            );
        });

        events.push(
            `TRIBAL COUNCIL: ${eliminated} is voted out of Survivor.`
        );

        events.push(
            `VOTE RESULT: ${voteSummary}.`
        );
    }

    // SAVE EPISODE HISTORY

    survivorHistory.push({
        type: "episode",
        episode: survivorEpisode,
        day: survivorDay,
        winningTribe: winningTribe
            ? winningTribe.name
            : "",
        losingTribe: losingTribe
            ? losingTribe.name
            : "",
        immunePlayer,
        eliminated,
        voteSummary,
        voteRecords,
        events
    });

    // FINAL THREE CHECK

    if (survivorActiveCast().length <= 3) {
        renderSurvivorScreen(false);
        survivorFinishSeason();
        return;
    }

    renderSurvivorScreen(false);
}

// ============================================================
// FINAL TRIBAL COUNCIL
// ============================================================

function survivorFinishSeason() {
    const finalists = survivorActiveCast();

    if (!finalists.length) return;

    const finalThree = survivorShuffle(finalists);

    survivorWinner = finalThree[0];

    survivorHistory.push({
        type: "finale",
        episode: survivorEpisode,
        day: survivorDay,
        finalists: finalThree,

        juryVotes: survivorJury.map(juror => ({
            juror: juror,
            votedFor: survivorPick(finalThree)
        })),

        winner: survivorWinner
    });

    renderSurvivorScreen(false);
}

// ============================================================
// DISPLAY TRIBES
// ============================================================

function survivorRenderTribes() {
    return `
        <div class="survivor-tribes">

            ${survivorTribes.map(tribe => `

                <section
                    class="survivor-tribe-card"
                    style="border-top:7px solid ${tribe.colour}"
                >

                    <h3 style="color:${tribe.colour}">
                        ${survivorEscape(tribe.name.toUpperCase())} TRIBE
                    </h3>

                    <p>
                        <strong>${tribe.members.length} MEMBERS</strong>
                    </p>

                    <div class="survivor-member-list">

                        ${tribe.members.map(name => `
                            <span>${survivorEscape(name)}</span>
                        `).join("")}

                    </div>

                </section>

            `).join("")}

        </div>
    `;
}

// ============================================================
// SEASON CHART
// ============================================================

function survivorRenderChart() {
    const episodes = survivorHistory.filter(
        item => item.type === "episode"
    );

    const originalTribe = {};

    const initial = survivorHistory.find(
        item => item.type === "tribes"
    );

    if (initial) {
        initial.tribes.forEach(tribe => {
            tribe.members.forEach(name => {
                originalTribe[name] = tribe.name;
            });
        });
    }

    if (!episodes.length) {
        return `
            <p class="survivor-muted">
                The season chart will fill in after Episode 1.
            </p>
        `;
    }

    const episodeHeaders = episodes.map(item => `
        <th>
            EPISODE ${item.episode}
            <br>
            DAY ${item.day}
        </th>
    `).join("");

    const playerRows = survivorCast.map(name => {

        const votedOutAt = episodes.find(
            item => item.eliminated === name
        );

        const placement = name === survivorWinner
            ? "WINNER"
            : votedOutAt
                ? `${survivorCast.length - survivorEliminated.indexOf(name)}TH`
                : survivorWinner
                    ? "FINALIST"
                    : "—";

        const voteCells = episodes.map(item => {

            const vote = item.voteRecords.find(
    record => record.voter === name
);

if (vote) {
    return `
        <td>${survivorEscape(vote.votedFor)}</td>
    `;
}

if (item.eliminated === name) {
    return `
        <td class="survivor-out">
            ELIMINATED
        </td>
    `;
}

            const eliminationIndex =
                survivorEliminated.indexOf(name);

            const episodeElimIndex = item.eliminated
                ? survivorEliminated.indexOf(item.eliminated)
                : -1;

            if (
                eliminationIndex !== -1 &&
                episodeElimIndex > eliminationIndex
            ) {
                return `
                    <td class="survivor-after-out">—</td>
                `;
            }

            return `<td>—</td>`;

        }).join("");

        return `
            <tr>

                <th>${survivorEscape(name)}</th>

                <td>
                    ${survivorEscape(originalTribe[name] || "—")}
                </td>

                ${voteCells}

                <td>
                    <strong>${placement}</strong>
                </td>

            </tr>
        `;
    }).join("");

    // ELIMINATION ROW

    const eliminatedRow = `
        <tr class="survivor-chart-eliminated">

            <th>ELIMINATED</th>

            <td>—</td>

            ${episodes.map(item => `
                <td>
                    ${item.eliminated
                        ? survivorEscape(item.eliminated)
                        : "—"}
                </td>
            `).join("")}

            <td>—</td>

        </tr>
    `;

    // VOTE SUMMARY ROW

    const voteSummaryRow = `
        <tr class="survivor-chart-votes">

            <th>VOTE COUNT</th>

            <td>—</td>

            ${episodes.map(item => `
                <td>
                    ${survivorEscape(item.voteSummary || "—")}
                </td>
            `).join("")}

            <td>—</td>

        </tr>
    `;

    return `

        <div class="survivor-chart-scroll">

            <table class="survivor-season-chart">

                <thead>

                    <tr>
                        <th colspan="2">CASTAWAYS</th>
                        ${episodeHeaders}
                        <th>PLACEMENT</th>
                    </tr>

                </thead>

                <tbody>

                    ${playerRows}
                    ${eliminatedRow}
                    ${voteSummaryRow}

                </tbody>

            </table>

        </div>

    `;
}

// ============================================================
// EPISODE HISTORY
// ============================================================

function survivorRenderHistory() {
    const episodes = survivorHistory.filter(
        item => item.type === "episode"
    );

    if (!episodes.length) {
        return `
            <p class="survivor-muted">
                Your episode recaps will appear here.
            </p>
        `;
    }

    return episodes.map(item => `

        <article class="survivor-episode-card">

            <h3>
                EPISODE ${item.episode} · DAY ${item.day}
            </h3>

            ${item.events.map(event => `
                <p>${survivorEscape(event)}</p>
            `).join("")}

        </article>

    `).join("");
}

// ============================================================
// MAIN SURVIVOR SCREEN
// ============================================================

function renderSurvivorScreen(showWelcome) {
    const content = document.getElementById("survivorContent");

    if (!content) return;

    const remaining = survivorActiveCast();

    const finale = survivorHistory.find(
        item => item.type === "finale"
    );

    content.innerHTML = `

        <header class="survivor-header">

            <h2>🏝️ SURVIVOR</h2>

            <p>
                ${showWelcome
                    ? "WELCOME TO SURVIVOR!"
                    : `EPISODE ${survivorEpisode} · DAY ${survivorDay}`}
            </p>

            <h3>
                ${remaining.length} CASTAWAYS REMAINING
            </h3>

        </header>

        ${survivorRenderTribes()}

        <section class="survivor-panel">

            <h2>SEASON STORY</h2>

            ${survivorRenderHistory()}

        </section>

        <section class="survivor-panel">

            <h2>SEASON CHART</h2>

            ${survivorRenderChart()}

        </section>

        <section class="survivor-panel">

            <h2>ELIMINATED CASTAWAYS</h2>

            <p>
                ${survivorEliminated.length
                    ? survivorEliminated.map(
                        (name, index) =>
                            `${index + 1}. ${survivorEscape(name)}`
                    ).join(" · ")
                    : "Nobody has been voted out yet."}
            </p>

        </section>

        ${finale ? `

            <section class="survivor-winner-panel">

                <p>THE JURY HAS SPOKEN</p>

                <h2>🏆 THE SOLE SURVIVOR IS...</h2>

                <h1>
                    ${survivorEscape(survivorWinner.toUpperCase())}
                </h1>

                <h3>
                    FINALISTS:
                    ${finale.finalists.map(survivorEscape).join(" · ")}
                </h3>

                <h3>JURY VOTES</h3>

                <div>

                    ${finale.juryVotes.map(vote => `
                        <p>
                            ${survivorEscape(vote.juror)}
                            voted for
                            ${survivorEscape(vote.votedFor)}
                        </p>
                    `).join("")}

                </div>

            </section>

        ` : `

            <button
                class="survivor-next-button"
                onclick="survivorCreateEpisode()"
            >
                NEXT EPISODE →
            </button>

        `}

    `;
}

// ============================================================
// SURVIVOR STYLING
// ============================================================

function survivorAddStyles() {

    if (document.getElementById("survivorStyles")) return;

    const style = document.createElement("style");

    style.id = "survivorStyles";

    style.textContent = `

        #survivorScreen {
            color: #f7f7fb;
        }

        .survivor-header {
            text-align: center;
            padding: 10px 0 18px;
        }

        .survivor-header h2 {
            font-size: 30px;
            margin-bottom: 8px;
        }

        .survivor-header p {
            color: #e8b832;
            font-weight: 800;
        }

        .survivor-tribes {
            display: grid;
            grid-template-columns:
                repeat(auto-fit, minmax(230px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }

        .survivor-tribe-card {
            background: #202638;
            border-radius: 12px;
            padding: 18px;
            text-align: center;
        }

        .survivor-member-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
        }

        .survivor-member-list span {
            background: #30394f;
            border-radius: 18px;
            padding: 7px 11px;
        }

        .survivor-panel {
            background: #202638;
            border: 1px solid #39445d;
            border-radius: 12px;
            padding: 18px;
            margin: 18px 0;
        }

        .survivor-panel h2 {
            text-align: center;
            color: #e8b832;
            margin-top: 0;
        }

        .survivor-episode-card {
            border-bottom: 1px solid #3a455c;
            padding: 10px 4px;
        }

        .survivor-episode-card h3 {
            color: #e8b832;
        }

        .survivor-muted {
            text-align: center;
            color: #c3c9d6;
        }

        .survivor-chart-scroll {
            overflow-x: auto;
            max-width: 100%;
        }

        .survivor-season-chart {
            width: 100%;
            min-width: 850px;
            border-collapse: collapse;
            background: #f6f7fa;
            color: #202638;
            font-size: 13px;
        }

        .survivor-season-chart th,
        .survivor-season-chart td {
            border: 1px solid #b7bdc8;
            padding: 9px 11px;
            text-align: center;
            white-space: nowrap;
        }

        .survivor-season-chart thead th {
            background: #e5e8ee;
        }

        .survivor-season-chart tbody th {
            background: #e5e8ee;
        }

        .survivor-out {
            background: #f77f75;
            font-weight: bold;
        }

        .survivor-after-out {
            background: #d5d7dc;
            color: #777;
        }

        .survivor-chart-eliminated {
            background: #f8d5d2;
            font-weight: bold;
        }

        .survivor-chart-votes {
            background: #e5e8ee;
            font-weight: bold;
        }

        .survivor-winner-panel {
            background: linear-gradient(
                135deg,
                #3b2f16,
                #202638
            );
            border: 2px solid #e8b832;
            border-radius: 14px;
            padding: 25px;
            text-align: center;
        }

        .survivor-winner-panel h1 {
            color: #f4c542;
            font-size: 34px;
        }

        .survivor-next-button {
            display: block;
            margin: 24px auto;
            padding: 15px 34px;
            border: 0;
            border-radius: 9px;
            background: #e8b832;
            color: #202638;
            font-size: 16px;
            font-weight: 800;
            cursor: pointer;
        }

        .survivor-next-button:hover {
            filter: brightness(1.08);
        }

        @media (max-width: 650px) {
            .survivor-panel {
                padding: 10px;
            }
        }

    `;

    document.head.appendChild(style);
}

// LOAD SURVIVOR STYLES

survivorAddStyles();
