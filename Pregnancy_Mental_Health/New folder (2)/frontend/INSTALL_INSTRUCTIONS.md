# Angular Login Page - Installation Instructions

## npm Issue Detected

Your npm installation appears to be corrupted (missing `@npmcli/config` module). Here are steps to fix it:

### Option 1: Reinstall npm (Recommended)

1. **Reinstall Node.js with npm:**
   ```powershell
   nvm uninstall 20.19.0
   nvm install 20.19.0
   nvm use 20.19.0
   ```

2. **Or download Node.js directly from nodejs.org** (includes npm)

### Option 2: Manual npm Fix

1. Navigate to npm directory:
   ```powershell
   cd C:\Users\Rindhiyaasathish\AppData\Roaming\nvm\v20.19.0\node_modules\npm
   ```

2. Install missing dependencies:
   ```powershell
   node bin\npm-cli.js install @npmcli/config --save
   ```

### Option 3: Use Yarn (Alternative)

If you have yarn installed:
```powershell
yarn install
yarn start
```

## After Fixing npm

Once npm is working:

1. **Install Angular dependencies:**
   ```powershell
   cd frontend
   npm install
   ```

2. **Run the Angular dev server:**
   ```powershell
   npm start
   ```
   Or:
   ```powershell
   ng serve
   ```

3. **Open your browser:**
   Navigate to `http://localhost:4200`

The login page should be displayed with:
- Beautiful two-column layout
- Pastel color theme
- Form validation
- Responsive design

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Angular app module
│   ├── auth/
│   │   └── login/        # Login component (HTML, SCSS, TS, Module)
│   ├── assets/           # Static assets
│   ├── index.html        # Entry HTML
│   ├── main.ts           # Bootstrap file
│   └── styles.scss       # Global styles
├── angular.json          # Angular CLI config
└── package.json          # Dependencies
```

## Troubleshooting

- **Port 4200 already in use?** Use `ng serve --port 4201`
- **Build errors?** Check TypeScript version compatibility
- **Module not found?** Run `npm install` again


