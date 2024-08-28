const ps = new (require('node-powershell'))();
ps.addCommand('New-VM -Name MyVM -MemoryStartupBytes 2GB -NewVHDPath "A:\\VMs\\MyVM.vhdx" -NewVHDSizeBytes 5000GB');
ps.invoke()
  .then(() => console.log('VM created successfully!'))
  .catch(err => console.error('Error creating VM:', err));
