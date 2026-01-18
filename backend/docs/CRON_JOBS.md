# Cron Jobs Documentation

This document describes the scheduled tasks (cron jobs) integrated into the Finvera backend application.

## Overview

The application includes a built-in cron service that manages scheduled tasks without requiring external cron setup. All scheduled tasks run within the Node.js application process.

## Available Jobs

### 1. Trial Cleanup Job

**Purpose**: Automatically removes databases for expired trial/free users after 60 days of inactivity.

**Schedule**: Daily at 2:00 AM (configurable via `TIMEZONE` environment variable)

**Configuration**:
- `CLEANUP_DRY_RUN`: Set to `false` to perform actual cleanup (default: `true` for safety)
- `CLEANUP_CREATE_BACKUP`: Set to `true` to create backups before deletion (default: `false`)
- `TIMEZONE`: Timezone for cron jobs (default: `UTC`)

**Safety Features**:
- Only removes trial/free plan databases
- Requires 60+ days of inactivity
- Creates backup before deletion (if enabled)
- Logs all actions for audit trail
- Dry run mode by default

## API Endpoints

All cron management endpoints require super admin authentication.

### Get Cron Status
```
GET /api/admin/cron/status
```

Returns the status of all scheduled jobs.

### Manually Trigger Trial Cleanup
```
POST /api/admin/cron/trigger-trial-cleanup
Content-Type: application/json

{
  "dryRun": true
}
```

Manually triggers the trial cleanup process. Set `dryRun: false` to perform actual cleanup.

### Stop/Start Jobs
```
POST /api/admin/cron/jobs/{jobName}/stop
POST /api/admin/cron/jobs/{jobName}/start
```

Stop or start specific cron jobs.

## Environment Variables

```bash
# Cron Configuration
TIMEZONE=UTC                    # Timezone for scheduled jobs
CLEANUP_DRY_RUN=true           # Set to false for actual cleanup
CLEANUP_CREATE_BACKUP=false    # Set to true to create backups

# Database Configuration (required for cleanup)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master
```

## Logs

Cron job activities are logged to:
- Application logs (via logger service)
- Dedicated log file: `backend/logs/trial-cleanup.log`

## How It Works

1. **Server Startup**: Cron service initializes automatically when the server starts
2. **Scheduling**: Jobs are scheduled using the `node-cron` library
3. **Execution**: Jobs run in the background within the main application process
4. **Monitoring**: Job status can be monitored via API endpoints
5. **Graceful Shutdown**: All jobs are stopped when the server shuts down

## Trial Cleanup Process

1. **Find Expired Tenants**: Queries master database for trial/free accounts older than 60 days
2. **Check Activity**: Examines each tenant's database for recent user activity
3. **Backup (Optional)**: Creates database backup if configured
4. **Cleanup**: Drops inactive databases and marks tenants as inactive
5. **Audit**: Logs all actions for compliance and debugging

## Adding New Jobs

To add a new scheduled job:

1. Edit `backend/src/services/cronService.js`
2. Add a new setup method (e.g., `setupNewJob()`)
3. Call the setup method in the `initialize()` function
4. Use cron syntax for scheduling: `'0 2 * * *'` (daily at 2 AM)

Example:
```javascript
setupNewJob() {
  const jobName = 'new-job';
  const schedule = '0 3 * * *'; // Daily at 3 AM
  
  const job = cron.schedule(schedule, async () => {
    logger.info('🔄 Running new job...');
    // Your job logic here
  }, {
    scheduled: false,
    timezone: process.env.TIMEZONE || 'UTC'
  });

  this.jobs.set(jobName, job);
  job.start();
  
  logger.info(`📅 New job scheduled: ${schedule}`);
}
```

## Security

- All cron management endpoints require super admin authentication
- Dry run mode is enabled by default for safety
- Database backups can be created before deletion
- All actions are logged for audit purposes

## Troubleshooting

### Jobs Not Running
1. Check server logs for cron service initialization
2. Verify timezone configuration
3. Check job status via API: `GET /api/admin/cron/status`

### Trial Cleanup Issues
1. Verify database connections and permissions
2. Check environment variables are set correctly
3. Test with dry run mode first: `"dryRun": true`
4. Review logs in `backend/logs/trial-cleanup.log`

### Memory Issues
- Cron jobs run within the main process
- Large cleanup operations may require memory monitoring
- Consider running cleanup during low-traffic hours (default: 2 AM)