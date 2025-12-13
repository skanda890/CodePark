# CodePark Feature Implementation - Phase 1: Team Management

## Overview

This pull request implements **Feature 5: Project Team Management & Roles** as part of the 8-feature roadmap for CodePark v2.

## What's Included

### 1. Service Layer
- **File**: `services/teamService.js`
- **Features**:
  - Add team members to projects
  - Update member roles
  - Remove team members
  - Check user permissions
  - Audit logging for all operations

### 2. Middleware
- **File**: `middleware/authorization.js`
- **Features**:
  - `requirePermission()` - Check specific permissions
  - `requireAdminRole()` - Require ADMIN or OWNER
  - `requireOwnerRole()` - Require OWNER only

### 3. API Routes
- **File**: `routes/teamManagement.js`
- **Endpoints**:
  - `POST /api/projects/:projectId/members` - Add member
  - `GET /api/projects/:projectId/members` - List members
  - `PATCH /api/projects/:projectId/members/:userId/role` - Update role
  - `DELETE /api/projects/:projectId/members/:userId` - Remove member
  - `POST /api/projects/:projectId/invites` - Send invite
  - `POST /api/invites/:token/accept` - Accept invite
  - `GET /api/projects/:projectId/invites` - List invites

### 4. Tests
- **File**: `tests/integration/teamManagement.test.js`
- Test cases for all endpoints

### 5. Documentation
- **File**: `docs/PRISMA_SCHEMA_ADDITIONS.md`
- Schema requirements and migration instructions

## Role Hierarchy

```
OWNER
  └─ Can do everything
  └─ Cannot be removed if last owner

ADMIN
  └─ Can manage team
  └─ Can manage settings
  └─ Can delete project
  └─ Can manage reviews

MAINTAINER
  └─ Can create and approve reviews
  └─ Can merge code
  └─ Can manage issues

CONTRIBUTOR (default)
  └─ Can write code
  └─ Can create reviews
  └─ Can comment on reviews

VIEWER
  └─ Read-only access
  └─ Can view code
  └─ Can view reviews
  └─ Can view analytics
```

## Implementation Steps

### Step 1: Update Database Schema

```bash
cd CodePark
cat docs/PRISMA_SCHEMA_ADDITIONS.md
```

Add the schemas to your `prisma/schema.prisma` file and run:

```bash
npx prisma migrate dev --name add_team_management
```

### Step 2: Install Dependencies (if needed)

```bash
npm install express-validator
```

### Step 3: Update Main Application File

Add to `index.js`:

```javascript
// Import new routes
const teamManagementRoutes = require('./routes/teamManagement');

// Add routes (after other route definitions)
app.use('/api/projects', teamManagementRoutes);
```

### Step 4: Run Tests

```bash
npm test -- tests/integration/teamManagement.test.js
```

### Step 5: Start Development Server

```bash
npm run dev
```

## API Usage Examples

### Add Team Member

```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/members \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "role": "CONTRIBUTOR"}'
```

### Get Team Members

```bash
curl -X GET http://localhost:3000/api/projects/PROJECT_ID/members \
  -H "Authorization: Bearer TOKEN"
```

### Update Member Role

```bash
curl -X PATCH http://localhost:3000/api/projects/PROJECT_ID/members/USER_ID/role \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "MAINTAINER"}'
```

### Remove Member

```bash
curl -X DELETE http://localhost:3000/api/projects/PROJECT_ID/members/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

### Send Invite

```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/invites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "role": "CONTRIBUTOR"}'
```

### Accept Invite

```bash
curl -X POST http://localhost:3000/api/invites/INVITE_TOKEN/accept \
  -H "Authorization: Bearer TOKEN"
```

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 403 | User is not a team member | Add user to team first |
| 403 | Insufficient permissions | Check user role |
| 400 | Invalid role | Use valid role: OWNER, ADMIN, MAINTAINER, CONTRIBUTOR, VIEWER |
| 404 | Project not found | Verify project ID |
| 409 | User already a member | Remove and re-add if needed |

## Security Considerations

✅ **Implemented**:
- Role-based access control (RBAC)
- Permission checking on all endpoints
- Input validation with express-validator
- Audit logging of all team actions
- Token-based invites with expiry
- No sensitive data in logs

## Performance Optimizations

✅ **Included**:
- Database indexes on frequently queried fields
- Unique constraints to prevent duplicates
- Efficient query patterns
- Cascade deletion for data consistency

## Next Features

After this is merged and deployed:

1. **Feature 6**: Audit Logging & Compliance
2. **Feature 1**: Code Analytics Dashboard
3. **Feature 4**: AI-Powered Code Quality Metrics
4. **Feature 2**: Collaborative Code Review System
5. **Feature 7**: Git Integration
6. **Feature 3**: Code Snippet Library
7. **Feature 8**: Report Generation

## Checklist Before Merge

- [ ] Schema migration tested locally
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation updated
- [ ] No breaking changes to existing APIs
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Code review approval

## Review Notes

### What Changed
- Added 3 new service/route files
- Added 1 middleware file
- Added test file
- Added documentation

### Files Modified
None - all new files

### Database Changes
- 3 new models: `TeamMember`, `ProjectInvite`, `AuditLog`
- 2 existing models updated: `User`, `Project`

### Breaking Changes
None

## Testing the Feature

### Manual Testing

1. Create a project
2. Add a team member
3. Update their role
4. Send an invite
5. Accept the invite
6. Check audit logs

### Automated Testing

```bash
npm run test:integration -- tests/integration/teamManagement.test.js
```

## Deployment Instructions

### Development
```bash
npm run dev
```

### Staging
```bash
npm run build
npm start
```

### Production
1. Merge PR
2. Run database migration: `npm run migrate`
3. Deploy application
4. Verify audit logs are working
5. Monitor error logs

## Support & Questions

For issues or questions:
1. Check the documentation in `docs/`
2. Review the API examples above
3. Check existing tests for usage patterns
4. Create a GitHub issue

## Future Improvements

- [ ] Batch user import
- [ ] Role templates
- [ ] Permission matrix UI
- [ ] Invite expiry dashboard
- [ ] Team activity timeline
- [ ] Bulk operations

## References

- [Feature Proposal](../FEATURE-SUMMARY.md)
- [Implementation Guide](../Feature-Implementation-Guide.md)
- [Schema Documentation](./PRISMA_SCHEMA_ADDITIONS.md)
- [GitHub Workflow Guide](../GITHUB-WORKFLOW.md)

---

**PR Type**: Feature  
**Priority**: Critical  
**Phase**: Phase 1 (Foundation)  
**Estimated Review Time**: 30 minutes  
**Testing Time**: 15 minutes  

Ready for review! ✅
