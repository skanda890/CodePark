# 📋e Database Migration Tool

CLI tool for managing database schema migrations with Prisma ORM. Supports version control, rollback, and migration status tracking.

## Features

- 🔝 **Version Control**: Track all migrations
- 🗑 **Rollback Support**: Revert to previous schema state
- 📊 **Status Tracking**: View migration history
- 🔐 **Prisma Integration**: Leverages Prisma for migrations
- 📋 **Changelog Generation**: Auto-generate migration docs
- ✅ **Validation**: Verify schema consistency
- 💬 **Team-Friendly**: Handles concurrent migrations

## Installation

```bash
cd database-migration-tool
npm install

# Make it globally available
npm link
```

## Usage

### Run Migrations

```bash
db-migrate up
```

Applies all pending migrations.

### Rollback Migration

```bash
db-migrate down
```

Rolls back the last applied migration.

### Check Status

```bash
db-migrate status

# Output:
# Pending migrations:
#   - 20251215_add_user_fields.sql
#   - 20251216_create_audit_table.sql
#
# Applied migrations:
#   - 20251210_init_schema.sql
#   - 20251212_add_indexes.sql
```

### Create Migration

```bash
db-migrate create add_user_profile

# Creates: migrations/20251215_add_user_profile.sql
```

## Migration File Format

### SQL Migration

```sql
-- migrations/20251215_add_user_fields.sql
-- up
ALTER TABLE users
ADD COLUMN profile_bio TEXT,
ADD COLUMN avatar_url VARCHAR(500);

-- down
ALTER TABLE users
DROP COLUMN profile_bio,
DROP COLUMN avatar_url;
```

### Prisma Schema

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  profile_bio   String?
  avatar_url    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## Commands Reference

### db-migrate up

Apply pending migrations.

```bash
db-migrate up --count 1      # Apply only 1 migration
db-migrate up --dry-run      # Preview changes
```

### db-migrate down

Rollback migrations.

```bash
db-migrate down --count 1    # Rollback 1 migration
db-migrate down --to 20251212_add_indexes  # Rollback to specific migration
```

### db-migrate status

Show migration status.

```bash
db-migrate status
db-migrate status --verbose  # Show SQL
```

### db-migrate validate

Validate migrations.

```bash
db-migrate validate          # Check all migrations
db-migrate validate --pending  # Check pending only
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/codepark
MIGRATION_PATH=./prisma/migrations
LOG_LEVEL=info
```

## Configuration

### migration.config.js

```javascript
module.exports = {
  migrationsDir: "./prisma/migrations",
  autoCreateDir: true,
  transactionPerFile: true,
  validateOnUp: true,
  strict: false,
};
```

## Examples

### Example 1: Create and Run Migration

```bash
# Create migration
db-migrate create add_project_table

# Edit migration file
vi prisma/migrations/20251215_add_project_table.sql

# Preview
db-migrate up --dry-run

# Apply
db-migrate up

# Verify
db-migrate status
```

### Example 2: Rollback to Specific Version

```bash
# See history
db-migrate status

# Rollback to version
db-migrate down --to 20251212_add_indexes

# Verify
db-migrate status
```

## Schema Versioning

```
v1.0.0 (20251210_init_schema)
  |
  +- v1.1.0 (20251212_add_indexes)
  |
  +- v1.2.0 (20251215_add_user_fields)
  |
  +- v1.2.1 (20251216_fix_constraints)
```

## Safety Features

### Dry Run Mode

```bash
db-migrate up --dry-run

# Output shows SQL without executing
```

### Backup Before Migration

```bash
# Automatic backup
db-migrate up --backup

# Creates: backups/backup_20251215_150000.sql
```

### Validation

```bash
# Validate migrations
db-migrate validate

# Checks for:
# - Syntax errors
# - Missing dependencies
# - Conflicting changes
```

## Migration Best Practices

1. **One Change Per Migration**: Single responsibility
2. **Reversible Migrations**: Always include rollback (DOWN)
3. **Idempotent**: Safe to run multiple times
4. **Test First**: Test in dev before prod
5. **Documentation**: Document complex migrations

### Good Migration

```sql
-- up
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- down
DROP TABLE IF EXISTS projects;
```

### Bad Migration

```sql
-- up
CREATE TABLE projects (...);
INSERT INTO projects VALUES (...);  -- Hardcoded data

-- down
DROP TABLE projects;  -- Irreversible data loss
```

## Troubleshooting

### Migration Fails

- Check DATABASE_URL is correct
- Verify database is running
- Review error message and logs
- Try with --dry-run first

### Can't Rollback

- Ensure DOWN statement is valid
- Check for data dependencies
- May need manual intervention

### Schema Conflicts

- Ensure migrations are run sequentially
- Check for concurrent execution
- Resolve merge conflicts in team

## Integration with CI/CD

### GitHub Actions

```yaml
name: Database Migrations
on: [push]
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: db-migrate up
```

## Dependencies

- `yargs@next` - CLI argument parsing
- `prisma@next` - ORM
- `@prisma/client@next` - Prisma client

## License

MIT
