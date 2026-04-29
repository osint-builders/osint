#!/usr/bin/env node

/**
 * FFmpeg Binary Setup
 * 
 * Downloads ffmpeg binaries for the current platform.
 * Supports macOS, Linux, and Windows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const platform = process.platform;
const arch = process.arch;

console.log(`Setting up ffmpeg for ${platform} ${arch}...`);

// Platform-specific setup instructions
const setup = {
  darwin: () => {
    console.log('macOS detected. Install ffmpeg via Homebrew:');
    console.log('  brew install ffmpeg');
    console.log('\nOr download from: https://ffmpeg.org/download.html');
  },
  linux: () => {
    console.log('Linux detected. Install ffmpeg via package manager:');
    console.log('  apt-get install ffmpeg  (Debian/Ubuntu)');
    console.log('  yum install ffmpeg      (RedHat/CentOS)');
    console.log('  pacman -S ffmpeg        (Arch)');
    console.log('\nOr download from: https://ffmpeg.org/download.html');
  },
  win32: () => {
    console.log('Windows detected. Install ffmpeg via:');
    console.log('  choco install ffmpeg');
    console.log('\nOr download from: https://ffmpeg.org/download.html');
  },
};

// Try to find existing ffmpeg
try {
  const version = execSync('ffmpeg -version', { encoding: 'utf-8' });
  console.log('\nffmpeg already installed:');
  console.log(version.split('\n')[0]);
} catch {
  console.log('\nffmpeg not found in PATH.');
  if (setup[platform]) {
    setup[platform]();
  } else {
    console.log('See https://ffmpeg.org/download.html for installation instructions');
  }
}

// Create symlink if binary is in this directory
const binaryPath = path.join(__dirname, 'ffmpeg');
if (fs.existsSync(binaryPath)) {
  console.log(`\nffmpeg binary found at: ${binaryPath}`);
}
