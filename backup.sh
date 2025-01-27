#!/bin/bash

# Get current timestamp
timestamp=$(date +"%Y%m%d_%H%M%S")

# Create backup directories if they don't exist
mkdir -p backups/stable
mkdir -p backups/experimental
mkdir -p backups/snapshots

# Backup stable version
cp -r stable/ backups/stable/stable_$timestamp

# Backup experimental version
cp -r experimental/ backups/experimental/experimental_$timestamp

# Create a snapshot of both (for major changes)
mkdir -p backups/snapshots/snapshot_$timestamp
cp -r stable/ backups/snapshots/snapshot_$timestamp/stable
cp -r experimental/ backups/snapshots/snapshot_$timestamp/experimental

# Keep only last 5 backups for each (optional)
cd backups/stable && ls -t | tail -n +6 | xargs rm -rf
cd ../experimental && ls -t | tail -n +6 | xargs rm -rf
cd ../snapshots && ls -t | tail -n +6 | xargs rm -rf

echo "Backup completed at $timestamp"
