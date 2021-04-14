

import {resolve} from 'path'
import {existsSync, mkdirSync, createWriteStream} from 'fs'

export default function FSModule(config, server) {

    const folders = new Map();

    config.fsFolder.forEach(folderStr => {
        let parsedValue = folderStr.split(':')
        let folder = {
            id : parsedValue[0],
            path : parsedValue[1],
            resolvedPath : resolve(parsedValue[1]),
            exists : existsSync(parsedValue[1])
        }
        folders.set(folder.id, folder)
    })
    console.log('Folders:', Array.from(folders.values()))
    
    return {
        routes: [
            {
                path: '/folders',
                method: 'GET',
                handler : (req, res) => {
                    res.setHeader('content-type', 'application/json');
                    let response = {
                        folders: Array.from(folders.values())
                    }
                    //update status of existance
                    response.folders.forEach(folder => {
                        folder.exists = existsSync(folder.resolvedPath)
                    })
                    res.send(JSON.stringify(response))
                }
            },
            {
                path: '/folder/:folderId/file/:filename',
                method: 'POST',
                handler : (req, res) => {
                    if (!folders.has(req.params.folderId)) {
                        res.sendStatus(404)
                        return
                    }
                    let folder = folders.get(req.params.folderId)
                    if (!existsSync(folder.resolvedPath)) {
                        mkdirSync(folder.resolvedPath, {recursive: true})
                    }
                    let filePath = resolve(folder.resolvedPath, req.params.filename)
                    req.pipe(createWriteStream(filePath))
                    res.send('OK')
                }
            }
        ]
    }
} 