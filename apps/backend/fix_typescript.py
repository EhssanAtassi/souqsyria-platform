#!/usr/bin/env python3

"""
Script to automatically fix common TypeScript compilation errors in NestJS backend
- TS2564: Property has no initializer
- TS18046/TS18048: Error is of type 'unknown' or possibly undefined
- TS6133: Unused imports/variables
"""

import os
import re
from pathlib import Path

SRC_DIR = Path("src")

def get_all_ts_files():
    """Recursively get all TypeScript files"""
    files = []
    for root, dirs, filenames in os.walk(SRC_DIR):
        # Skip node_modules and dist
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist']]
        for filename in filenames:
            if filename.endswith('.ts'):
                files.append(Path(root) / filename)
    return files

def fix_property_initializers(content):
    """Fix TS2564: Add definite assignment assertion (!) to class properties"""
    lines = content.split('\n')
    fixed = []

    for i, line in enumerate(lines):
        # Match property declarations like: "  propertyName: Type;"
        # Don't match if it already has !, ?, or =
        match = re.match(r'^(\s+)([a-zA-Z_$][\w$]*)(\s*):(.*);(\s*)(//.*)?$', line)

        if match and '!' not in line and '?' not in line and '=' not in line:
            indent, prop_name, space1, type_part, space2, comment = match.groups()
            comment = comment or ''
            space2 = space2 or ''
            # Check if this looks like a class property (has proper indentation and is not a parameter)
            if len(indent) >= 2 and ':' in line and ';' in line:
                # Add the ! assertion
                fixed_line = f"{indent}{prop_name}!:{type_part};{space2}{comment}"
                fixed.append(fixed_line)
                continue

        fixed.append(line)

    return '\n'.join(fixed)

def fix_catch_blocks(content):
    """Fix TS18046: Type catch blocks properly"""
    # Fix catch block declarations
    content = re.sub(
        r'catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*{',
        r'catch (\1: unknown) {',
        content
    )

    # Fix error.stack references
    content = re.sub(
        r'\b([a-zA-Z_$][\w$]*)\.(stack|message)\b',
        lambda m: f'({m.group(1)} as Error).{m.group(2)}'
                  if 'catch' in content else m.group(0),
        content
    )

    return content

def fix_possibly_undefined(content):
    """Fix TS18048: Possibly undefined"""
    # Fix result.affected comparisons
    content = re.sub(
        r'(\w+)\.affected\s*([><=!]+)',
        r'(\1.affected ?? 0) \2',
        content
    )

    return content

def fix_null_assignments(content):
    """Fix TS2322: Type 'X | null' is not assignable to type 'X'"""
    # This is complex and context-dependent, but we can add some basic fixes
    # Add non-null assertion where appropriate
    lines = content.split('\n')
    fixed = []

    for line in lines:
        # If assigning result of findOne to a non-nullable property
        if 'findOne' in line and '=' in line and 'await' in line:
            # Add ! to assert non-null
            line = re.sub(r'(await\s+this\.\w+\.findOne\([^)]+\))', r'\1!', line)
        fixed.append(line)

    return '\n'.join(fixed)

def remove_unused_imports(content, filepath):
    """Remove unused imports (TS6133)"""
    lines = content.split('\n')
    fixed = []
    removed = []

    for line in lines:
        # Check if it's an import statement
        import_match = re.match(r"^import\s*{([^}]+)}\s*from\s*['\"](.+)['\"];?", line)

        if import_match:
            imports_str = import_match.group(1)
            from_path = import_match.group(2)
            imports = [imp.strip() for imp in imports_str.split(',')]

            # Check which imports are actually used
            used_imports = []
            for imp in imports:
                # Handle "X as Y" syntax
                import_name = imp.split(' as ')[-1].strip()

                # Check if used in the file (excluding the import line itself)
                rest_of_file = '\n'.join([l for l in lines if l != line])
                if re.search(r'\b' + re.escape(import_name) + r'\b', rest_of_file):
                    used_imports.append(imp)
                else:
                    removed.append(import_name)

            if used_imports:
                # Reconstruct import with only used imports
                fixed.append(f"import {{ {', '.join(used_imports)} }} from '{from_path}';")
            else:
                # Comment out entirely unused import
                fixed.append(f"// {line}")
        else:
            fixed.append(line)

    if removed:
        print(f"  Removed unused imports in {filepath.name}: {', '.join(removed)}")

    return '\n'.join(fixed)

def prefix_unused_variables(content):
    """Prefix unused variables with _ (TS6133)"""
    # This is for function parameters that are declared but never used
    # Pattern: (variableName: Type) but variableName is never used
    # We'll prefix with _

    # Find function/method declarations with unused parameters
    # This is complex, so we'll do a simple fix for common patterns

    lines = content.split('\n')
    fixed = []

    for line in lines:
        # Look for function parameters that might be unused (like in catch blocks)
        # Example: } catch (error) { - if error is never used
        if 'catch' in line and '(' in line:
            # If the catch body doesn't use the error variable
            # This is a simple heuristic
            match = re.search(r'catch\s*\(([a-zA-Z_$][\w$]*):?\s*\w*\)', line)
            if match:
                var_name = match.group(1)
                # Check if it's not already prefixed with _
                if not var_name.startswith('_'):
                    # Replace with _varName
                    line = re.sub(
                        r'catch\s*\(' + re.escape(var_name) + r'(:?\s*\w*)\)',
                        r'catch (_' + var_name + r'\1)',
                        line
                    )

        fixed.append(line)

    return '\n'.join(fixed)

def process_file(filepath):
    """Process a single TypeScript file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Apply fixes
        content = fix_property_initializers(content)
        content = fix_catch_blocks(content)
        content = fix_possibly_undefined(content)
        content = fix_null_assignments(content)
        content = remove_unused_imports(content, filepath)

        # Only write if changed
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Fixed: {filepath}")
            return True

        return False

    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")
        return False

def main():
    print("Starting TypeScript error fixes...\n")

    files = get_all_ts_files()
    print(f"Found {len(files)} TypeScript files\n")

    fixed_count = 0
    for filepath in files:
        if process_file(filepath):
            fixed_count += 1

    print(f"\n✓ Fixed {fixed_count} files")
    print('\nRun "npm run build" to verify the fixes')

if __name__ == '__main__':
    main()
