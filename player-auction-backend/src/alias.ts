import path from 'node:path';
import { addAlias } from 'module-alias';

const currentDir = __dirname;

const aliases = {
  '@config': path.join(currentDir, 'config'),
  '@models': path.join(currentDir, 'models'),
  '@repositories': path.join(currentDir, 'repositories'),
  '@services': path.join(currentDir, 'services'),
  '@controllers': path.join(currentDir, 'controllers'),
  '@routes': path.join(currentDir, 'routes'),
  '@middleware': path.join(currentDir, 'middleware'),
  '@sockets': path.join(currentDir, 'sockets'),
  '@events': path.join(currentDir, 'events'),
  '@validators': path.join(currentDir, 'validators'),
  '@utils': path.join(currentDir, 'utils'),
  '@constants': path.join(currentDir, 'constants'),
};

Object.entries(aliases).forEach(([alias, target]) => {
  addAlias(alias, target);
});
