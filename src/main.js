import OS from './OS';
import Shell from './Shell';

let os = new OS();
let shell = new Shell(os);

os.startProcess(shell);
