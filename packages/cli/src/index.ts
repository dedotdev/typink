import { createProject, promptOptions } from './utils/index.js';
import { renderIntroArt } from './utils/string.js';

export async function createTypink() {
  renderIntroArt();

  const options = await promptOptions();

  await createProject(options);

  console.log('🎉 Typink project created successfully!');
}
