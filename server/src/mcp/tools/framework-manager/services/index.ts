// @lifecycle canonical - Barrel exports for framework-manager services.
export {
  MethodologyFileWriter,
  type MethodologyFileWriterDependencies,
  type ExistingMethodologyData,
  type MethodologyFileResult,
} from './methodology-file-writer.js';
export { MethodologyValidator } from './methodology-validator.js';
export { FrameworkLifecycleProcessor } from './framework-lifecycle-processor.js';
export { FrameworkDiscoveryProcessor } from './framework-discovery-processor.js';
export { FrameworkVersioningProcessor } from './framework-versioning-processor.js';
