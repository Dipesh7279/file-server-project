@echo off
REM FileServer - Testing Setup Script (Windows)
REM This script sets up everything needed for testing

echo.
echo ==============================================
echo  FileServer Testing Environment Setup
echo ==============================================
echo.

REM 1. Backend Testing Setup
echo [1/4] Setting up Backend Testing...

cd server

REM Check and install Jest
where jest >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Installing Jest and testing dependencies...
  call npm install --save-dev ^
    jest ^
    supertest ^
    @testing-library/node ^
    jest-mock-extended
)

REM Create jest config
if not exist jest.config.js (
  echo Creating jest.config.js...
  (
    echo module.exports = {
    echo   testEnvironment: 'node',
    echo   testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)^+(spec^|test^).js'],
    echo   coveragePathIgnorePatterns: ['/node_modules/'],
    echo   collectCoverageFrom: [
    echo     'controllers/**/*.js',
    echo     'models/**/*.js',
    echo     'middleware/**/*.js',
    echo     'routes/**/*.js',
    echo   ],
    echo   coverageThreshold: {
    echo     global: {
    echo       branches: 60,
    echo       functions: 60,
    echo       lines: 60,
    echo       statements: 60,
    echo     },
    echo   },
    echo   testTimeout: 10000,
    echo };
  ) > jest.config.js
  echo ✓ jest.config.js created
)

REM Create __tests__ directory
if not exist __tests__ mkdir __tests__

REM Add test scripts
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"test\":' -Quiet) -eq $false) { npm set-script test 'jest --runInBand' }"
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"test:watch\":' -Quiet) -eq $false) { npm set-script test:watch 'jest --watch --runInBand' }"
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"test:coverage\":' -Quiet) -eq $false) { npm set-script test:coverage 'jest --coverage --runInBand' }"

cd ..

REM 2. Frontend Testing Setup
echo [2/4] Setting up Frontend Testing...

cd client

REM Install testing library
where @testing-library/react >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Installing React Testing Library...
  call npm install --save-dev ^
    @testing-library/react ^
    @testing-library/jest-dom ^
    @testing-library/user-event
)

REM Create test directory
if not exist renderer\components\__tests__ mkdir renderer\components\__tests__

REM Add test scripts
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"test\":' -Quiet) -eq $false) { npm set-script test 'react-scripts test --passWithNoTests' }"
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"test:coverage\":' -Quiet) -eq $false) { npm set-script test:coverage 'react-scripts test --coverage --passWithNoTests' }"

cd ..

REM 3. E2E Testing Setup
echo [3/4] Setting up E2E Testing...

cd client

REM Check and install Cypress
where cypress >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Installing Cypress...
  call npm install --save-dev cypress
)

REM Create cypress directories
if not exist cypress\integration mkdir cypress\integration
if not exist cypress\fixtures mkdir cypress\fixtures
if not exist cypress\support mkdir cypress\support

REM Add cypress scripts
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"cypress\"' -Quiet) -eq $false) { npm set-script cypress:open 'cypress open' }"
powershell -Command "if((Select-String -Path 'package.json' -Pattern '\"cypress:run\"' -Quiet) -eq $false) { npm set-script cypress:run 'cypress run' }"

cd ..

REM 4. Create .env.test files
echo [4/4] Creating Test Environment Variables...

(
  echo PORT=5001
  echo MONGODB_URI=mongodb://localhost:27017/fileserver-test
  echo JWT_SECRET=test_secret_key_change_in_production
  echo NODE_ENV=test
  echo ADMIN_EMAIL=admin@test.com
  echo ADMIN_PASSWORD=AdminPassword123!
) > server\.env.test

(
  echo REACT_APP_API_URL=http://localhost:5001/api
) > client\.env.test

echo.
echo ==============================================
echo  ✓ Setup Complete!
echo ==============================================
echo.
echo Next Steps:
echo.
echo 1. Backend Unit Tests:
echo    cd server ^&^& npm test
echo.
echo 2. Backend with Coverage:
echo    cd server ^&^& npm run test:coverage
echo.
echo 3. Frontend Tests:
echo    cd client ^&^& npm test
echo.
echo 4. E2E Tests:
echo    npm start ^(in one terminal^)
echo    npm run cypress:open ^(in another^)
echo.
echo 5. Read Testing Guide:
echo    type TESTING_GUIDE.md
echo.
echo ==============================================
echo.
pause
