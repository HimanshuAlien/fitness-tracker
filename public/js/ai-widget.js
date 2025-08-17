// ai-widget.js - Modern Clean JARVIS AI Chat Widget
class AIWidget {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.messageId = 0;
        this.init();
    }

    init() {
        // Don't show on login/register pages
        if (window.location.pathname.includes('/login') ||
            window.location.pathname.includes('/register') ||
            window.location.pathname.includes('login.html') ||
            window.location.pathname.includes('register.html')) {
            return;
        }

        this.loadBootstrap();
        this.createWidget();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }

    loadBootstrap() {
        // Load Bootstrap CSS if not already loaded
        if (!document.querySelector('link[href*="bootstrap"]')) {
            const bootstrapCSS = document.createElement('link');
            bootstrapCSS.rel = 'stylesheet';
            bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
            document.head.appendChild(bootstrapCSS);
        }
    }

    createWidget() {
        const widgetHTML = `
            <div id="ai-chat-widget" class="ai-widget-container">
                <!-- Floating Button -->
                <div id="ai-chat-toggle" class="ai-chat-toggle">
                    <div class="ai-pulse-ring"></div>
                    <div class="ai-pulse-ring-2"></div>
                    <!-- Cool AI Robot Emoji -->
                    <span style="font-size: 28px;">🤖</span>
                    <span class="ai-notification-dot"></span>
                </div>

                <!-- Chat Window -->
                <div id="ai-chat-window" class="ai-chat-window">
                    <!-- Header -->
                    <div class="ai-chat-header">
                        <div class="d-flex align-items-center flex-grow-1">
                            <div class="ai-avatar me-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="5" y="8" width="14" height="12" rx="3" fill="#2563eb" opacity="0.2"/>
                                    <rect x="6" y="9" width="12" height="10" rx="2" fill="#2563eb"/>
                                    <circle cx="9" cy="13" r="1" fill="white"/>
                                    <circle cx="15" cy="13" r="1" fill="white"/>
                                    <rect x="10" y="16" width="4" height="0.8" rx="0.4" fill="white"/>
                                    <line x1="12" y1="8" x2="12" y2="6" stroke="#2563eb" stroke-width="1.5"/>
                                    <circle cx="12" cy="5" r="0.8" fill="#2563eb"/>
                                </svg>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0 fw-semibold">JARVIS</h6>
                                <small class="ai-subtitle d-flex align-items-center">
                                    <span class="ai-status-dot"></span>
                                    <span class="ai-status-text">Online</span>
                                    <span class="ai-separator">•</span>
                                    <span>AI Fitness Assistant</span>
                                </small>
                            </div>
                        </div>
                        <div class="ai-header-controls d-flex align-items-center">
                            <button id="ai-chat-close" class="ai-control-btn" title="Close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Messages Area -->
                    <div class="ai-chat-messages" id="ai-messages">
                        <!-- Messages will be added here -->
                    </div>
                    
                    <!-- Input Area -->
                    <div class="ai-chat-input-container">
                        <div class="ai-chat-input p-3">
                            <div class="input-group">
                                <input type="text" id="ai-input" class="form-control ai-input-field" 
                                       placeholder="Ask JARVIS about fitness..." maxlength="500">
                                <button id="ai-send" class="btn ai-send-btn" type="button" title="Send Message">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="ai-send-icon">
                                        <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                .ai-widget-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* Toggle Button - Clean Design */
                .ai-chat-toggle {
                    width: 60px;
                    height: 60px;
                    background: #2563eb;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: visible;
                }

                .ai-chat-toggle:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
                    background: #1d4ed8;
                }

                /* Fixed Pulse Rings */
                .ai-pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 2px solid rgba(37, 99, 235, 0.4);
                    border-radius: 50%;
                    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
                    top: 0;
                    left: 0;
                }

                .ai-pulse-ring-2 {
                    position: absolute;
                    width: 120%;
                    height: 120%;
                    border: 1px solid rgba(37, 99, 235, 0.3);
                    border-radius: 50%;
                    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) 0.5s infinite;
                    top: -10%;
                    left: -10%;
                }

                @keyframes pulse-ring {
                    0% { 
                        transform: scale(0.8); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: scale(2.2); 
                        opacity: 0; 
                    }
                }

                /* Status Dot */
                .ai-notification-dot {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 12px;
                    height: 12px;
                    background: #10b981;
                    border: 2px solid white;
                    border-radius: 50%;
                    animation: bounce 2s infinite;
                }

                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0,-6px,0); }
                    70% { transform: translate3d(0,-3px,0); }
                    90% { transform: translate3d(0,-1px,0); }
                }

                /* Chat Window - Modern Clean Design */
                .ai-chat-window {
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 380px;
                    height: 500px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                }

                .ai-chat-window.open {
                    display: flex;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { 
                        transform: translateY(20px) scale(0.95); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateY(0) scale(1); 
                        opacity: 1; 
                    }
                }

                /* Header - Clean */
                .ai-chat-header {
                    background: #f8fafc;
                    color: #1f2937;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #e5e7eb;
                }

                .ai-chat-header h6 {
                    color: #1f2937;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .ai-subtitle {
                    color: #6b7280;
                    font-size: 0.8rem;
                }

                .ai-status-text {
                    color: #10b981;
                    font-weight: 500;
                }

                .ai-separator {
                    margin: 0 8px;
                    opacity: 0.6;
                }

                .ai-control-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .ai-control-btn:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                /* Avatar - Clean */
                .ai-avatar {
                    width: 40px;
                    height: 40px;
                    background: #eff6ff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #dbeafe;
                }

                .ai-status-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { 
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); 
                    }
                    70% { 
                        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); 
                    }
                    100% { 
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); 
                    }
                }

                /* Messages Area - Clean */
                .ai-chat-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: white;
                    color: #374151;
                    scroll-behavior: smooth;
                }

                .ai-chat-messages::-webkit-scrollbar {
                    width: 4px;
                }

                .ai-chat-messages::-webkit-scrollbar-track {
                    background: #f3f4f6;
                }

                .ai-chat-messages::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 2px;
                }

                .ai-chat-messages::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }

                .ai-message-enter {
                    animation: messageSlide 0.3s ease-out;
                }

                @keyframes messageSlide {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* Message Bubbles - Modern Clean */
                .ai-assistant-bubble {
                    background: #f8fafc;
                    color: #374151;
                    padding: 16px 20px;
                    border-radius: 18px 18px 18px 6px;
                    max-width: 85%;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }

                .ai-user-bubble {
                    background: #2563eb;
                    color: white;
                    padding: 16px 20px;
                    border-radius: 18px 18px 6px 18px;
                    max-width: 85%;
                    margin-left: auto;
                    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
                }

                .ai-mini-avatar {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #eff6ff;
                    border-radius: 50%;
                    border: 1px solid #dbeafe;
                }

                /* Input Area - Clean */
                .ai-chat-input-container {
                    background: white;
                    border-top: 1px solid #e5e7eb;
                }

                .ai-input-field {
                    border: 1px solid #d1d5db;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: white;
                    color: #374151;
                }

                .ai-input-field::placeholder {
                    color: #9ca3af;
                }

                .ai-input-field:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    outline: none;
                }

                .ai-send-btn {
                    background: #2563eb;
                    border: none;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    margin-left: 8px;
                }

                .ai-send-btn:hover {
                    background: #1d4ed8;
                    transform: scale(1.05);
                }

                .ai-send-btn:disabled {
                    background: #9ca3af;
                    transform: none;
                    cursor: not-allowed;
                }

                /* Typing Animation - Clean */
                .ai-typing-bubble {
                    background: #f8fafc;
                    color: #374151;
                    padding: 16px 20px;
                    border-radius: 18px 18px 18px 6px;
                    max-width: 85%;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }

                .typing-dots {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }

                .typing-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #9ca3af;
                    animation: typingDot 1.4s infinite both;
                }

                .typing-dot:nth-child(1) { animation-delay: 0s; }
                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typingDot {
                    0%, 60%, 100% { 
                        transform: translateY(0); 
                        opacity: 0.4; 
                    }
                    30% { 
                        transform: translateY(-8px); 
                        opacity: 1; 
                    }
                }

                /* Responsive Design */
                @media (max-width: 480px) {
                    .ai-widget-container {
                        bottom: 16px;
                        right: 16px;
                    }

                    .ai-chat-window {
                        width: calc(100vw - 32px);
                        height: calc(100vh - 120px);
                        right: 16px;
                        bottom: 80px;
                    }

                    .ai-chat-toggle {
                        width: 56px;
                        height: 56px;
                    }

                    .ai-robot-icon {
                        width: 28px;
                        height: 28px;
                    }
                }

                @media (max-width: 768px) {
                    .ai-chat-window {
                        width: 340px;
                        height: 480px;
                    }
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .ai-chat-window {
                        background: #1f2937;
                        border-color: #374151;
                    }

                    .ai-chat-header {
                        background: #111827;
                        border-bottom-color: #374151;
                    }

                    .ai-chat-header h6 {
                        color: #f9fafb;
                    }

                    .ai-chat-messages {
                        background: #1f2937;
                    }

                    .ai-assistant-bubble {
                        background: #111827;
                        color: #e5e7eb;
                        border-color: #374151;
                    }

                    .ai-input-field {
                        background: #111827;
                        border-color: #374151;
                        color: #e5e7eb;
                    }

                    .ai-input-field::placeholder {
                        color: #6b7280;
                    }

                    .ai-chat-input-container {
                        background: #1f2937;
                        border-top-color: #374151;
                    }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    addWelcomeMessage() {
        setTimeout(() => {
            this.addMessage(
                "Hello! I'm JARVIS, your AI fitness assistant. I can help you with workout routines, nutrition advice, and fitness goals. What would you like to know?",
                false
            );
        }, 800);
    }

    attachEventListeners() {
        const toggle = document.getElementById('ai-chat-toggle');
        const close = document.getElementById('ai-chat-close');
        const input = document.getElementById('ai-input');
        const send = document.getElementById('ai-send');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        send.addEventListener('click', () => this.sendMessage());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        const window = document.getElementById('ai-chat-window');
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            window.classList.add('open');
            document.getElementById('ai-input').focus();
        } else {
            window.classList.remove('open');
        }
    }

    closeChat() {
        const window = document.getElementById('ai-chat-window');
        window.classList.remove('open');
        this.isOpen = false;
    }

    addMessage(content, isUser = false) {
        const messages = document.getElementById('ai-messages');
        const messageDiv = document.createElement('div');
        const messageId = ++this.messageId;

        messageDiv.className = `d-flex mb-3 ai-message-enter ${isUser ? 'justify-content-end' : ''}`;
        messageDiv.setAttribute('data-message-id', messageId);

        if (isUser) {
            messageDiv.innerHTML = `
                <div class="ai-user-bubble">
                    <div class="message-text">${this.formatMessage(content)}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="ai-assistant-bubble">
                    <div class="d-flex align-items-center mb-2">
                        <div class="ai-mini-avatar me-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="5" y="8" width="14" height="12" rx="2" fill="#2563eb" opacity="0.8"/>
                                <circle cx="9" cy="12" r="1" fill="white"/>
                                <circle cx="15" cy="12" r="1" fill="white"/>
                                <rect x="10.5" y="15" width="3" height="0.8" rx="0.4" fill="white" opacity="0.9"/>
                                <line x1="12" y1="8" x2="12" y2="6" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
                                <circle cx="12" cy="5" r="0.8" fill="#2563eb"/>
                            </svg>
                        </div>
                        <small class="fw-semibold" style="color: #2563eb;">JARVIS</small>
                    </div>
                    <div class="message-text">${this.formatMessage(content)}</div>
                </div>
            `;
        }

        messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const messages = document.getElementById('ai-messages');
        messages.scrollTop = messages.scrollHeight;
    }

    showTyping() {
        const messages = document.getElementById('ai-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'd-flex mb-3 ai-message-enter';
        typingDiv.id = 'ai-typing';
        typingDiv.innerHTML = `
            <div class="ai-typing-bubble">
                <div class="d-flex align-items-center mb-2">
                    <div class="ai-mini-avatar me-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="5" y="8" width="14" height="12" rx="2" fill="#2563eb" opacity="0.8"/>
                            <circle cx="9" cy="12" r="1" fill="white"/>
                            <circle cx="15" cy="12" r="1" fill="white"/>
                            <rect x="10.5" y="15" width="3" height="0.8" rx="0.4" fill="white" opacity="0.9"/>
                            <line x1="12" y1="8" x2="12" y2="6" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
                            <circle cx="12" cy="5" r="0.8" fill="#2563eb"/>
                        </svg>
                    </div>
                    <small class="fw-semibold" style="color: #2563eb;">JARVIS</small>
                </div>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        messages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('ai-typing');
        if (typing) {
            typing.remove();
        }
    }

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const send = document.getElementById('ai-send');
        const message = input.value.trim();

        if (!message || this.isTyping) return;

        this.isTyping = true;
        this.addMessage(message, true);
        input.value = '';
        send.disabled = true;
        this.showTyping();

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) throw new Error('AI service unavailable');

            const data = await response.json();
            this.hideTyping();
            this.addMessage(data.response.replace(/\*/g, ''));

        } catch (error) {
            this.hideTyping();
            this.addMessage('Sorry, I had trouble processing that. Please try again!');
        } finally {
            this.isTyping = false;
            send.disabled = false;
            input.focus();
        }
    }
}

// Initialize widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIWidget();
});