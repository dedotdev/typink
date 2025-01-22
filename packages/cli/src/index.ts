import { createProject, promptOptions } from './utils/index.js';

export async function createTypink() {
  const options = await promptOptions();
  createProject(options);
}
