import { execa } from 'execa';

export async function createProjectDirectory(projectName: string) {
  try {
    const result = await execa('mkdir', [projectName]);

    if (result.failed) {
      throw new Error(`There was an error when running mkdir command`);
    }
  } catch (error: any) {
    throw new Error(`Failed to create project directory: ${projectName} with error: ${error.message}`);
  }
}
