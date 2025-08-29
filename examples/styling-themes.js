/**
 * Styling and Themes Example
 * 
 * Demonstrates visual styling capabilities including:
 * - Theme switching and customization
 * - Custom style creation with StyleBuilder
 * - Banner display variations
 * - SVG background integration
 * - Pre-built style presets
 * 
 * Run: node examples/styling-themes.js
 * Note: Best viewed in browser console for full visual effects
 */

import { Logger } from '@mks2508/better-logger';
import { 
  setTheme, 
  showBanner, 
  createStyle, 
  stylePresets,
  logAnimated,
  logWithSVG 
} from '@mks2508/better-logger/styling';

console.log('🎨 Better Logger - Styling and Themes Example\n');

const logger = new Logger({ prefix: 'STYLE' });

// Theme demonstration
console.log('🌈 Testing different themes:');

const themes = ['default', 'dark', 'neon', 'cyberpunk', 'retro'];

for (const theme of themes) {
  setTheme(theme);
  logger.info(`Theme changed to: ${theme}`);
  
  // Show some logs in this theme
  logger.success(`${theme} theme is active!`);
  logger.warn(`Warning message in ${theme} theme`);
  logger.error(`Error message in ${theme} theme`);
  
  console.log(''); // Add spacing
}

// Banner demonstrations
console.log('\n🎭 Testing different banner types:');

const bannerTypes = ['simple', 'ascii', 'unicode', 'svg', 'animated'];

bannerTypes.forEach((type, index) => {
  setTimeout(() => {
    console.log(`\n--- ${type.toUpperCase()} BANNER ---`);
    showBanner(type);
    logger.info(`Showing ${type} banner style`);
  }, index * 1000);
});

// Wait for banners, then continue
setTimeout(() => {
  console.log('\n✨ Testing custom style creation:');

  // Create custom styles using StyleBuilder
  const headerStyle = createStyle()
    .bg('linear-gradient(135deg, #667eea, #764ba2)')
    .color('white')
    .padding('12px 24px')
    .rounded('8px')
    .bold()
    .shadow('0 4px 15px rgba(102, 126, 234, 0.3)')
    .build();

  const alertStyle = createStyle()
    .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
    .color('#333')
    .padding('10px 20px')
    .border('2px solid #ff5252')
    .rounded('25px')
    .bold()
    .animation('pulse 1s ease-in-out infinite')
    .build();

  const codeStyle = createStyle()
    .backgroundColor('#2c3e50')
    .color('#ecf0f1')
    .padding('8px 12px')
    .font('Monaco, Consolas, monospace')
    .border('1px solid #34495e')
    .rounded('4px')
    .build();

  console.log('%cCustom Header Style', headerStyle);
  console.log('%cCustom Alert Style', alertStyle);
  console.log('%cCustom Code Style', codeStyle);

  // Using pre-built style presets
  console.log('\n🎯 Testing style presets:');

  console.log('%c✅ Success Preset', stylePresets.success);
  console.log('%c❌ Error Preset', stylePresets.error);
  console.log('%c⚠️ Warning Preset', stylePresets.warning);
  console.log('%cℹ️ Info Preset', stylePresets.info);
  console.log('%c🎯 Accent Preset', stylePresets.accent);

  // Advanced styling combinations
  console.log('\n🔧 Advanced styling combinations:');

  const gradientButton = createStyle()
    .bg('linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c)')
    .color('white')
    .padding('15px 30px')
    .rounded('50px')
    .bold()
    .shadow('0 8px 25px rgba(102, 126, 234, 0.4)')
    .animation('backgroundMove 3s ease infinite')
    .css('background-size', '400% 400%')
    .build();

  console.log('%c🚀 Gradient Button Style', gradientButton);

  const glassMorphism = createStyle()
    .bg('rgba(255, 255, 255, 0.1)')
    .color('#333')
    .padding('20px')
    .rounded('15px')
    .border('1px solid rgba(255, 255, 255, 0.2)')
    .css('backdrop-filter', 'blur(10px)')
    .shadow('0 8px 32px rgba(0, 0, 0, 0.1)')
    .build();

  console.log('%c🪟 Glass Morphism Style', glassMorphism);

  // SVG background demonstration (works in browser)
  if (typeof document !== 'undefined') {
    console.log('\n🖼️ Testing SVG backgrounds:');

    const brandSVG = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'>
        <defs>
          <linearGradient id='brandGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' style='stop-color:#667eea'/>
            <stop offset='100%' style='stop-color:#764ba2'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#brandGrad)' rx='8'/>
        <text x='200' y='45' text-anchor='middle' fill='white' 
              font-family='Arial' font-size='18' font-weight='bold'>
          BETTER LOGGER
        </text>
      </svg>
    `;

    logWithSVG('Custom SVG Background!', brandSVG, {
      width: 400,
      height: 80,
      padding: '40px 200px'
    });

    // Animated logging (browser only)
    console.log('\n✨ Testing animated logging:');
    
    logAnimated('🌟 This message has animated gradients!', 3);
    
    setTimeout(() => {
      logAnimated('🎉 Animation completed!', 2);
    }, 3500);
  }

  // Style combinations for different contexts
  console.log('\n📱 Context-specific styling:');

  const mobileStyle = createStyle()
    .bg('#007AFF')
    .color('white')
    .padding('8px 16px')
    .rounded('18px')
    .fontSize('14px')
    .build();

  const desktopStyle = createStyle()
    .bg('linear-gradient(135deg, #74b9ff, #0984e3)')
    .color('white')
    .padding('12px 24px')
    .rounded('8px')
    .fontSize('16px')
    .shadow('0 4px 12px rgba(116, 185, 255, 0.3)')
    .build();

  const terminalStyle = createStyle()
    .backgroundColor('#1e1e1e')
    .color('#00ff00')
    .padding('6px 12px')
    .font('Fira Code, Monaco, monospace')
    .border('1px solid #333')
    .build();

  console.log('%c📱 Mobile Style', mobileStyle);
  console.log('%c🖥️ Desktop Style', desktopStyle);
  console.log('%c💻 Terminal Style', terminalStyle);

  console.log('\n✅ Styling and themes examples completed!');
  
  // Reset to default theme
  setTheme('default');
  logger.info('Theme reset to default');

}, 6000); // Wait for banner demonstrations