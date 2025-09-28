import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { isInkAbi, isSolAbi } from 'dedot/contracts';

const artifactsDir = path.join(__dirname, '../src/contracts/artifacts');
const outputDir = path.join(__dirname, '../src/contracts/types');

interface ContractFile {
  path: string;
  type: 'ink' | 'solidity';
  relativePath: string;
}

function findContractFilesRecursive(dir: string, baseDir: string = dir): ContractFile[] {
  const contractFiles: ContractFile[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        contractFiles.push(...findContractFilesRecursive(fullPath, baseDir));
      } else if (entry.isFile()) {
        // Check for contract-like file extensions
        if (entry.name.endsWith('.json') || entry.name.endsWith('.contract') || entry.name.endsWith('.abi')) {
          try {
            // Read and parse the file content
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = JSON.parse(content);

            // Detect the contract type based on content
            const relativePath = path.relative(baseDir, fullPath);

            if (isInkAbi(parsed)) {
              contractFiles.push({ path: fullPath, type: 'ink', relativePath });
            } else if (isSolAbi(parsed)) {
              contractFiles.push({ path: fullPath, type: 'solidity', relativePath });
            }
            // Silently skip files that don't match either format
          } catch (parseError) {
            // Silently skip files that can't be parsed as JSON
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return contractFiles;
}

function generateTypes() {
  console.log('Starting type generation for contracts...\n');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  if (!fs.existsSync(artifactsDir)) {
    console.error(`Artifacts directory not found: ${artifactsDir}`);
    process.exit(1);
  }

  // Recursively find all contract files in the artifacts directory
  console.log(`Searching for contracts in: ${artifactsDir}`);
  const contractFiles = findContractFilesRecursive(artifactsDir);

  if (contractFiles.length === 0) {
    console.log('No valid contract files found in artifacts folder.');
    return;
  }

  console.log(`\nFound ${contractFiles.length} contract(s):`);

  // Log all found contracts
  contractFiles.forEach((file) => {
    console.log(`  - ${file.type.padEnd(8)} | ${file.relativePath}`);
  });

  console.log('\nGenerating types...\n');

  let processedCount = 0;
  let errorCount = 0;

  for (const contractFile of contractFiles) {
    console.log(`Processing: ${contractFile.relativePath}`);

    try {
      const command = `npx dedot typink -m "${contractFile.path}" -o "${outputDir}"`;

      execSync(command, { stdio: 'inherit' });

      console.log(`  ✓ Successfully generated types for ${contractFile.relativePath}\n`);
      processedCount++;
    } catch (error) {
      console.error(`  ✗ Error generating types for ${contractFile.relativePath}:`, error);
      console.error('');
      errorCount++;
    }
  }

  console.log('\n=== Type Generation Complete ===');
  console.log(`Successfully processed: ${processedCount} contract(s)`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} contract(s)`);
  }
}

generateTypes();
