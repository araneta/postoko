#!/usr/bin/env node

/**
 * Test script to verify React Native release build fixes
 * This script checks for common issues that cause white screens in release builds
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing React Native release build fixes...\n');

// Check for window object usage
function checkWindowObjectUsage() {
  console.log('📱 Checking for window object usage...');
  
  const filesToCheck = [
    'lib/api.ts',
    'app/_layout.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/_layout.tsx'
  ];

  let issuesFound = 0;

  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for unsafe window usage (without platform checks)
      const lines = content.split('\n');
      let unsafeUsage = [];
      
      lines.forEach((line, index) => {
        // Skip lines that have proper platform checks
        if (line.includes('typeof window') || line.includes('__DEV__')) {
          return;
        }
        
        // Look for direct window usage (but allow it if it's inside a platform check block)
        const directWindowUsage = line.match(/window\.(alert|location|frameworkReady\?)/);
        if (directWindowUsage && !line.trim().startsWith('//')) {
          // Check if this line is within a platform check block
          const previousLines = lines.slice(0, index);
          const hasPlatformCheck = previousLines.some(prevLine => 
            prevLine.includes('typeof window') && 
            prevLine.includes('!==') && 
            prevLine.includes('undefined')
          );
          
          if (!hasPlatformCheck) {
            unsafeUsage.push(`Line ${index + 1}: ${directWindowUsage[0]}`);
          }
        }
      });
      
      if (unsafeUsage.length > 0) {
        console.log(`❌ ${file}: Found unsafe window usage:`);
        unsafeUsage.forEach(usage => console.log(`   ${usage}`));
        issuesFound++;
      } else {
        console.log(`✅ ${file}: No unsafe window usage found`);
      }
    } else {
      console.log(`⚠️  ${file}: File not found`);
    }
  });

  return issuesFound === 0;
}

// Check for error boundary
function checkErrorBoundary() {
  console.log('\n🛡️  Checking for Error Boundary...');
  
  const errorBoundaryPath = path.join(__dirname, 'components/ErrorBoundary.tsx');
  
  if (fs.existsSync(errorBoundaryPath)) {
    console.log('✅ ErrorBoundary component found');
    return true;
  } else {
    console.log('❌ ErrorBoundary component not found');
    return false;
  }
}

// Check for debug logger
function checkDebugLogger() {
  console.log('\n📝 Checking for Debug Logger...');
  
  const debugLoggerPath = path.join(__dirname, 'utils/debugLogger.ts');
  
  if (fs.existsSync(debugLoggerPath)) {
    console.log('✅ DebugLogger utility found');
    return true;
  } else {
    console.log('❌ DebugLogger utility not found');
    return false;
  }
}

// Check for console.log replacements
function checkConsoleLogReplacements() {
  console.log('\n🔄 Checking for console.log replacements...');
  
  const filesToCheck = [
    'app/(tabs)/index.tsx',
    'app/_layout.tsx'
  ];

  let issuesFound = 0;

  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for remaining console.log statements (excluding debug logger file)
      const consoleLogs = content.match(/console\.(log|error|warn|info|debug)\(/g);
      
      if (consoleLogs && consoleLogs.length > 0) {
        console.log(`⚠️  ${file}: Found ${consoleLogs.length} console statements (may need debugLogger)`);
        issuesFound++;
      } else {
        console.log(`✅ ${file}: No console statements found`);
      }
    }
  });

  return issuesFound === 0;
}

// Check for platform-specific code
function checkPlatformSpecificCode() {
  console.log('\n📱 Checking for platform-specific code...');
  
  const apiPath = path.join(__dirname, 'lib/api.ts');
  
  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, 'utf8');
    
    if (content.includes('typeof window') && content.includes('__DEV__')) {
      console.log('✅ Platform-specific code found in api.ts');
      return true;
    } else {
      console.log('❌ Platform-specific code not properly implemented in api.ts');
      return false;
    }
  } else {
    console.log('❌ api.ts not found');
    return false;
  }
}

// Run all checks
function runAllChecks() {
  const results = {
    windowObject: checkWindowObjectUsage(),
    errorBoundary: checkErrorBoundary(),
    debugLogger: checkDebugLogger(),
    consoleLogs: checkConsoleLogReplacements(),
    platformCode: checkPlatformSpecificCode()
  };

  console.log('\n📊 Summary:');
  console.log('================');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('🎉 All checks passed! Your app should work in release builds.');
    console.log('\n📋 Next steps:');
    console.log('1. Build your release APK: npx expo run:android --variant release');
    console.log('2. Install and test on your device');
    console.log('3. If issues persist, use the Debug Logs button in the app');
    console.log('4. Check logs in the DebugScreen component');
  } else {
    console.log('❌ Some checks failed. Please review the issues above.');
    console.log('\n🔧 Common fixes:');
    console.log('- Replace window.* usage with platform-specific code');
    console.log('- Add ErrorBoundary to catch runtime errors');
    console.log('- Use debugLogger instead of console.log in production');
    console.log('- Test in development before building release');
  }

  return allPassed;
}

// Run the tests
runAllChecks();
