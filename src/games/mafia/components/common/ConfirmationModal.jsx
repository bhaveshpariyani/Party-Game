import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmationModal({
    isOpen,
    onConfirm,
    onCancel,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Yes, Confirm",
    cancelText = "Cancel",
    isDanger = false
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="glass-panel"
                        style={{
                            width: '100%',
                            maxWidth: '350px',
                            padding: '2rem',
                            borderRadius: '1.5rem',
                            textAlign: 'center',
                            border: `1px solid ${isDanger ? 'var(--danger)' : 'rgba(255,255,255,0.2)'}`,
                            background: 'var(--surface)'
                        }}
                    >
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h3>
                        <div style={{ marginBottom: '2rem', opacity: 0.9 }}>
                            {message}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-ghost"
                                onClick={onCancel}
                                style={{ flex: 1, padding: '0.8rem' }}
                            >
                                {cancelText}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={onConfirm}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    background: isDanger ? 'var(--danger)' : 'var(--success)'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
