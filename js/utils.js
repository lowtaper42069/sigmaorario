/* Stili per le notifiche */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
}

.notification-success {
    background: var(--success);
    color: white;
}

.notification-error {
    background: var(--danger);
    color: white;
}

.notification-info {
    background: var(--info);
    color: white;
}

.notification-warning {
    background: var(--warning);
    color: white;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    margin-left: 10px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

/* Responsive per notifiche */
@media (max-width: 768px) {
    .notification {
        left: 20px;
        right: 20px;
        min-width: auto;
        max-width: none;
    }
}
