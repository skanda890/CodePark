const ps = require('node-powershell');

async function startVM() {
  const vmName = 'MyVM'; // Replace with your VM name

  const psInstance = new ps({
    executionPolicy: 'Bypass',
    noProfile: true,
  });

  try {
    await psInstance.addCommand(`Start-VM -Name "${vmName}"`);
    await psInstance.invoke();
    console.log(`VM "${vmName}" started successfully!`);
  } catch (err) {
    console.error('Error starting VM:', err);
  } finally {
    await psInstance.dispose();
  }
}

startVM();
