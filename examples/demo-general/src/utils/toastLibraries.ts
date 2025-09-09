import { toast as sonnerToast } from 'sonner';
import { toast as toastifyToast } from 'react-toastify';
import { toast as hotToast } from 'react-hot-toast';
import { SonnerAdapter, ReactToastifyAdapter, ReactHotToastAdapter, ToastAdapter } from 'typink';

export type ToastLibrary = 'sonner' | 'react-toastify' | 'react-hot-toast';

export interface ToastLibraryConfig {
  id: ToastLibrary;
  name: string;
  description: string;
  adapter: ToastAdapter;
}

// Create adapter instances
const sonnerAdapter = new SonnerAdapter(sonnerToast);
const toastifyAdapter = new ReactToastifyAdapter(toastifyToast as any);
const hotToastAdapter = new ReactHotToastAdapter(hotToast as any);

// Toast library configurations
export const toastLibraries: ToastLibraryConfig[] = [
  {
    id: 'sonner',
    name: 'Sonner',
    description: 'Modern toast notifications with smooth animations',
    adapter: sonnerAdapter,
  },
  {
    id: 'react-toastify',
    name: 'React-Toastify',
    description: 'Popular and feature-rich toast library',
    adapter: toastifyAdapter,
  },
  {
    id: 'react-hot-toast',
    name: 'React-Hot-Toast',
    description: 'Lightweight and customizable toast notifications',
    adapter: hotToastAdapter,
  },
];

// Helper function to get adapter by library ID
export function getToastAdapter(libraryId: ToastLibrary): ToastAdapter {
  const config = toastLibraries.find(lib => lib.id === libraryId);
  if (!config) {
    throw new Error(`Toast library "${libraryId}" not found`);
  }
  return config.adapter;
}

// Helper function to get library config by ID
export function getToastLibraryConfig(libraryId: ToastLibrary): ToastLibraryConfig {
  const config = toastLibraries.find(lib => lib.id === libraryId);
  if (!config) {
    throw new Error(`Toast library "${libraryId}" not found`);
  }
  return config;
}