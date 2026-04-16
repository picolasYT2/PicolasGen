// ==================== GESTIÓN DE CUENTAS (LOCALSTORAGE) ====================
let accounts = [];
const STORAGE_KEY = 'picolasgen_real_accounts';

// Elementos DOM
const btnCreate = document.getElementById('btnCreateAccount');
const accountsList = document.getElementById('accountsList');
const totalCountSpan = document.getElementById('totalCount');
const lastCreatedSpan = document.getElementById('lastCreated');
const clearAllBtn = document.getElementById('clearAllBtn');

// Cargar cuentas guardadas
function loadAccounts() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        accounts = JSON.parse(stored);
    } else {
        accounts = [];
    }
    renderTable();
    updateStats();
}

// Guardar cuentas
function saveAccounts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    renderTable();
    updateStats();
}

function updateStats() {
    totalCountSpan.textContent = accounts.length;
    if (accounts.length > 0) {
        lastCreatedSpan.textContent = accounts[0].fecha;
    } else {
        lastCreatedSpan.textContent = '—';
    }
}

function renderTable() {
    if (accounts.length === 0) {
        accountsList.innerHTML = `<tr class="empty-row"><td colspan="6">✨ No hay cuentas generadas aún. Presiona el botón.</td></tr>`;
        return;
    }
    let html = '';
    accounts.forEach((acc, idx) => {
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong style="color:#b2f0ff;">${escapeHtml(acc.username)}</strong></td>
                <td><span style="font-family:monospace;">${escapeHtml(acc.password)}</span></td>
                <td>${escapeHtml(acc.fecha)}</td>
                <td>
                    <button class="copy-user" data-user="${escapeHtml(acc.username)}">📋 User</button>
                    <button class="copy-pass" data-pass="${escapeHtml(acc.password)}">🔑 Pass</button>
                </td>
                <td><button class="delete-account" data-id="${acc.id}">🗑️</button></td>
            </tr>
        `;
    });
    accountsList.innerHTML = html;

    // Eventos de copiar
    document.querySelectorAll('.copy-user').forEach(btn => {
        btn.addEventListener('click', () => copyToClipboard(btn.getAttribute('data-user'), 'Usuario'));
    });
    document.querySelectorAll('.copy-pass').forEach(btn => {
        btn.addEventListener('click', () => copyToClipboard(btn.getAttribute('data-pass'), 'Contraseña'));
    });
    document.querySelectorAll('.delete-account').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            accounts = accounts.filter(a => a.id !== id);
            saveAccounts();
        });
    });
}

function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado: ${text}`);
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== VISOR DE CAPTURAS EN TIEMPO REAL ====================
let screenshotPolling = null;

function startScreenshotViewer() {
    let container = document.getElementById('screenshotPreview');
    if (!container) {
        const cardAction = document.querySelector('.card-action');
        container = document.createElement('div');
        container.id = 'screenshotPreview';
        container.style.marginTop = '20px';
        container.style.padding = '15px';
        container.style.background = 'rgba(0,0,0,0.3)';
        container.style.borderRadius = '1rem';
        container.style.border = '1px solid rgba(79,109,253,0.4)';
        container.innerHTML = `
            <h3 style="color:#b2f0ff; margin-bottom:10px;">📸 Vista previa del navegador (actualiza cada 2 segundos)</h3>
            <img id="liveScreenshot" src="" alt="Cargando vista previa..." style="width:100%; max-width:800px; border-radius:12px; border:1px solid #3b5ef0;">
            <p style="color:#a9b7e0; margin-top:10px; font-size:0.8rem;">⚠️ Resuelve el CAPTCHA manualmente en la ventana que se abrió</p>
        `;
        cardAction.insertAdjacentElement('afterend', container);
    }

    const img = document.getElementById('liveScreenshot');
    // Actualizar cada 2.2 segundos
    screenshotPolling = setInterval(async () => {
        try {
            const url = `/api/screenshot?t=${Date.now()}`;
            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);
                img.src = imgUrl;
                img.onload = () => URL.revokeObjectURL(imgUrl);
            } else {
                img.src = '';
            }
        } catch (err) {
            console.warn('Error cargando screenshot:', err);
        }
    }, 2200);
}

function stopScreenshotViewer() {
    if (screenshotPolling) {
        clearInterval(screenshotPolling);
        screenshotPolling = null;
    }
    const img = document.getElementById('liveScreenshot');
    if (img) img.src = '';
}

// ==================== GENERAR CUENTA REAL (BACKEND) ====================
async function generateRealAccount() {
    // Mostrar el visor de capturas
    startScreenshotViewer();

    btnCreate.disabled = true;
    btnCreate.textContent = '⏳ Generando, resuelve el CAPTCHA...';
    
    try {
        const response = await fetch(`/api/create-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (data.success) {
            const newAccount = {
                id: Date.now(),
                username: data.username,
                password: data.password,
                fecha: new Date().toLocaleString()
            };
            accounts.unshift(newAccount);
            saveAccounts();
            alert(`✅ Cuenta creada exitosamente:\nUsuario: ${data.username}\nContraseña: ${data.password}`);
        } else {
            alert('❌ Error: ' + (data.error || 'No se pudo generar la cuenta. Intenta de nuevo.'));
        }
    } catch (error) {
        console.error(error);
        alert('❌ Error de conexión con el servidor. ¿Está ejecutándose el backend? (node server.js)');
    } finally {
        btnCreate.disabled = false;
        btnCreate.textContent = '🎲 + Generar cuenta Roblox REAL';
        // Detener el visor de capturas
        stopScreenshotViewer();
    }
}

// ==================== EVENTOS E INICIALIZACIÓN ====================
btnCreate.addEventListener('click', generateRealAccount);
clearAllBtn.addEventListener('click', () => {
    if (confirm('¿Eliminar todas las cuentas guardadas?')) {
        accounts = [];
        saveAccounts();
    }
});

// Inicializar
loadAccounts();