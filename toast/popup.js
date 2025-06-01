/**
 * Cria e mostra um popup totalmente dinâmico
 * @param {Object} options - Opções de configuração do popup
 */
function showPopup(options = {}) {
    // Configurações padrão
    const icons = {
        success: '✓', error: '✗', warning: '⚠', info: 'ℹ', copy: '⎘', default: '●'
    };
    
    const defaultTitles = {
        success: 'Sucesso!', error: 'Erro!', warning: 'Atenção!', 
        info: 'Informação', copy: 'Copiado!', default: 'Notificação'
    };
    
    const config = {
        type: 'default',
        title: defaultTitles[options.type] || defaultTitles.default,
        subtitle: '',
        message: '',
        buttons: [],
        showClose: true,
        autoClose: 0,
        animate: true,
        onClose: null,
        ...options
    };

    // Cria elementos
    const overlay = document.createElement('div');
    const container = document.createElement('div');
    const header = document.createElement('div');
    const icon = document.createElement('div');
    const headerText = document.createElement('div');
    const title = document.createElement('div');
    const subtitle = document.createElement('div');
    const closeBtn = document.createElement('div');
    const content = document.createElement('div');
    const footer = document.createElement('div');

    // Adiciona classes básicas
    overlay.className = 'dynamic-popup-overlay';
    container.className = `dynamic-popup-container dynamic-popup-${config.type}`;
    header.className = 'dynamic-popup-header';
    icon.className = 'dynamic-popup-icon';
    title.className = 'dynamic-popup-title';
    subtitle.className = 'dynamic-popup-subtitle';
    closeBtn.className = 'dynamic-popup-close';
    content.className = 'dynamic-popup-content';
    footer.className = 'dynamic-popup-footer';

    // Configura conteúdo
    icon.textContent = icons[config.type] || icons.default;
    title.textContent = config.title;
    subtitle.textContent = config.subtitle;
    content.textContent = config.message;
    closeBtn.textContent = '×';
    closeBtn.style.display = config.showClose ? 'flex' : 'none';

    // Adiciona botões
    if (config.buttons && config.buttons.length > 0) {
        config.buttons.forEach(btn => {
            const button = createButton(btn.text, btn.primary, btn.onClick);
            footer.appendChild(button);
        });
    } else {
        const okButton = createButton('OK', true);
        footer.appendChild(okButton);
    }

    // Monta a estrutura
    headerText.appendChild(title);
    if (config.subtitle) headerText.appendChild(subtitle);
    header.appendChild(icon);
    header.appendChild(headerText);
    header.appendChild(closeBtn);
    
    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(footer);
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Adiciona os estilos dinamicamente (apenas uma vez)
    if (!document.getElementById('dynamic-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-popup-styles';
        style.textContent = `
            .dynamic-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .dynamic-popup-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .dynamic-popup-container {
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                width: 90%;
                max-width: 400px;
                transform: translateY(20px) scale(0.95);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
            }
            
            .dynamic-popup-overlay.show .dynamic-popup-container {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            
            .dynamic-popup-header {
                padding: 20px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                position: relative;
            }
            
            .dynamic-popup-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                color: white;
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .dynamic-popup-title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 3px;
            }
            
            .dynamic-popup-subtitle {
                font-size: 14px;
                color: rgba(0, 0, 0, 0.6);
            }
            
            .dynamic-popup-close {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                color: rgba(0, 0, 0, 0.5);
                font-size: 20px;
            }
            
            .dynamic-popup-close:hover {
                background-color: rgba(0, 0, 0, 0.05);
                color: rgba(0, 0, 0, 0.8);
            }
            
            .dynamic-popup-content {
                padding: 20px;
                color: #333;
                line-height: 1.5;
            }
            
            .dynamic-popup-footer {
                padding: 15px 20px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .dynamic-popup-button {
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            
            .dynamic-popup-button-primary {
                background-color: #2196f3;
                color: white;
            }
            
            .dynamic-popup-button-primary:hover {
                background-color: #0d8bf2;
            }
            
            .dynamic-popup-button-secondary {
                background-color: rgba(0, 0, 0, 0.05);
                color: #333;
            }
            
            .dynamic-popup-button-secondary:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            /* Tipos de popup */
            .dynamic-popup-success .dynamic-popup-icon {
                background-color: #4caf50;
            }
            
            .dynamic-popup-success .dynamic-popup-button-primary {
                background-color: #4caf50;
            }
            
            .dynamic-popup-success .dynamic-popup-button-primary:hover {
                background-color: #3d8b40;
            }
            
            .dynamic-popup-error .dynamic-popup-icon {
                background-color: #f44336;
            }
            
            .dynamic-popup-error .dynamic-popup-button-primary {
                background-color: #f44336;
            }
            
            .dynamic-popup-error .dynamic-popup-button-primary:hover {
                background-color: #d32f2f;
            }
            
            .dynamic-popup-warning .dynamic-popup-icon {
                background-color: #ff9800;
            }
            
            .dynamic-popup-warning .dynamic-popup-button-primary {
                background-color: #ff9800;
            }
            
            .dynamic-popup-warning .dynamic-popup-button-primary:hover {
                background-color: #e68a00;
            }
            
            .dynamic-popup-info .dynamic-popup-icon {
                background-color: #2196f3;
            }
            
            .dynamic-popup-info .dynamic-popup-button-primary {
                background-color: #2196f3;
            }
            
            .dynamic-popup-info .dynamic-popup-button-primary:hover {
                background-color: #0d8bf2;
            }
            
            .dynamic-popup-copy .dynamic-popup-icon {
                background-color: #9c27b0;
            }
            
            .dynamic-popup-copy .dynamic-popup-button-primary {
                background-color: #9c27b0;
            }
            
            .dynamic-popup-copy .dynamic-popup-button-primary:hover {
                background-color: #7b1fa2;
            }
            
            .dynamic-popup-default .dynamic-popup-icon {
                background-color: #333;
            }
            
            .dynamic-popup-default .dynamic-popup-button-primary {
                background-color: #333;
            }
            
            .dynamic-popup-default .dynamic-popup-button-primary:hover {
                background-color: #222;
            }
            
            /* Animações */
            @keyframes dynamic-popup-pulse {
                0% { transform: translateY(0) scale(1); }
                50% { transform: translateY(0) scale(1.05); }
                100% { transform: translateY(0) scale(1); }
            }
            
            .dynamic-popup-pulse {
                animation: dynamic-popup-pulse 0.5s ease;
            }
            
            /* Responsivo */
            @media (max-width: 480px) {
                .dynamic-popup-footer {
                    flex-direction: column;
                }
                
                .dynamic-popup-button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Mostra o popup
    setTimeout(() => {
        overlay.classList.add('show');
        
        if (config.animate) {
            container.classList.add('dynamic-popup-pulse');
            container.addEventListener('animationend', () => {
                container.classList.remove('dynamic-popup-pulse');
            }, { once: true });
        }
    }, 10);

    // Fechamento automático
    let autoCloseTimeout;
    if (config.autoClose > 0) {
        autoCloseTimeout = setTimeout(closePopup, config.autoClose);
    }

    // Event listeners
    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });

    // Função para fechar
    function closePopup() {
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
        
        overlay.classList.remove('show');
        
        setTimeout(() => {
            overlay.remove();
            config.onClose && config.onClose();
        }, 300);
    }

    // Função auxiliar para criar botões
    function createButton(text, primary = false, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = primary 
            ? 'dynamic-popup-button dynamic-popup-button-primary' 
            : 'dynamic-popup-button dynamic-popup-button-secondary';
        
        button.addEventListener('click', () => {
            onClick && onClick();
            closePopup();
        });
        
        return button;
    }

    return closePopup;
}

// Exemplo de uso:
document.addEventListener('DOMContentLoaded', function() {
    // Exemplo 1: Popup simples
    

    // Exemplo 2: Popup com confirmação
    // showPopup({
    //     type: 'warning',
    //     title: 'Confirmar exclusão',
    //     message: 'Tem certeza que deseja excluir este item?',
    //     buttons: [
    //         { text: 'Cancelar', primary: false },
    //         { text: 'Excluir', primary: true, onClick: () => alert('Item excluído!') }
    //     ]
    // });
});