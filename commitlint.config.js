/**
 * Commitlint Configuration
 * Enforces conventional commit message format
 *
 * Format: type(scope): subject
 *
 * Examples:
 * - feat(auth): add OAuth2 login
 * - fix(cart): resolve checkout calculation bug
 * - docs(readme): update installation steps
 * - chore(deps): upgrade Angular to v18
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'docs',      // Documentation changes
        'style',     // Code style changes (formatting, etc.)
        'refactor',  // Code refactoring
        'perf',      // Performance improvements
        'test',      // Test updates
        'build',     // Build system changes
        'ci',        // CI configuration changes
        'chore',     // Other changes (dependencies, etc.)
        'revert',    // Revert previous commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};
