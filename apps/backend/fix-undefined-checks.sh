#!/bin/bash

# Fix TS18048: Possibly undefined errors
# Specifically for result.affected

echo "Fixing possibly undefined checks..."

# Fix result.affected comparisons
find src -name "*.ts" -type f -exec perl -pi -e '
  # Fix result.affected > 0
  s/return\s+(\w+)\.affected\s*>\s*0/return ($1.affected ?? 0) > 0/g unless /\?\?/;
  s/(\w+)\.affected\s*>\s*0/($1.affected ?? 0) > 0/g unless /\?\?/;

  # Fix result.affected === 1
  s/(\w+)\.affected\s*===\s*(\d+)/($1.affected ?? 0) === $2/g unless /\?\?/;

  # Fix result.affected !== 0
  s/(\w+)\.affected\s*!==\s*(\d+)/($1.affected ?? 0) !== $2/g unless /\?\?/;
' {} \;

echo "Undefined checks fixed!"
