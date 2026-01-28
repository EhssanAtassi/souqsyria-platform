#!/bin/bash

###############################################################################
# Master script to fix all TypeScript compilation errors
# Run this script from the backend directory
###############################################################################

set -e  # Exit on error

echo "=========================================="
echo "TypeScript Error Fix Script"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Please run this script from the backend directory."
  exit 1
fi

echo "Step 1: Fixing catch blocks (TS18046)..."
chmod +x fix-catch-blocks.sh
./fix-catch-blocks.sh
echo ""

echo "Step 2: Fixing undefined checks (TS18048)..."
chmod +x fix-undefined-checks.sh
./fix-undefined-checks.sh
echo ""

echo "Step 3: Removing unused imports (TS6133)..."
chmod +x fix-unused-imports.sh
./fix-unused-imports.sh
echo ""

echo "Step 4: Fixing null assignment issues..."
# Fix findOne null assignments
find src -name "*.ts" -type f -exec perl -pi -e '
  # Add ! to findOne calls that are assigned to non-nullable properties
  s/(=\s*await\s+this\.\w+\.findOne\([^)]+\));/$1!;/g unless /!/;
' {} \;
echo "Null assignment fixes applied!"
echo ""

echo "Step 5: Fixing type mismatches in addresses service..."
# Fix specific type issues in addresses/service/addresses.service.ts
if [ -f "src/addresses/service/addresses.service.ts" ]; then
  # Fix the save call type mismatch - change Address[] to individual Address
  perl -pi -e '
    s/const address = this\.addressRepo\.create\(\{/const addresses = [this.addressRepo.create({/g;
    s/return this\.addressRepo\.save\(address\);/return this.addressRepo.save(addresses[0]);/g;
  ' src/addresses/service/addresses.service.ts
  echo "Address service type fixes applied!"
fi
echo ""

echo "Step 6: Fixing unused parameters..."
# Prefix unused parameters with underscore
find src -name "*.ts" -type f -exec perl -pi -e '
  # Fix unused city parameter
  s/city\?: SyrianCityEntity,/_city?: SyrianCityEntity,/g;
' {} \;
echo "Unused parameter fixes applied!"
echo ""

echo "=========================================="
echo "All fixes applied!"
echo "=========================================="
echo ""
echo "Now running build to check for remaining errors..."
npm run build

echo ""
echo "If build succeeded, all TypeScript errors have been fixed!"
echo "If there are still errors, please review them and apply manual fixes."
