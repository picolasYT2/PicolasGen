const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const router = express.Router();
router.use(cors());
router.use(express.json());

// Función para pausas aleatorias (vital para evitar detección)
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
    return `Picolasgen${digits}!`; // Carácter especial para evitar errores de validación
}

router.post('/create-account', async (req, res) => {
    const username = generateUsername();
    const password = generatePassword();
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: false, // Roblox detecta el modo sin cabeza muy rápido
            defaultViewport: null,
            args: [
                '--start-maximized',
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        const [page] = await browser.pages();
        
        // User Agent realista
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        const signupUrl = 'https://www.roblox.com/es/CreateAccount';
        console.log(`🌐 Navegando a: ${signupUrl}`);
        await page.goto(signupUrl, { waitUntil: 'networkidle2' });

        // 1. Selección de Fecha de Nacimiento
        console.log('📅 Seleccionando fecha...');
        await page.waitForSelector('#MonthDropdown', { timeout: 15000 });
        
        await delay(Math.random() * 800 + 400);
        await page.select('#MonthDropdown', 'Jul');
        await delay(Math.random() * 400 + 200);
        await page.select('#DayDropdown', '28');
        await delay(Math.random() * 400 + 200);
        await page.select('#YearDropdown', '2000');

        // 2. Campo de Usuario
        const userSelector = '#signup-username';
        await page.waitForSelector(userSelector);
        await page.click(userSelector);
        await delay(Math.random() * 300 + 200);
        // Escribe como humano (delay aleatorio por tecla)
        await page.type(userSelector, username, { delay: Math.random() * 100 + 70 });

        // 3. Campo de Contraseña
        const passSelector = '#signup-password';
        await page.waitForSelector(passSelector);
        await page.click(passSelector);
        await delay(Math.random() * 300 + 200);
        await page.type(passSelector, password, { delay: Math.random() * 100 + 70 });

        // 4. Selección de Género (Opcional, pero ayuda a parecer humano)
        const genderSelector = '#MaleButton'; // O #FemaleButton
        if (await page.$(genderSelector)) {
            await page.click(genderSelector);
            await delay(Math.random() * 500 + 300);
        }

        console.log(`\n✅ Datos completados: ${username} / ${password}`);

        // 5. Clic en el Botón de Registrarse
        const signUpButtonSelector = '#signup-button';
        await page.waitForSelector(signUpButtonSelector);
        
        // Movimiento de mouse "orgánico" hacia el botón
        const buttonHandle = await page.$(signUpButtonSelector);
        const box = await buttonHandle.boundingBox();
        
        await page.mouse.move(
            box.x + box.width / 2 + (Math.random() * 10 - 5), 
            box.y + box.height / 2 + (Math.random() * 10 - 5),
            { steps: 10 } // Suaviza el movimiento
        );
        
        await delay(Math.random() * 600 + 400);
        console.log('🚀 Haciendo clic en el botón de registro...');
        await page.click(signUpButtonSelector);

        // 6. Fase de Captcha y Finalización
        console.log('⚠️  ATENCIÓN: Si aparece un Captcha, resuélvelo manualmente en la ventana.');
        console.log('⏳ Esperando redirección al Home...');

        // Esperar hasta que la URL contenga 'home' (éxito)
        await page.waitForFunction(
            () => window.location.href.includes('home'),
            { timeout: 600000 } // 10 minutos de margen para el captcha
        );

        console.log('🎉 ¡Cuenta creada con éxito!');
        
        // Esperar un poco antes de cerrar para asegurar que la sesión se guarde
        await delay(5000);
        await browser.close();
        
        res.json({ success: true, username, password });

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;