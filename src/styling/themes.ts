/**
 * @fileoverview Theme presets for Advanced Logger
 */

import type { ThemeVariant } from '../types/index.js';
import type { LevelStyleConfig } from '../utils/index.js';

/**
 * Theme configurations for different visual styles
 */
export const THEME_PRESETS: Record<ThemeVariant, Record<string, LevelStyleConfig>> = {
    default: {
        debug: {
            emoji: '🐞', label: 'DEBUG',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff', border: '1px solid #667eea',
            shadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
        },
        info: {
            emoji: 'ℹ️', label: 'INFO',
            background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
            color: '#ffffff', border: '1px solid #74b9ff',
            shadow: '0 2px 4px rgba(116, 185, 255, 0.3)',
        },
        warn: {
            emoji: '⚠️', label: 'WARN',
            background: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
            color: '#2d3436', border: '1px solid #fdcb6e',
            shadow: '0 2px 4px rgba(253, 203, 110, 0.3)',
        },
        error: {
            emoji: '❌', label: 'ERROR',
            background: 'linear-gradient(135deg, #e84393 0%, #d63031 100%)',
            color: '#ffffff', border: '1px solid #e84393',
            shadow: '0 2px 4px rgba(232, 67, 147, 0.3)',
        },
        success: {
            emoji: '✅', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
            color: '#ffffff', border: '1px solid #00b894',
            shadow: '0 2px 4px rgba(0, 184, 148, 0.3)',
        },
        critical: {
            emoji: '🔥', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #ff3838 0%, #ff1744 100%)',
            color: '#ffffff', border: '2px solid #ff3838',
            shadow: '0 4px 8px rgba(255, 56, 56, 0.5)',
        },
    },
    dark: {
        debug: {
            emoji: '🌙', label: 'DEBUG',
            background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            color: '#e2e8f0', border: '1px solid #4a5568',
            shadow: '0 2px 4px rgba(45, 55, 72, 0.8)',
        },
        info: {
            emoji: '💡', label: 'INFO',
            background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
            color: '#90cdf4', border: '1px solid #3182ce',
            shadow: '0 2px 4px rgba(26, 32, 44, 0.8)',
        },
        warn: {
            emoji: '⚡', label: 'WARN',
            background: 'linear-gradient(135deg, #744210 0%, #975a16 100%)',
            color: '#faf089', border: '1px solid #d69e2e',
            shadow: '0 2px 4px rgba(116, 66, 16, 0.8)',
        },
        error: {
            emoji: '💀', label: 'ERROR',
            background: 'linear-gradient(135deg, #742a2a 0%, #9b2c2c 100%)',
            color: '#feb2b2', border: '1px solid #e53e3e',
            shadow: '0 2px 4px rgba(116, 42, 42, 0.8)',
        },
        success: {
            emoji: '🎯', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #276749 0%, #2f855a 100%)',
            color: '#9ae6b4', border: '1px solid #38a169',
            shadow: '0 2px 4px rgba(39, 103, 73, 0.8)',
        },
        critical: {
            emoji: '💥', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #ff0000 100%)',
            color: '#ffffff', border: '2px solid #ff0000',
            shadow: '0 4px 8px rgba(255, 0, 0, 0.9)',
        },
    },
    neon: {
        debug: {
            emoji: '⚡', label: 'DEBUG',
            background: 'linear-gradient(135deg, #0f3460 0%, #e94560 100%)',
            color: '#00ffff', border: '1px solid #00ffff',
            shadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        },
        info: {
            emoji: '🔮', label: 'INFO',
            background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
            color: '#00ff41', border: '1px solid #00ff41',
            shadow: '0 0 10px rgba(0, 255, 65, 0.5)',
        },
        warn: {
            emoji: '⚠️', label: 'WARN',
            background: 'linear-gradient(135deg, #533a03 0%, #e94560 100%)',
            color: '#ffff00', border: '1px solid #ffff00',
            shadow: '0 0 10px rgba(255, 255, 0, 0.5)',
        },
        error: {
            emoji: '💥', label: 'ERROR',
            background: 'linear-gradient(135deg, #5c0a0a 0%, #ff073a 100%)',
            color: '#ff073a', border: '1px solid #ff073a',
            shadow: '0 0 10px rgba(255, 7, 58, 0.8)',
        },
        success: {
            emoji: '✨', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #0a5c0a 0%, #39ff14 100%)',
            color: '#39ff14', border: '1px solid #39ff14',
            shadow: '0 0 10px rgba(57, 255, 20, 0.8)',
        },
        critical: {
            emoji: '🌟', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #000000 0%, #ff0080 100%)',
            color: '#ff0080', border: '2px solid #ff0080',
            shadow: '0 0 20px rgba(255, 0, 128, 1)',
        },
    },
    minimal: {
        debug: {
            emoji: '', label: 'DEBUG',
            background: '#f7fafc', color: '#4a5568',
            border: '1px solid #e2e8f0', shadow: 'none',
        },
        info: {
            emoji: '', label: 'INFO',
            background: '#ebf8ff', color: '#2b6cb0',
            border: '1px solid #bee3f8', shadow: 'none',
        },
        warn: {
            emoji: '', label: 'WARN',
            background: '#fffbf0', color: '#c05621',
            border: '1px solid #fed7aa', shadow: 'none',
        },
        error: {
            emoji: '', label: 'ERROR',
            background: '#fef5f5', color: '#c53030',
            border: '1px solid #fca5a5', shadow: 'none',
        },
        success: {
            emoji: '', label: 'SUCCESS',
            background: '#f0fff4', color: '#2f855a',
            border: '1px solid #9ae6b4', shadow: 'none',
        },
        critical: {
            emoji: '', label: 'CRITICAL',
            background: '#fef5f5', color: '#e53e3e',
            border: '2px solid #f56565', shadow: 'none',
        },
    },
    // Additional theme variants can be added here
    light: {
        debug: {
            emoji: '🔍', label: 'DEBUG',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            color: '#1565c0', border: '1px solid #90caf9',
            shadow: '0 1px 3px rgba(33, 150, 243, 0.2)',
        },
        info: {
            emoji: 'ℹ️', label: 'INFO',
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            color: '#7b1fa2', border: '1px solid #ce93d8',
            shadow: '0 1px 3px rgba(156, 39, 176, 0.2)',
        },
        warn: {
            emoji: '⚠️', label: 'WARN',
            background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
            color: '#f57c00', border: '1px solid #ffcc02',
            shadow: '0 1px 3px rgba(255, 152, 0, 0.2)',
        },
        error: {
            emoji: '❌', label: 'ERROR',
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: '#d32f2f', border: '1px solid #f44336',
            shadow: '0 1px 3px rgba(244, 67, 54, 0.2)',
        },
        success: {
            emoji: '✅', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            color: '#388e3c', border: '1px solid #4caf50',
            shadow: '0 1px 3px rgba(76, 175, 80, 0.2)',
        },
        critical: {
            emoji: '🚨', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
            color: '#c2185b', border: '2px solid #e91e63',
            shadow: '0 2px 6px rgba(233, 30, 99, 0.3)',
        },
    },
    cyberpunk: {
        debug: {
            emoji: '🤖', label: 'DEBUG',
            background: 'linear-gradient(135deg, #0d1b2a 0%, #415a77 100%)',
            color: '#00d4aa', border: '1px solid #00d4aa',
            shadow: '0 0 15px rgba(0, 212, 170, 0.4)',
        },
        info: {
            emoji: '🔗', label: 'INFO',
            background: 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)',
            color: '#00b4d8', border: '1px solid #00b4d8',
            shadow: '0 0 15px rgba(0, 180, 216, 0.4)',
        },
        warn: {
            emoji: '⚡', label: 'WARN',
            background: 'linear-gradient(135deg, #f72585 0%, #b5179e 100%)',
            color: '#ffff3f', border: '1px solid #ffff3f',
            shadow: '0 0 15px rgba(255, 255, 63, 0.4)',
        },
        error: {
            emoji: '💀', label: 'ERROR',
            background: 'linear-gradient(135deg, #7209b7 0%, #480ca8 100%)',
            color: '#ff006e', border: '1px solid #ff006e',
            shadow: '0 0 15px rgba(255, 0, 110, 0.6)',
        },
        success: {
            emoji: '⚡', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #003566 0%, #001d3d 100%)',
            color: '#00f5ff', border: '1px solid #00f5ff',
            shadow: '0 0 15px rgba(0, 245, 255, 0.4)',
        },
        critical: {
            emoji: '💥', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #000000 0%, #ff0040 100%)',
            color: '#ff0040', border: '2px solid #ff0040',
            shadow: '0 0 25px rgba(255, 0, 64, 0.8)',
        },
    },
};