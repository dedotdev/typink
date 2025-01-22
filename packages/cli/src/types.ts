export type PresetContract = 'psp22' | 'greeter' | 'base' | 'none';

export type BaseOptions = {
  projectName: string;
  installPackage: boolean;
  presetContract: PresetContract | null;
};
