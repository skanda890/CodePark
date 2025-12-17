# GraphQL + REST Coexistence Feature

## Overview

Run GraphQL and REST APIs together.

## Architecture

- Unified schema
- Shared resolvers
- Resource mapping

## Usage

```javascript
app.use('/api', restRouter);
app.use('/graphql', apolloServer);
```
