let accounts = []; // Se guardarán en localStorage

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
                <td>${idx+1}</td>
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

// Generar cuenta REAL llamando al backend
async function generateRealAccount() {
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
    }
}

// Eventos
btnCreate.addEventListener('click', generateRealAccount);
clearAllBtn.addEventListener('click', () => {
    if (confirm('¿Eliminar todas las cuentas guardadas?')) {
        accounts = [];
        saveAccounts();
    }
});

// Inicializar
loadAccounts();