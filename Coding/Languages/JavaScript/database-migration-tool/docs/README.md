# 💾 Database Migration Tool

CLI tool for managing database schema migrations with Prisma ORM. Supports version control, rollback, and migration status tracking.

## Features

- 🔝 **Version Control**: Track all migrations
- 🗑️ **Rollback Support**: Revert to previous schema state
- 📊 **Status Tracking**: View migration history
- 🔐 **Prisma Integration**: Leverages Prisma for migrations
- 📋 **Changelog Generation**: Auto-generate migration docs
- ✅ **Validation**: Verify schema consistency
- 💬 **Team-Friendly**: Handles concurrent migrations

## Installation

```bash
cd Coding/Languages/JavaScript/database-migration-tool
npm install
npm link
```

## Usage

### Run Migrations

```bash
db-migrate up
```

### Rollback

```bash
db-migrate down
```

### Check Status

```bash
db-migrate status
```

## Commands

- `db-migrate up` - Apply pending migrations
- `db-migrate down` - Rollback last migration
- `db-migrate status` - Check migration status

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/codepark
MIGRATION_PATH=./prisma/migrations
LOG_LEVEL=info
```

## Best Practices

- One change per migration
- Always include rollback
- Test in dev first
- Document complex migrations

## Dependencies

- `yargs@next` - CLI parsing
- `prisma@next` - ORM
- `@prisma/client@next` - Prisma client

## License

MIT
