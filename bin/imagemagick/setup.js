#!/usr/bin/env node

/**
 * ImageMagick Binary Setup
 * 
 * Guides setup of ImageMagick CLI for the current platform.
 * Supports macOS, Linux, and Windows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const platform = process.platform;
const arch = process.arch;

console.log(`Setting up ImageMagick for ${platform} ${arch}...`);

// Platform-specific setup instructions
const setup = {
  darwin: () => {
    console.log('macOS detected. Install ImageMagick via Homebrew:');
    console.log('  brew install imagemagick');
    console.log('\nOr download from: https://imagemagick.org/script/download.php');
  },
  linux: () => {
    console.log('Linux detected. Install ImageMagick via package manager:');
    console.log('  apt-get install imagemagick    (Debian/Ubuntu)');
    console.log('  yum install ImageMagick        (RedHat/CentOS)');
    console.log('  pacman -S imagemagick          (Arch)');
    console.log('\nOr download from: https://imagemagick.org/script/download.php');
  },
  win32: () => {
    console.log('Windows detected. Install ImageMagick via:');
    console.log('  choco install imagemagick');
    console.log('\nOr download from: https://imagemagick.org/script/download.php');
  },
};

// Try to find existing ImageMagick
try {
  const version = execSync('magick -version', { encoding: 'utf-8' });
  console.log('\nImageMagick already installed (v7+):');
  console.log(version.split('\n')[0]);
} catch {
  try {
    const version = execSync('convert -version', { encoding: 'utf-8' });
    console.log('\nImageMagick already installed (legacy):');
    console.log(version.split('\n')[0]);
  } catch {
    console.log('\nImageMagick not found in PATH.');
    if (setup[platform]) {
      setup[platform]();
    } else {
      console.log('See https://imagemagick.org/script/download.php for installation instructions');
    }
  }
}

// Info about commands
console.log('\n--- Available Commands ---');
console.log('magick (v7+):       Unified modern command');
console.log('convert (legacy):   Image conversion (still works)');
console.log('mogrify:            In-place batch processing');
console.log('identify:           Image metadata inspection');
console.log('montage:            Image composites and contact sheets');
console.log('composite:          Overlay images');
