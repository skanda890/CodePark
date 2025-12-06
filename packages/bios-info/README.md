# CodePark BIOS-Info Monitor

Real-time BIOS monitoring service for Windows systems with audit logging and change detection.

## Features

- ✅ Real-time BIOS change detection via WMI
- ✅ Audit logging with before/after values
- ✅ Severity classification (CRITICAL, HIGH, MEDIUM)
- ✅ Baseline BIOS configuration storage
- ✅ Change history tracking
- ✅ Alert notifications (extensible)
- ✅ JSON-based persistence

## Requirements

- Windows 10/11 or Windows Server 2016+
- .NET Framework 4.7.2+
- Administrator privileges (for WMI event monitoring)

## Build

```bash
# Using .NET CLI
dotnet build

# Using Visual Studio
# Open BIOSMonitor.sln and build from IDE
```

## Running

```bash
# Run from command line (requires admin privileges)
dotnet run

# Or compile to executable
dotnet publish -c Release
.\bin\Release\net472\BIOSMonitor.exe
```

## Output

### Audit Log (bios_audit_log.json)

```json
[
  {
    "timestamp": "2025-12-06T16:30:00",
    "property": "SecureBootEnabled",
    "beforeValue": "false",
    "afterValue": "true",
    "user": "SYSTEM",
    "severity": "CRITICAL"
  }
]
```

### Baseline (bios_baseline.json)

```json
{
  "Manufacturer": "American Megatrends International",
  "Description": "BIOS Date: 05/20/2022 20:49:08 Ver: 05.0D",
  "Version": "AMIB1100",
  "SMBIOSBIOSVersion": "F12a",
  "BIOSVersion": "AMIB1100",
  "SerialNumber": "XXXXXXXX"
}
```

## Configuration

Edit `BIOSMonitor.cs` to customize:

- `_logPath`: Path to audit log file
- `_baselinePath`: Path to baseline file
- Change monitoring interval (line: `WITHIN 2`)
- Severity classification (DetermineSeverity method)
- Alert notification mechanism

## Monitored Properties

- BIOS version and manufacturer
- Secure Boot status
- TPM (Trusted Platform Module) settings
- UEFI/Legacy mode
- System Serial Number
- All other BIOS-related WMI properties

## API

### Methods

- `StartMonitoring()`: Start WMI event monitoring
- `Stop()`: Stop monitoring and cleanup
- `GetChangeHistory(int limit)`: Get recent changes
- `GetBIOSProperties(ManagementBaseObject mo)`: Extract BIOS properties

## Architecture

```
BIOSMonitor.cs
├── StartMonitoring()        - Initialize WMI watcher
├── OnBIOSChanged()          - Event handler for changes
├── DetermineSeverity()      - Classify change severity
├── LogChange()              - Record change in audit log
├── SendAlert()              - Notify administrators
└── StoreBASELINE()          - Save baseline config
```

## Future Enhancements

- [ ] Email notifications
- [ ] Slack/Discord webhook integration
- [ ] REST API for remote monitoring
- [ ] Database backend for centralized logging
- [ ] Rollback capability for authorized users
- [ ] Integration with Windows Event Log

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT
