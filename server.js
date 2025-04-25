// This file is a wrapper to run the server in the yoklama-sistemi subdirectory
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the actual server.js in the subdirectory
const serverPath = path.join(__dirname, 'yoklama-sistemi', 'server.js');

// Run the server from the subdirectory
console.log(`Starting server from: ${serverPath}`);

// Spawn a new Node.js process to run the actual server
const server = spawn('node', [serverPath], {
  stdio: 'inherit', // This will pipe the child process's stdout/stderr to the parent process
});

// Handle server process events
server.on('error', (error) => {
  console.error(`Error starting server: ${error.message}`);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

console.log('Server wrapper is running. Press Ctrl+C to stop.');