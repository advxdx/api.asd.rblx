const express = require("express");
const app = express();

app.use(express.json());

// ===== DATA =====
let actions = [];
let current_key = "abc123";
let old_key = null;
let uses = 0;
let expireTime = 0;

// ===== KEY SYSTEM =====
function generateKey() {
    return Math.random().toString(36).substring(2, 10);
}

function validateKey(key) {
    if (key === current_key) return true;
    if (key === old_key && Date.now() < expireTime) return true;
    return false;
}

// ===== API =====

// send action
app.post("/action", (req, res) => {
    const key = req.headers.authorization;
    if (!validateKey(key)) return res.sendStatus(403);

    actions.push(req.body);

    if (req.body.type === "ban") {
        uses++;
        if (uses >= 5) {
            old_key = current_key;
            current_key = generateKey();
            expireTime = Date.now() + 5 * 60 * 1000;
            uses = 0;
        }
    }

    res.sendStatus(200);
});

// roblox fetch
app.get("/actions", (req, res) => {
    res.json(actions);
    actions = [];
});

// get key
app.get("/key", (req, res) => {
    res.json({ key: current_key, uses });
});

// rotate manually
app.post("/rotate", (req, res) => {
    old_key = current_key;
    current_key = generateKey();
    uses = 0;
    res.send("Rotated");
});

// ===== WEB PANEL (INLINE HTML) =====

app.get("/", (req, res) => {
    res.send(`
    <html>
    <head>
        <title>Bot Panel</title>
        <style>
            body { font-family: Arial; background:#121212; color:white; text-align:center; }
            .card { background:#1e1e1e; padding:20px; margin:20px; border-radius:10px; }
            button { padding:10px; margin-top:10px; cursor:pointer; }
            input { padding:10px; margin:5px; }
        </style>
    </head>
    <body>

    <h1>Bot Dashboard</h1>

    <div class="card">
        <h2>🔑 Key</h2>
        <p id="key">Loading...</p>
        <button onclick="rotate()">Rotate Key</button>
    </div>

    <div class="card">
        <h2>🔨 Ban</h2>
        <input id="user" placeholder="Username"><br>
        <input id="reason" placeholder="Reason"><br>
        <button onclick="ban()">Ban</button>
    </div>

    <div class="card">
        <h2>📢 Announcement</h2>
        <input id="msg" placeholder="Message"><br>
        <button onclick="announce()">Send</button>
    </div>

    <div class="card">
        <h2>🎮 Events</h2>
        <button onclick="eventSend('double_xp')">Double XP</button>
        <button onclick="eventSend('boss_spawn')">Boss Spawn</button>
    </div>

    <script>
        async function loadKey() {
            const res = await fetch("/key");
            const data = await res.json();
            document.getElementById("key").innerText =
                "Key: " + data.key + " | Uses: " + data.uses + "/5";
        }

        async function rotate() {
            await fetch("/rotate", { method: "POST" });
            loadKey();
        }

        async function ban() {
            const user = document.getElementById("user").value;
            const reason = document.getElementById("reason").value;
            const key = prompt("Enter key");

            await fetch("/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": key
                },
                body: JSON.stringify({ type: "ban", user, reason })
            });

            alert("Ban sent");
        }

        async function announce() {
            const message = document.getElementById("msg").value;
            const key = prompt("Enter key");

            await fetch("/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": key
                },
                body: JSON.stringify({ type: "announcement", message })
            });

            alert("Sent");
        }

        async function eventSend(name) {
            const key = prompt("Enter key");

            await fetch("/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": key
                },
                body: JSON.stringify({ type: "event", event: name })
            });

            alert("Event triggered");
        }

        loadKey();
    </script>

    </body>
    </html>
    `);
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
