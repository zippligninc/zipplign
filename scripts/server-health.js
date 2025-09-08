#!/usr/bin/env node

// Server Health Check and Management Script
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9002;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RESTART_ATTEMPTS = 3;

class ServerHealthMonitor {
  constructor() {
    this.restartAttempts = 0;
    this.isMonitoring = false;
    this.serverProcess = null;
  }

  async checkServerHealth() {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/health`);
      if (response.ok) {
        console.log('✅ Server is healthy');
        this.restartAttempts = 0;
        return true;
      }
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    return false;
  }

  async findServerProcess() {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            resolve(pid);
            return;
          }
        }
        resolve(null);
      });
    });
  }

  async killServerProcess(pid) {
    return new Promise((resolve) => {
      exec(`taskkill /PID ${pid} /F`, (error) => {
        if (error) {
          console.log('Failed to kill process:', error.message);
          resolve(false);
        } else {
          console.log(`✅ Killed server process ${pid}`);
          resolve(true);
        }
      });
    });
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting development server...');
      
      this.serverProcess = exec('npm run dev', (error, stdout, stderr) => {
        if (error) {
          console.error('Server startup error:', error);
          reject(error);
        }
      });

      this.serverProcess.stdout.on('data', (data) => {
        console.log(data.toString());
        if (data.includes('Ready in')) {
          console.log('✅ Server started successfully');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  async restartServer() {
    if (this.restartAttempts >= MAX_RESTART_ATTEMPTS) {
      console.error('❌ Max restart attempts reached. Manual intervention required.');
      return false;
    }

    this.restartAttempts++;
    console.log(`🔄 Restarting server (attempt ${this.restartAttempts}/${MAX_RESTART_ATTEMPTS})`);

    // Kill existing process
    const pid = await this.findServerProcess();
    if (pid) {
      await this.killServerProcess(pid);
      // Wait for port to be released
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Start new server
    try {
      await this.startServer();
      return true;
    } catch (error) {
      console.error('Failed to restart server:', error.message);
      return false;
    }
  }

  async monitor() {
    this.isMonitoring = true;
    console.log('🔍 Starting server health monitoring...');

    while (this.isMonitoring) {
      const isHealthy = await this.checkServerHealth();
      
      if (!isHealthy) {
        console.log('⚠️ Server is not responding, attempting restart...');
        const success = await this.restartServer();
        if (!success) {
          console.error('❌ Failed to restart server. Stopping monitoring.');
          break;
        }
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }
  }

  stop() {
    this.isMonitoring = false;
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    console.log('🛑 Server monitoring stopped');
  }
}

// CLI Usage
if (require.main === module) {
  const monitor = new ServerHealthMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    monitor.stop();
    process.exit(0);
  });

  // Start monitoring
  monitor.monitor().catch(console.error);
}

module.exports = ServerHealthMonitor;
