
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import {ExpressServer} from './server.js'
import Readiness from './modules/readiness.js'
import FS from './modules/fs.js'

const argv = yargs(hideBin(process.argv))
                                        .usage("Usage: [options]")
                                        .options({
                                            'h' : {
                                                alias : 'help',
                                                describe: 'show help'
                                            },
                                            'p' : {
                                                alias: 'port',
                                                describe: 'HTTP port which service listens',
                                                default: 8080
                                            },
                                            'm' : {
                                                alias: 'modules',
                                                describe: 'List of modules to be activated. By default only readiness module is active',
                                                array: true,
                                                type: 'string'
                                            },
                                            'fs-folders' : {
                                                describe : 'Specifies list of folders to be access via FS module',
                                                array: true,
                                                type: 'string',
                                                default: []
                                            }
                                         })
                                        .help()
                                        .fail(function(msg) {
                                             console.error(msg)
                                             yargs.showHelp()
                                         })
                                        .argv

const MODULES = new Map(Object.entries({
    'fs': FS   
}))

let server = new ExpressServer(argv)

const allowedModules = new Set(argv.modules)
MODULES.forEach((m,id)=>{
    if (allowedModules.has(id)) {
        server.addModule(id, m);
    }
})
//Default modules
server.addModule('readiness', Readiness)
//Start server
server.start();
