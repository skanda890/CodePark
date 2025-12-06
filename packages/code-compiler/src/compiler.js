// compiler.js - Multi-language compilation service
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

class CodeCompiler {
  constructor() {
    this.docker = new Docker();
    this.languages = {
      'python': { image: 'python:3.11-slim', cmd: 'python', ext: '.py' },
      'javascript': { image: 'node:18-alpine', cmd: 'node', ext: '.js' },
      'nodejs': { image: 'node:18-alpine', cmd: 'node', ext: '.js' },
      'go': { image: 'golang:1.20-alpine', cmd: 'go', ext: '.go' },
      'rust': { image: 'rust:1.70-alpine', cmd: 'rustc', ext: '.rs' },
      'java': { image: 'openjdk:17-jdk-slim', cmd: 'javac', ext: '.java' },
      'csharp': { image: 'mcr.microsoft.com/dotnet/sdk:7.0', cmd: 'dotnet', ext: '.cs' }
    };
  }
  
  /**
   * Compile and execute code
   */
  async compile(code, language, input = '') {
    const lang = this.languages[language.toLowerCase()];
    if (!lang) throw new Error(`Unsupported language: ${language}`);
    
    const tempDir = path.join('/tmp', uuid());
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Write code to file
      const codeFile = path.join(tempDir, this.getFileName(language));
      fs.writeFileSync(codeFile, code);
      
      console.log(`🐧 Compiling ${language}...`);
      
      // Create container
      const container = await this.docker.createContainer({
        Image: lang.image,
        Cmd: this.getCompileCommand(language),
        HostConfig: {
          Binds: [`${tempDir}:/code:rw`],
          Memory: 256 * 1024 * 1024, // 256MB limit
          MemorySwap: 256 * 1024 * 1024,
          CpuQuota: 100000 // 50% CPU
        },
        WorkingDir: '/code',
        Stdin: true,
        OpenStdin: true,
        Tty: false,
        NetworkDisabled: true
      });
      
      // Start container
      await container.start();
      
      // Execute with timeout
      const timeout = 10000; // 10 seconds
      const startTime = Date.now();
      
      let output = '';
      let error = '';
      
      try {
        const stream = await container.attach({
          stream: true,
          stdout: true,
          stderr: true,
          stdin: true
        });
        
        // Send input if provided
        if (input) {
          stream.write(input);
          stream.end();
        }
        
        // Collect output
        stream.on('data', (chunk) => {
          output += chunk.toString();
        });
        
        stream.on('error', (err) => {
          error += err.toString();
        });
      } catch (err) {
        error = err.message;
      }
      
      // Wait for completion
      const result = await Promise.race([
        container.wait({ condition: 'next-exit' }),
        new Promise((resolve) => {
          setTimeout(() => resolve({ StatusCode: 124 }), timeout);
        })
      ]);
      
      // Check execution time
      const elapsed = Date.now() - startTime;
      if (result.StatusCode === 124 || elapsed > timeout) {
        throw new Error(`Execution timeout (${elapsed}ms)`);
      }
      
      // Clean up
      await container.remove({ force: true });
      fs.rmSync(tempDir, { recursive: true });
      
      return {
        status: result.StatusCode === 0 ? 'success' : 'error',
        output: output.trim(),
        error: error.trim(),
        executionTime: elapsed,
        language: language,
        exitCode: result.StatusCode
      };
    } catch (err) {
      // Cleanup on error
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
      
      throw err;
    }
  }
  
  /**
   * Get filename for language
   */
  getFileName(language) {
    const files = {
      'python': 'script.py',
      'javascript': 'script.js',
      'nodejs': 'script.js',
      'go': 'main.go',
      'rust': 'main.rs',
      'java': 'Main.java',
      'csharp': 'Program.cs'
    };
    return files[language.toLowerCase()] || 'code';
  }
  
  /**
   * Get compile command for language
   */
  getCompileCommand(language) {
    const commands = {
      'python': ['python', '/code/script.py'],
      'javascript': ['node', '/code/script.js'],
      'nodejs': ['node', '/code/script.js'],
      'go': ['go', 'run', '/code/main.go'],
      'rust': ['rustc', '/code/main.rs', '-o', '/code/main', '&&', '/code/main'],
      'java': ['sh', '-c', 'cd /code && javac Main.java && java Main'],
      'csharp': ['dotnet', 'run', '--project', '/code']
    };
    return commands[language.toLowerCase()] || ['sh', '-c', 'cat /code/code'];
  }
  
  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languages);
  }
}

module.exports = CodeCompiler;
