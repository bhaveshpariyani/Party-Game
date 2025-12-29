import React from 'react';
import { Download, Smartphone, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InstallAppModal({
    isOpen,
    isInstalled,
    isInstalling,
    instruction,
    isInstallable,
    onInstall,
    onOpenApp,
}) {
    if (!isOpen) return null;

    const shouldShowButton = isInstalled || isInstallable;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)', // Dark overlay
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '350px',
                    borderRadius: '1.5rem',
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        padding: '1rem',
                        borderRadius: '50%',
                        boxShadow: '0 8px 16px var(--primary-glow)'
                    }}>
                        <Smartphone size={32} color="white" />
                    </div>
                    <h2 className="text-gradient" style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>
                        {isInstalled ? 'Open App' : 'Install This App'}
                    </h2>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    {isInstalled ? (
                        <>
                            <p style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>
                                App is already installed!
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                                You can open it directly. If it's not opening, try clearing your browser cache and reinstalling.
                            </p>
                        </>
                    ) : (
                        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                            {instruction}
                        </p>
                    )}
                </div>

                {/* Footer Actions */}
                {shouldShowButton && (
                    <div style={{ padding: '1rem', paddingTop: 0 }}>
                        {isInstalled ? (
                            <button
                                onClick={onOpenApp}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '1rem'
                                }}
                            >
                                Open App <ExternalLink size={18} />
                            </button>
                        ) : (
                            isInstallable && (
                                <button
                                    onClick={onInstall}
                                    disabled={isInstalling}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        opacity: isInstalling ? 0.7 : 1
                                    }}
                                >
                                    <Download size={20} />
                                    {isInstalling ? 'Installing…' : 'Install App'}
                                </button>
                            )
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
