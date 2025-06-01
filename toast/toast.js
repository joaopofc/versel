// Ícones podem ser substituídos por sua biblioteca de ícones preferida
const toastIcons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    copy: '⎘',
    default: '●'
};

const toastTitles = {
    success: 'Sucesso!',
    error: 'Erro!',
    warning: 'Aviso!',
    info: 'Informação',
    copy: 'Copiado!',
    default: 'Notificação'
};

/**
 * Mostra uma notificação toast
 * @param {string} message - A mensagem a ser exibida
 * @param {string} type - Tipo do toast (success, error, warning, info, copy, default)
 * @param {object} options - Opções adicionais
 * @param {string} options.title - Título personalizado
 * @param {number} options.duration - Duração em milissegundos (0 para não fechar automaticamente)
 * @param {boolean} options.autoClose - Se deve fechar automaticamente (padrão: true)
 */
function showMsg(message, type = 'default', options = {}) {
    // Cria o container se não existir
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    // Configurações padrão
    const defaultOptions = {
        title: toastTitles[type] || toastTitles.default,
        duration: 4000,
        autoClose: true
    };
    
    // Mescla as opções
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Cria o toast
    const toast = document.createElement('div');
    toast.className = `toast2 toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon">${toastIcons[type] || toastIcons.default}</div>
        <div class="toast-content">
            <div class="toast-title">${mergedOptions.title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close">×</div>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    // Adiciona ao container
    container.appendChild(toast);
    
    // Calcula a posição baseada nos toasts existentes
    const allToasts = container.querySelectorAll('.toast2');
    const toastIndex = allToasts.length - 1;
    toast.style.marginTop = `${toastIndex * 40}px`;
    
    // Força o reflow para que a animação funcione
    void toast.offsetWidth;
    
    // Mostra o toast
    toast.classList.add('show');
    
    // Configura o fechamento automático
    if (mergedOptions.autoClose && mergedOptions.duration > 0) {
        const progressBar = toast.querySelector('.toast-progress-bar');
        progressBar.style.transitionDuration = `${mergedOptions.duration}ms`;
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 10);
        
        const timeoutId = setTimeout(() => {
            closeToast(toast);
        }, mergedOptions.duration);
        
        // Armazena o timeoutId no elemento para poder cancelar se necessário
        toast.dataset.timeoutId = timeoutId;
    }
    
    // Fechamento ao clicar no botão de fechar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        if (toast.dataset.timeoutId) {
            clearTimeout(parseInt(toast.dataset.timeoutId));
        }
        closeToast(toast);
    });
    
    // Retorna uma função para fechar manualmente o toast
    return () => closeToast(toast);
}

function closeToast(toast) {
    toast.classList.remove('show');
    
    // Quando a animação terminar, remove o toast
    toast.addEventListener('transitionend', () => {
        const container = document.getElementById('toastContainer');
        toast.remove();
        
        // Reorganiza os toasts restantes
        const remainingToasts = container.querySelectorAll('.toast');
        remainingToasts.forEach((t, index) => {
            t.style.marginTop = `${index * 40}px`;
        });
        
        // Remove o container se não houver mais toasts
        if (remainingToasts.length === 0) {
            container.remove();
        }
    });
}

// Exemplos de uso:
// showMsg("Operação concluída com sucesso", "success");
// showMsg("Falha ao salvar os dados", "error", { duration: 7000 });
// showMsg("Texto copiado para a área de transferência", "copy");
// showMsg("Sua sessão irá expirar em 5 minutos", "warning", { title: "Atenção" });
// showMsg("Novos recursos disponíveis na versão 2.0", "info");
// showMsg("Esta é uma mensagem padrão", "default", { autoClose: false });