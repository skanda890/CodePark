using System;
using System.Management;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

/// <summary>
/// Real-time BIOS monitoring service for Windows systems
/// </summary>
public class BIOSMonitor
{
    private ManagementEventWatcher _biosWatcher;
    private readonly string _logPath = "bios_audit_log.json";
    private readonly string _baselinePath = "bios_baseline.json";
    private List<BIOSChangeLog> _changeLog;
    
    /// <summary>BIOS change audit log entry</summary>
    public class BIOSChangeLog
    {
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }
        
        [JsonPropertyName("property")]
        public string Property { get; set; }
        
        [JsonPropertyName("beforeValue")]
        public string BeforeValue { get; set; }
        
        [JsonPropertyName("afterValue")]
        public string AfterValue { get; set; }
        
        [JsonPropertyName("user")]
        public string User { get; set; }
        
        [JsonPropertyName("severity")]
        public string Severity { get; set; }
    }
    
    public BIOSMonitor()
    {
        _changeLog = LoadChangeLog();
        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] BIOS Monitor initialized");
    }
    
    /// <summary>Start monitoring BIOS for changes</summary>
    public void StartMonitoring()
    {
        try
        {
            // WMI Event Query for BIOS changes
            string query = "SELECT * FROM __InstanceModificationEvent " +
                          "WITHIN 2 WHERE TargetInstance ISA 'Win32_SystemBIOS'";
            
            WqlEventQuery eventQuery = new WqlEventQuery(query);
            _biosWatcher = new ManagementEventWatcher(eventQuery);
            _biosWatcher.EventArrived += OnBIOSChanged;
            _biosWatcher.Start();
            
            Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] BIOS monitoring started");
            StoreBASELINE();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Failed to initialize BIOS monitor: {ex.Message}");
            throw;
        }
    }
    
    /// <summary>Handle BIOS change events</summary>
    private void OnBIOSChanged(object sender, EventArrivedEventArgs e)
    {
        try
        {
            ManagementBaseObject instanceBefore = 
                (ManagementBaseObject)e.NewEvent["PreviousInstance"];
            ManagementBaseObject instanceAfter = 
                (ManagementBaseObject)e.NewEvent["TargetInstance"];
            
            var biosPropertiesBefore = GetBIOSProperties(instanceBefore);
            var biosPropertiesAfter = GetBIOSProperties(instanceAfter);
            
            // Log changes
            foreach (var prop in biosPropertiesAfter.Keys)
            {
                if (biosPropertiesBefore.TryGetValue(prop, out var oldValue) &&
                    !oldValue.Equals(biosPropertiesAfter[prop]))
                {
                    LogChange(prop, oldValue, biosPropertiesAfter[prop]);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Processing BIOS change: {ex.Message}");
        }
    }
    
    /// <summary>Get all BIOS properties from management object</summary>
    private Dictionary<string, object> GetBIOSProperties(ManagementBaseObject mo)
    {
        var props = new Dictionary<string, object>();
        
        if (mo == null) return props;
        
        foreach (PropertyData prop in mo.Properties)
        {
            try
            {
                props[prop.Name] = prop.Value?.ToString() ?? "null";
            }
            catch { }
        }
        
        return props;
    }
    
    /// <summary>Log a BIOS property change</summary>
    private void LogChange(string property, object before, object after)
    {
        // Determine severity based on property
        string severity = DetermineSeverity(property);
        
        var change = new BIOSChangeLog
        {
            Timestamp = DateTime.Now,
            Property = property,
            BeforeValue = before?.ToString() ?? "N/A",
            AfterValue = after?.ToString() ?? "N/A",
            User = Environment.UserName,
            Severity = severity
        };
        
        _changeLog.Add(change);
        SaveChangeLog();
        
        Console.WriteLine($"\n[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{severity}] BIOS Change Detected");
        Console.WriteLine($"  Property: {property}");
        Console.WriteLine($"  Before: {change.BeforeValue}");
        Console.WriteLine($"  After: {change.AfterValue}");
        Console.WriteLine($"  User: {change.User}");
        
        SendAlert(change);
    }
    
    /// <summary>Determine severity of BIOS change</summary>
    private string DetermineSeverity(string property)
    {
        // Critical properties
        var criticalProps = new[] { "SecureBootEnabled", "TPMEnabled", "FirmwareVersion" };
        if (criticalProps.Contains(property)) return "CRITICAL";
        
        // High priority properties
        var highProps = new[] { "BIOSVersion", "Manufacturer", "SerialNumber" };
        if (highProps.Contains(property)) return "HIGH";
        
        return "MEDIUM";
    }
    
    /// <summary>Store baseline BIOS configuration</summary>
    private void StoreBASELINE()
    {
        try
        {
            ManagementObjectSearcher searcher = 
                new ManagementObjectSearcher("SELECT * FROM Win32_SystemBIOS");
            
            foreach (ManagementObject obj in searcher.Get())
            {
                var props = GetBIOSProperties(obj);
                var options = new JsonSerializerOptions { WriteIndented = true };
                string json = JsonSerializer.Serialize(props, options);
                File.WriteAllText(_baselinePath, json);
                Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] BIOS baseline stored");
                break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Storing baseline: {ex.Message}");
        }
    }
    
    /// <summary>Load change log from disk</summary>
    private List<BIOSChangeLog> LoadChangeLog()
    {
        if (!File.Exists(_logPath)) return new List<BIOSChangeLog>();
        
        try
        {
            string json = File.ReadAllText(_logPath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<BIOSChangeLog>>(json, options) 
                   ?? new List<BIOSChangeLog>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARNING] Loading change log: {ex.Message}");
            return new List<BIOSChangeLog>();
        }
    }
    
    /// <summary>Save change log to disk</summary>
    private void SaveChangeLog()
    {
        try
        {
            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(_changeLog, options);
            File.WriteAllText(_logPath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Saving change log: {ex.Message}");
        }
    }
    
    /// <summary>Send alert notification (webhook, email, etc)</summary>
    private void SendAlert(BIOSChangeLog change)
    {
        Console.WriteLine($"[ALERT] Sending notification for {change.Severity} severity change");
        // TODO: Implement webhook notification, email, Slack integration
    }
    
    /// <summary>Get change history</summary>
    public List<BIOSChangeLog> GetChangeHistory(int limit = 100)
    {
        return _changeLog.OrderByDescending(c => c.Timestamp).Take(limit).ToList();
    }
    
    /// <summary>Stop monitoring</summary>
    public void Stop()
    {
        _biosWatcher?.Stop();
        _biosWatcher?.Dispose();
        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] BIOS monitoring stopped");
    }
}

/// <summary>Console application entry point</summary>
public class Program
{
    public static void Main()
    {
        Console.WriteLine("╔════════════════════════════════════╗");
        Console.WriteLine("║  CodePark BIOS Monitor Service     ║");
        Console.WriteLine("║  Real-time BIOS Change Detection   ║");
        Console.WriteLine("╚════════════════════════════════════╝\n");
        
        var monitor = new BIOSMonitor();
        
        try
        {
            monitor.StartMonitoring();
            Console.WriteLine("\n[INFO] Press Enter to stop monitoring...");
            Console.ReadLine();
        }
        finally
        {
            monitor.Stop();
            Console.WriteLine("[INFO] Shutdown complete");
        }
    }
}
