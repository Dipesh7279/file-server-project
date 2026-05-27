#!/bin/bash

# FileServer - Testing Setup Script
# This script sets up everything needed for testing

echo "🧪 Setting up FileServer Testing Environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Backend Testing Setup
echo -e "${BLUE}1. Setting up Backend Testing...${NC}"
cd server

# Check if jest is installed
if ! npm list jest > /dev/null 2>&1; then
  echo "Installing Jest and testing dependencies..."
  npm install --save-dev \
    jest \
    supertest \
    @testing-library/node \
    jest-mock-extended
fi

# Create jest config if not exists
if [ ! -f jest.config.js ]; then
  echo "Creating jest.config.js..."
  cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 10000,
};
EOF
  echo "✓ jest.config.js created"
fi

# Create __tests__ directory
mkdir -p __tests__

# Add test script to package.json if not exists
if ! grep -q '"test":' package.json; then
  echo "Adding test scripts to package.json..."
  npm set-script test "jest --runInBand"
  npm set-script test:watch "jest --watch --runInBand"
  npm set-script test:coverage "jest --coverage --runInBand"
fi

cd ..

# 2. Frontend Testing Setup
echo -e "${BLUE}2. Setting up Frontend Testing...${NC}"
cd client

# Check if testing library is installed
if ! npm list @testing-library/react > /dev/null 2>&1; then
  echo "Installing React Testing Library..."
  npm install --save-dev \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event
fi

# Create test directory
mkdir -p renderer/components/__tests__

# Add test script
if ! grep -q '"test":' package.json; then
  npm set-script test "react-scripts test --passWithNoTests"
  npm set-script test:coverage "react-scripts test --coverage --passWithNoTests"
fi

cd ..

# 3. E2E Testing Setup
echo -e "${BLUE}3. Setting up E2E Testing...${NC}"
cd client

# Check if cypress is installed
if ! npm list cypress > /dev/null 2>&1; then
  echo "Installing Cypress..."
  npm install --save-dev cypress
  
  # Initialize cypress
  npx cypress open --headless 2>/dev/null || true
fi

# Create cypress directory structure
mkdir -p cypress/integration
mkdir -p cypress/fixtures
mkdir -p cypress/support

# Add cypress scripts
if ! grep -q '"cypress":' package.json; then
  npm set-script cypress:open "cypress open"
  npm set-script cypress:run "cypress run"
fi

cd ..

# 4. Create .env.test files
echo -e "${BLUE}4. Creating Test Environment Variables...${NC}"

cat > server/.env.test << 'EOF'
PORT=5001
MONGODB_URI=mongodb://localhost:27017/fileserver-test
JWT_SECRET=test_secret_key_change_in_production
NODE_ENV=test
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=AdminPassword123!
EOF

cat > client/.env.test << 'EOF'
REACT_APP_API_URL=http://localhost:5001/api
EOF

# 5. Display summary
echo ""
echo -e "${GREEN}✓ Testing Environment Setup Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "  1. Backend Unit Tests:"
echo "     cd server && npm test"
echo ""
echo "  2. Backend with Coverage:"
echo "     cd server && npm run test:coverage"
echo ""
echo "  3. Frontend Tests:"
echo "     cd client && npm test"
echo ""
echo "  4. E2E Tests:"
echo "     npm start (in one terminal)"
echo "     npm run cypress:open (in another)"
echo ""
echo "  5. Read Testing Guide:"
echo "     cat TESTING_GUIDE.md"
echo ""
echo "🎯 Testing Guide available at: TESTING_GUIDE.md"
echo ""
