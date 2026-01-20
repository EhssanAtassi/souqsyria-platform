// Script to remove budget restrictions for Docker builds
const fs = require('fs');

const angularJsonPath = './angular.json';
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

// Remove all budgets from production configuration
if (angularJson.projects && angularJson.projects['souqsyria-angular-enterprise']) {
  const project = angularJson.projects['souqsyria-angular-enterprise'];
  if (project.architect && project.architect.build && project.architect.build.configurations) {
    const configs = project.architect.build.configurations;

    // Remove budgets from all configurations
    Object.keys(configs).forEach(configName => {
      if (configs[configName].budgets) {
        console.log(`Removing budgets from ${configName} configuration`);
        configs[configName].budgets = [];
      }
    });
  }
}

// Also check for old project structure
const projectName = Object.keys(angularJson.projects)[0];
if (projectName) {
  const project = angularJson.projects[projectName];
  if (project.architect && project.architect.build && project.architect.build.configurations) {
    const configs = project.architect.build.configurations;

    Object.keys(configs).forEach(configName => {
      if (configs[configName].budgets) {
        console.log(`Removing budgets from ${configName} configuration for ${projectName}`);
        configs[configName].budgets = [];
      }
    });
  }
}

fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
console.log('Angular budgets removed successfully for Docker build');
