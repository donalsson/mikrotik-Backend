require("dotenv").config();
const express = require("express");
const cors = require("cors");
const MikroNode = require("mikronode");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

async function getConnection() {
  const device = new MikroNode({
    host: process.env.MIKROTIK_HOST,
    port: process.env.MIKROTIK_PORT
  });
  
  const conn = await device.connect(
    process.env.MIKROTIK_USER,
    process.env.MIKROTIK_PASS
  );
  const chan = conn.openChannel();
  return { conn, chan };
}

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend Railway + MikroTik OK" });
});

app.post("/api/hotspot/create-user", async (req, res) => {
  const { username, password, profile } = req.body;

  let conn, chan;
  try {
    ({ conn, chan } = await getConnection());

    await chan.write("/ip/hotspot/user/add", [
      `=name=${username}`,
      `=password=${password}`,
      `=profile=${profile || "default"}`
    ]);

    res.json({ success: true, message: "Utilisateur créé sur MikroTik" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    try { chan && chan.close(); } catch {}
    try { conn && conn.close(); } catch {}
  }
});

app.get("/api/test-mikrotik", async (req, res) => {
  let conn, chan;

  console.log("===== TEST MIKROTIK =====");
  console.log("HOST:", process.env.MIKROTIK_HOST);
  console.log("PORT:", process.env.MIKROTIK_PORT);
  console.log("USER:", process.env.MIKROTIK_USER);
  console.log("PASS:", process.env.MIKROTIK_PASS ? "****" : "NOT SET");

  try {
    const device = new MikroNode({
      host: process.env.MIKROTIK_HOST,
      port: process.env.MIKROTIK_PORT
    });

    console.log("Tentative de connexion...");

    conn = await device.connect(
      process.env.MIKROTIK_USER,
      process.env.MIKROTIK_PASS
    );

    console.log("Connexion réussie ✅");

    chan = conn.openChannel();

    res.json({ success: true, message: "Connexion OK" });

  } catch (error) {
    console.error("Erreur MikroTik ❌:", error);

    res.json({
      success: false,
      error: error.message
    });
  } finally {
    try { chan && chan.close(); } catch {}
    try { conn && conn.close(); } catch {}

    console.log("Connexion fermée 🔒");
    console.log("=========================");
  }
});

app.post("/api/hotspot/disable-user", async (req, res) => {
  const { username } = req.body;

  let conn, chan;
  try {
    ({ conn, chan } = await getConnection());

    await chan.write("/ip/hotspot/user/set", [
      `=.id=[find name="${username}"]`,
      "=disabled=yes"
    ]);

    res.json({ success: true, message: "Utilisateur désactivé" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    try { chan && chan.close(); } catch {}
    try { conn && conn.close(); } catch {}
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`test`);
});
