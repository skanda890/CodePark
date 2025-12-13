# Prisma Schema Additions for New Features

## Overview
This document outlines the required Prisma schema changes to support the 8 new features.

## Feature 5: Team Management & Roles

Add these models to your `prisma/schema.prisma`:

```prisma
model TeamMember {
  id String @id @default(cuid())
  projectId String
  userId String
  role String @default("CONTRIBUTOR") 
  // Roles: OWNER, ADMIN, MAINTAINER, CONTRIBUTOR, VIEWER
  joinedAt DateTime @default(now())
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

model ProjectInvite {
  id String @id @default(cuid())
  projectId String
  email String
  role String @default("CONTRIBUTOR")
  token String @unique
  expiresAt DateTime
  acceptedAt DateTime?
  acceptedByUserId String?
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@index([projectId])
  @@index([token])
  @@index([email])
}

model AuditLog {
  id String @id @default(cuid())
  projectId String
  userId String?
  action String // create, update, delete, approve, merge, etc.
  resourceType String // file, review, project, member
  resourceId String
  oldValue String? @db.Text
  newValue String? @db.Text
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
  status String @default("success") // success, failure
  errorMessage String?
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([projectId])
  @@index([userId])
  @@index([timestamp])
  @@index([action])
}
```

## Update Existing Models

Add these relations to your existing `User` model:

```prisma
model User {
  id String @id @default(cuid())
  username String @unique
  email String @unique
  // ... existing fields ...
  
  // New relations for team management
  teamMemberships TeamMember[]
  projectOwned Project[] @relation("owner")
  teamInvites ProjectInvite[]
  auditLogs AuditLog[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Add these relations to your existing `Project` model:

```prisma
model Project {
  id String @id @default(cuid())
  name String
  description String?
  ownerId String
  // ... existing fields ...
  
  // New relations for team management
  owner User @relation("owner", fields: [ownerId], references: [id])
  teamMembers TeamMember[]
  invites ProjectInvite[]
  auditLogs AuditLog[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([ownerId])
}
```

## Migration Commands

```bash
# Create migration
npx prisma migrate dev --name add_team_management

# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Future Features (Placeholders)

Reserved models for future features:

```prisma
// Feature 1: Code Analytics
model ProjectMetrics {
  id String @id @default(cuid())
  projectId String
  timestamp DateTime @default(now())
  cyclomaticComplexity Float
  codeQuality Float
  testCoverage Float
  vulnerabilityCount Int
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
  @@index([timestamp])
}

// Feature 2: Code Review
model CodeReview {
  id String @id @default(cuid())
  projectId String
  fileId String
  authorId String
  status String @default("pending") 
  // pending, approved, changes-requested, merged
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Feature 3: Code Snippets
model CodeSnippet {
  id String @id @default(cuid())
  title String
  description String
  language String
  code String @db.Text
  tags String[]
  category String
  isPublic Boolean @default(false)
  ownerId String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Rollback (If Needed)

```bash
# Rollback to previous state
npx prisma migrate resolve --rolled-back <migration_name>

# Or reset database (warning: destructive)
npx prisma migrate reset
```

## Testing the Schema

```bash
# Validate schema
npx prisma validate

# Generate visual schema
npx prisma studio
```

## Next Steps

1. Run migration commands above
2. Update your API to use new models
3. Run tests to verify functionality
4. Deploy to production

For more details, see the implementation guides in the `docs/` directory.
