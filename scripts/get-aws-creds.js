#!/usr/bin/env node
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

try {
  const result = execSync('aws sts get-session-token --output json', { encoding: 'utf8' })
  const { Credentials } = JSON.parse(result)

  let region = 'us-east-1'
  try {
    region = execSync('aws configure get region', { encoding: 'utf8' }).trim()
  } catch (_) {}

  const env = [
    `VITE_AWS_ACCESS_KEY_ID=${Credentials.AccessKeyId}`,
    `VITE_AWS_SECRET_ACCESS_KEY=${Credentials.SecretAccessKey}`,
    `VITE_AWS_SESSION_TOKEN=${Credentials.SessionToken}`,
    `VITE_AWS_REGION=${region}`,
  ].join('\n') + '\n'

  writeFileSync('.env.local', env)
  console.log(`✓ AWS credentials injected → .env.local (region: ${region})`)
} catch (err) {
  console.error('✗ Failed to get AWS credentials:', err.message)
  process.exit(1)
}
