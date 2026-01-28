#!/bin/bash

# Fix specific unused imports based on the build errors

echo "Removing unused imports..."

# Remove unused 'User' import from access-control.module.ts
sed -i '' "/import { User } from '..\/users\/entities\/user.entity';/d" \
  src/access-control/access-control.module.ts

# Remove unused imports from various files
sed -i '' "/import { AddressType,/,/} from/d" \
  src/addresses/service/syrian-address.service.ts

sed -i '' "/  BadRequestException,/d" \
  src/admin-dashboard/controllers/admin-analytics-enhanced.controller.ts

sed -i '' "/  ExportFormat,/d" \
  src/admin-dashboard/controllers/admin-analytics.controller.ts

sed -i '' "/  ReportType,/d" \
  src/admin-dashboard/controllers/admin-analytics.controller.ts

echo "Unused imports removed!"
