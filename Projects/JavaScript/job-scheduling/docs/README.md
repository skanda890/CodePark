# Job Scheduling Feature

## Overview

Schedule and execute background jobs.

## Installation

```bash
npm install bull node-cron
```

## Usage

```javascript
const scheduler = new JobScheduler();

scheduler.schedule("backup", "0 2 * * *", async () => {
  await backupDatabase();
});
```
