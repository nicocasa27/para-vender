// En lugar de esto:
import Default from './module';

// Si no hay un export default, usa la importación nombrada:
import { SpecificExport } from './module';

// O si realmente necesitas usar un default:
import * as Module from './module';
const Default = Module.default || Module;
