const ps = new (require('node-powershell'))();
ps.addCommand('Start-VM -Name MyVM');
ps.invoke()
  .then(() => console.log('VM started successfully!'))
  .catch(err => console.error('Error starting VM:', err));
