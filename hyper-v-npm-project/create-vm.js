const ps = require('node-powershell');

async function createVM() {
  const vmName = 'MyVM'; // Customize the VM name
  const memoryMB = 2048; // Customize the startup memory in MB
  const vhdxPath = 'A:\\VMs\\MyVM.vhdx'; // Customize the VHDX path

  const psInstance = new ps({
    executionPolicy: 'Bypass',
    noProfile: true,
  });

  try {
    await psInstance.addCommand(`New-VM -Name "${vmName}" -MemoryStartupBytes ${memoryMB}MB -NewVHDPath "${vhdxPath}" -NewVHDSizeBytes 50GB`);
    await psInstance.invoke();
    console.log(`VM "${vmName}" created successfully!`);
  } catch (err) {
    console.error('Error creating VM:', err);
  } finally {
    await psInstance.dispose();
  }
}

createVM();
