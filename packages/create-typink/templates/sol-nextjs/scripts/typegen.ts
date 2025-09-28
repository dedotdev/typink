import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { isInkAbi, isSolAbi } from 'dedot/contracts';

const artifactsDir = path.join(__dirname, '../src/contracts/artifacts');
const outputDir = path.join(__dirname, '../src/contracts/types');

interface ContractFile {
  path: string;
  type: 'ink' | 'solidity';
}

function findContractFiles(dir: string): ContractFile[] {
  const contractFiles: ContractFile[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        // Check for contract-like file extensions
        if (entry.name.endsWith('.json') || entry.name.endsWith('.contract') || entry.name.endsWith('.abi')) {
          const filePath = path.join(dir, entry.name);

          try {
            // Read and parse the file content
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(content);

            // Detect the contract type based on content
            if (isInkAbi(parsed)) {
              contractFiles.push({ path: filePath, type: 'ink' });
              console.log(`    Detected ink contract: ${entry.name}`);
            } else if (isSolAbi(parsed)) {
              contractFiles.push({ path: filePath, type: 'solidity' });
              console.log(`    Detected solidity contract: ${entry.name}`);
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

  const contractDirs = fs
    .readdirSync(artifactsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(artifactsDir, dirent.name));

  if (contractDirs.length === 0) {
    console.log('No contract directories found in artifacts folder.');
    return;
  }

  console.log(`Found ${contractDirs.length} contract directories\n`);

  let processedCount = 0;
  let errorCount = 0;

  for (const contractDir of contractDirs) {
    const contractName = path.basename(contractDir);
    console.log(`Processing contract: ${contractName}`);

    const contractFiles = findContractFiles(contractDir);

    if (contractFiles.length === 0) {
      console.log(`  ⚠ No valid contract files found in ${contractName}`);
      continue;
    }

    // Use the first valid contract file found
    const contractFile = contractFiles[0];
    console.log(`  Processing ${contractFile.type} contract: ${path.basename(contractFile.path)}`);

    try {
      const command = `npx dedot typink -m "${contractFile.path}" -o "${outputDir}"`;

      execSync(command, { stdio: 'inherit' });

      console.log(`  ✓ Successfully generated types for ${contractName}\n`);
      processedCount++;
    } catch (error) {
      console.error(`  ✗ Error generating types for ${contractName}:`, error);
      console.error('');
      errorCount++;
    }
  }

  console.log('\n=== Type Generation Complete ===');
  console.log(`Successfully processed: ${processedCount} contracts`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} contracts`);
  }
}

generateTypes();
