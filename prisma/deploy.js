import { execSync } from 'child_process';

console.log('Checking and deploying Prisma migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Prisma migrations deployed successfully.');
} catch (err) {
  console.log('Initial migrate deploy failed (database requires baselining). Baselining initial migration...');
  try {
    execSync('npx prisma migrate resolve --applied 20260920223000_init', { stdio: 'inherit' });
    console.log('Baseline resolved for 20260920223000_init.');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migration deploy confirmed after baseline.');
  } catch (resolveErr) {
    console.error('Migration deploy/resolve failed:', resolveErr);
    process.exit(1);
  }
}
