

import {resolve} from 'path'
import {existsSync, mkdirSync, createWriteStream, createReadStream} from 'fs'

export default function FSModule(config, server) {

    const folders = new Map();
    if (config.fsFolders) {
        config.fsFolders.forEach(folderStr => {
            let parsedValue = folderStr.split(':')
            let folder = {
                id : parsedValue[0],
                path : parsedValue[1],
                resolvedPath : resolve(parsedValue[1]),
                exists : existsSync(parsedValue[1])
            }
            folders.set(folder.id, folder)
        })
    }
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

                    let writeStream = createWriteStream(filePath);

                    writeStream.on('error', error => {
                        res.status(500).send(error)
                        res.end()
                    })
                    // After all the data is saved, respond with a simple html form so they can post more data
                    writeStream.on('finish', function () {
                        res.status(200).end("OK")
                    });

                    req.pipe(writeStream)
                }
            },
            {
                path: '/folder/:folderId/file/:filename',
                method: 'GET',
                handler : (req, res) => {
                    if (!folders.has(req.params.folderId)) {
                        res.sendStatus(404)
                        return
                    }    
                    let folder = folders.get(req.params.folderId)
                    let filePath = resolve(folder.resolvedPath, req.params.filename)
                    if (!existsSync(filePath)) {
                        res.sendStatus(404)
                        return
                    }
                    let readStream = createReadStream(filePath)
                    readStream.on('error', error => {
                        res.status(500).send(error)
                        res.end()
                    })
                    // After all the data is saved, respond with a simple html form so they can post more data
                    readStream.on('finish', function () {
                        res.status(200).end("OK")
                    });

                    readStream.on('open', function () {
                        readStream.pipe(res);
                    });
                }
            }
        ]
    }
} 