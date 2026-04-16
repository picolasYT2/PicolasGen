const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// CREAR CARPETA tmp SI NO EXISTE
// =========================
const tmpDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log("📁 Carpeta 'tmp' creada para las capturas.");
}

// =========================
// SERVIDOR DE ARCHIVOS ESTÁTICOS
// =========================
// Servir carpeta tmp para las capturas de pantalla (endpoint /screenshots)
app.use("/screenshots", express.static(tmpDir));

// Servir el frontend estático (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "frontend")));

// =========================
// BACKEND (ROUTER DE PUPPETEER)
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
// TEST GLOBAL
// =========================
app.get("/ping", (req, res) => {
    res.send("pong 🏓");
});

// =========================
// FALLBACK (para SPA o rutas no encontradas)
// =========================
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📸 Las capturas se servirán en /screenshots/latest.png`);
    console.log(`🖥️  Frontend disponible en http://localhost:${PORT}`);
});