// En lugar de esto:
export * from './otherModule';

// Cambia a algo como esto:
export * from './otherModule';
export { default } from './otherModule';
