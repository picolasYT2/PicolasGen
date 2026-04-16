const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const router = express.Router();
router.use(cors());
router.use(express.json());

// Crear carpeta tmp si no existe
const tmpDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// Variable para controlar el intervalo de capturas
let screenshotInterval = null;
const screenshotPath = path.join(tmpDir, 'latest.png');

// Función para tomar captura y guardarla
async function takeScreenshot(page) {
    try {
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log('📸 Captura guardada en tmp/latest.png');
    } catch (err) {
        console.warn('Error al tomar captura:', err.message);
    }
}

// Endpoint para obtener la última captura
router.get('/screenshot', (req, res) => {
    if (fs.existsSync(screenshotPath)) {
        res.sendFile(screenshotPath);
    } else {
        res.status(404).send('No screenshot yet');
    }
});

// Función para pausas aleatorias
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function generateUsername() {
    const prefixes = ["Cool", "Pro", "Super", "Mega", "Ultra", "Ninja", "Dark", "Light", "Shadow", "Fire", "Ice"];
    const suffixes = ["Player", "Gamer", "Noob", "Pro", "King", "Queen", "Lord", "Blox", "Master"];
    const nums = Math.floor(Math.random() * 9000 + 1000);
    return prefixes[Math.floor(Math.random() * prefixes.length)] +
           suffixes[Math.floor(Math.random() * suffixes.length)] +
           nums;
}

function generatePassword() {
    const digits = Math.floor(Math.random() * 900 + 100);
    return `Picolasgen${digits}!`;
}

router.post('/create-account', async (req, res) => {
    const username = generateUsername();
    const password = generatePassword();
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: false,   // Cambiado a false para que veas la ventana
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        });

        const [page] = await browser.pages();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        const signupUrl = 'https://www.roblox.com/es/CreateAccount';
        console.log(`🌐 Navegando a: ${signupUrl}`);
        await page.goto(signupUrl, { waitUntil: 'networkidle2' });

        // Iniciar capturas cada 2 segundos
        screenshotInterval = setInterval(() => takeScreenshot(page), 2000);

        // Rellenar formulario...
        console.log('📅 Seleccionando fecha...');
        await page.waitForSelector('#MonthDropdown', { timeout: 15000 });
        await delay(Math.random() * 800 + 400);
        await page.select('#MonthDropdown', 'Jul');
        await delay(Math.random() * 400 + 200);
        await page.select('#DayDropdown', '28');
        await delay(Math.random() * 400 + 200);
        await page.select('#YearDropdown', '2000');

        const userSelector = '#signup-username';
        await page.waitForSelector(userSelector);
        await page.click(userSelector);
        await delay(Math.random() * 300 + 200);
        await page.type(userSelector, username, { delay: Math.random() * 100 + 70 });

        const passSelector = '#signup-password';
        await page.waitForSelector(passSelector);
        await page.click(passSelector);
        await delay(Math.random() * 300 + 200);
        await page.type(passSelector, password, { delay: Math.random() * 100 + 70 });

        const genderSelector = '#MaleButton';
        if (await page.$(genderSelector)) {
            await page.click(genderSelector);
            await delay(Math.random() * 500 + 300);
        }

        console.log(`\n✅ Datos completados: ${username} / ${password}`);

        const signUpButtonSelector = '#signup-button';
        await page.waitForSelector(signUpButtonSelector);
        const buttonHandle = await page.$(signUpButtonSelector);
        const box = await buttonHandle.boundingBox();
        await page.mouse.move(
            box.x + box.width / 2 + (Math.random() * 10 - 5),
            box.y + box.height / 2 + (Math.random() * 10 - 5),
            { steps: 10 }
        );
        await delay(Math.random() * 600 + 400);
        console.log('🚀 Haciendo clic en el botón de registro...');
        await page.click(signUpButtonSelector);

        console.log('⚠️ ATENCIÓN: Resuelve el CAPTCHA manualmente en la ventana.');
        console.log('⏳ Esperando redirección al Home...');

        await page.waitForFunction(
            () => window.location.href.includes('home'),
            { timeout: 600000 }
        );

        console.log('🎉 ¡Cuenta creada con éxito!');
        await delay(5000);
        
        // Detener capturas
        if (screenshotInterval) clearInterval(screenshotInterval);
        await browser.close();
        
        res.json({ success: true, username, password });

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
        if (screenshotInterval) clearInterval(screenshotInterval);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;