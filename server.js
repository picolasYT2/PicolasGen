const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// SERVIDOR DE ARCHIVOS ESTÁTICOS
// =========================
// Servir carpeta tmp para las capturas de pantalla
app.use('/screenshots', express.static(path.join(__dirname, 'tmp')));

// =========================
// BACKEND (IMPORTANTE)
// =========================
try {
    const backendRouter = require("./backend/server");

    console.log("🔥 backendRouter cargado:", typeof backendRouter);

    app.use("/api", backendRouter);

    console.log("✅ Backend conectado en /api");
} catch (err) {
    console.error("❌ Error cargando backend:");
    console.error(err);
}

// =========================
// FRONTEND
// =========================
app.use(express.static(path.join(__dirname, "frontend")));

// =========================
// TEST GLOBAL
// =========================
app.get("/ping", (req, res) => {
    res.send("pong 🏓");
});

// =========================
// FALLBACK (IMPORTANTE)
// =========================
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});