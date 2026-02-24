# React Native Release Build Fixes

## Problem
Your React Native app was showing a white screen in release builds, which is a common issue when JavaScript errors occur that aren't visible in production.

## Root Causes Found & Fixed

### 1. ❌ Window Object Usage (CRITICAL)
**Problem**: Direct usage of `window.alert` and `window.location.href` in `lib/api.ts`
**Impact**: These don't exist in React Native and cause immediate crashes
**Fix**: Added platform-specific checks:
```typescript
if (typeof window !== 'undefined') {
  // Web platform
  window.alert("Session expired. Please sign in again.");
  window.location.href = "/sign-in";
} else {
  // React Native platform
  console.warn("Session expired. Please sign in again.");
}
```

### 2. ❌ Missing Error Handling
**Problem**: No error boundaries to catch runtime errors
**Impact**: Unhandled errors cause white screens
**Fix**: Added `ErrorBoundary` component wrapped around the app

### 3. ❌ No Debugging in Production
**Problem**: `console.log` statements are stripped in release builds
**Impact**: No way to debug issues when they occur
**Fix**: Created `debugLogger` utility that persists logs to AsyncStorage

## Files Modified

### New Files Created:
- `components/ErrorBoundary.tsx` - Catches and displays errors gracefully
- `utils/debugLogger.ts` - Persistent logging for production debugging
- `components/DebugScreen.tsx` - UI to view logs in the app
- `test-release-build.js` - Automated testing script

### Files Modified:
- `lib/api.ts` - Fixed window object usage
- `app/_layout.tsx` - Added error boundary and debug logging
- `app/(tabs)/index.tsx` - Replaced console.log with debugLogger, added debug button

## Features Added

### 🔍 Debug Logging System
- Persists logs to AsyncStorage (last 100 entries)
- Works in both development and production
- Includes timestamps, log levels, and data
- Can export logs for sharing

### 🛡️ Error Boundary
- Catches all React errors
- Shows user-friendly error messages
- Displays detailed info in development
- Provides error IDs for support

### 🐛 In-App Debug Screen
- Accessible via "Debug Logs" button (production only)
- View all recent logs
- Share logs for support
- Clear logs when needed

## Testing Instructions

### 1. Build Release APK
```bash
npx expo run:android --variant release
```

### 2. Install & Test
- Install the APK on your Android device
- Launch the app
- If you see a white screen:
  - Look for the "Debug Logs" button (appears in production)
  - Tap it to view recent logs
  - Share logs for analysis

### 3. Verify Fixes
- App should load without white screen
- All functionality should work normally
- Debug logs should capture any issues

## Debugging White Screen Issues

If you still encounter white screen issues:

1. **Check Debug Logs**
   - Open the app
   - Look for "Debug Logs" button near employee info
   - Review recent logs for errors

2. **Common Issues to Look For**
   - Network connectivity problems
   - API endpoint failures
   - Authentication issues
   - Missing data initialization

3. **Share Logs for Support**
   - Use the share button in DebugScreen
   - Send logs to your development team

## Prevention Tips

1. **Always Test in Release Mode**
   - Don't assume debug mode behavior matches release
   - Test critical user flows

2. **Use Platform-Specific Code**
   - Always check `typeof window` before using browser APIs
   - Use `Platform.OS` for platform-specific logic

3. **Implement Error Boundaries**
   - Wrap major components with error boundaries
   - Provide fallback UI for critical errors

4. **Use Persistent Logging**
   - Log important events and errors
   - Include context data for debugging

## Automated Testing

Run the test script to verify all fixes:
```bash
node test-release-build.js
```

This will check for:
- Unsafe window object usage
- Missing error boundaries
- Console.log statements
- Platform-specific code implementation

## Success Criteria

✅ All checks pass in test script
✅ App launches without white screen in release
✅ Debug logs are accessible and functional
✅ Error boundaries catch and display errors
✅ Platform-specific code works correctly

---

**Your app should now work properly in release builds!** 🎉
