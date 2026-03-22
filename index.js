const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

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

// ===== API ROUTES =====

// bot sends action
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

// get key (for dashboard)
app.get("/key", (req, res) => {
    res.json({ key: current_key, uses });
});

// manual rotate
app.post("/rotate", (req, res) => {
    old_key = current_key;
    current_key = generateKey();
    uses = 0;
    res.send("Key rotated");
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
