import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomeButton() {
    const navigate = useNavigate();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            style={{
                position: 'fixed',
                top: '1rem',
                left: '1rem',
                zIndex: 50,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            aria-label="Go Home"
        >
            <Home size={20} />
        </motion.button>
    );
}
