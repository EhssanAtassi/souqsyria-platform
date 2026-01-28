#!/bin/bash

# Fix all catch blocks to properly type the error parameter
# This fixes TS18046: 'error' is of type 'unknown'

echo "Fixing catch blocks..."

# Find all TypeScript files and fix catch blocks
find src -name "*.ts" -type f -exec sed -i '' -E '
  # Fix catch (error) to catch (error: unknown)
  s/catch[[:space:]]*\([[:space:]]*error[[:space:]]*\)/catch (error: unknown)/g
  s/catch[[:space:]]*\([[:space:]]*err[[:space:]]*\)/catch (err: unknown)/g
  s/catch[[:space:]]*\([[:space:]]*e[[:space:]]*\)/catch (e: unknown)/g
' {} \;

echo "Done! Now fixing error.stack and error.message references..."

# Fix error property access
find src -name "*.ts" -type f -exec perl -pi -e '
  # Fix error.stack
  s/\berror\.stack\b/(error as Error).stack/g unless /\(error as Error\)/;
  s/\berr\.stack\b/(err as Error).stack/g unless /\(err as Error\)/;
  s/\be\.stack\b/(e as Error).stack/g unless /\(e as Error\)/;

  # Fix error.message
  s/\berror\.message\b/(error as Error).message/g unless /\(error as Error\)/;
  s/\berr\.message\b/(err as Error).message/g unless /\(err as Error\)/;
  s/\be\.message\b/(e as Error).message/g unless /\(e as Error\)/;
' {} \;

echo "Catch blocks fixed!"
