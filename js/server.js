

import express from 'express'

export class ExpressServer {

    constructor (config) {
        this.config = config ? config : {}
        this.app = express()
        this.port = config.port
        this.modules = new Map()
    }

    start() {

        this.modules.forEach((moduleDef, id) => {
            console.log(`Module: ${id}`)
            let def = moduleDef(this.config, this)

            let moduleRouter = express.Router()
            def.routes.forEach(r => {
                if ("GET" == r.method) {
                    moduleRouter.get(r.path, r.handler)
                } else if ("POST" == r.method) {
                    if (r.bodyParser) {
                        moduleRouter.post(r.path, r.bodyParser, r.handler)
                    } else {
                        moduleRouter.post(r.path, r.handler)
                    }
                }
            })
            this.app.use('/' + id, moduleRouter)
        })

        this.app.listen(this.port, () => {
            console.log(`Fake service listening on port ${this.port}!`)
        });    
    }

    addModule(id, moduleDef) {
        this.modules.set(id, moduleDef)
    }

    onGet(path, handler) {
        this.app.get(path, handler)
    }
}
