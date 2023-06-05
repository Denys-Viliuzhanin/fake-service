
// https://www.npmjs.com/package/@azure/service-bus

import { ServiceBusClient } from '@azure/service-bus';
import bodyParser from 'body-parser';




export default function AzureServiceBusModule(config, server) {

    let clients = new Map();

    return {
        routes: [
            {
                path: '/client',
                method: 'POST',
                bodyParser: bodyParser.json(),
                handler : (req, res) => {
                    let clientId = req.body.clientId 
                    let connectionString = req.body.connectionString

                    if (clients.has(clientId)) {
                        res.statusMessage = "Client already exists. Pick another name.";
                        res.status(400).end();
                        return 
                    } 

                    if (!connectionString) {
                        res.statusMessage = "Connection string is required.";
                        res.status(400).end();
                        return
                    }

                    clients.set(clientId, new Client(clientId, connectionString));
                    res.send(`Client created" ${clientId}`)
                }
            },
            {
                path: '/client/:clientId',
                method: 'DELETE',
                bodyParser: bodyParser.json(),
                handler : (req, res) => {
                    let clientId = req.params.clientId;
                    if (!clients.has(clientId)) {
                        res.statusMessage = "Unknown client id";
                        res.status(404).end();
                        return 
                    } 

                    clients.delete(clientId)
                    res.send(`Client deleted: ${clientId}`)
                }
            },
            {
                path: '/client/:clientId/target',
                method: 'POST',
                bodyParser: bodyParser.json(),
                handler : (req, res) => {
                    let clientId = req.params.clientId;
                    let target = req.body.target;
                    if (!clients.has(clientId)) {
                        res.statusMessage = "Unknown client id";
                        res.status(404).end();
                        return 
                    } 
                    let client = clients.get(clientId);
                    if (client.getTarget(target)) {
                        res.statusMessage = "Duplicated target";
                        res.status(404).end();
                        return 
                    }

                    client.connectTarget(target);
                    res.send(`Target connected : ${clientId} to ${target}`)
                }
            },
            {
                path: '/client/:clientId/target/:target',
                method: 'POST',
                bodyParser: bodyParser.json(),
                handler : async (req, res) => {
                    let clientId = req.params.clientId;
                    let target = req.params.target;

                    let message = req.body.message;

                    if (!clients.has(clientId)) {
                        res.statusMessage = "Unknown client id";
                        res.status(404).end();
                        return 
                    } 
                    if (!target) {
                        res.statusMessage = "Target is not specified";
                        res.status(400).end();
                        return 
                    }
                    let client = clients.get(clientId);
                    if (!client.getTarget(target)) {
                        res.statusMessage = "Unknown target";
                        res.status(404).end();
                        return 
                    }
                    
                    client.sendMessage(target, message);

                    res.send(`Message sent : ${clientId} to ${target}`)
                }
            },
            {
                path: '/client/:clientId/source',
                method: 'POST',
                bodyParser: bodyParser.json(),
                handler : (req, res) => {
                    let clientId = req.params.clientId;
                    let source = req.body.source;
                    if (!clients.has(clientId)) {
                        res.statusMessage = "Unknown client id";
                        res.status(404).end();
                        return 
                    } 
                    let client = clients.get(clientId);
                    if (client.getSource(source)) {
                        res.statusMessage = "Duplicated target";
                        res.status(404).end();
                        return 
                    }

                    client.connectSource(source);
                    res.send(`Source connected : from ${source} to ${clientId}`)
                }
            },
            {
                path: '/client/:clientId/source/:source',
                method: 'GET',
                handler : async (req, res) => {
                    let clientId = req.params.clientId;
                    let source = req.params.source;

                    if (!clients.has(clientId)) {
                        res.statusMessage = "Unknown client id";
                        res.status(404).end();
                        return 
                    } 
                    if (!source) {
                        res.statusMessage = "Source is not specified";
                        res.status(400).end();
                        return 
                    }
                    let client = clients.get(clientId);
                    if (!client.getSource(source)) {
                        res.statusMessage = "Unknown target";
                        res.status(404).end();
                        return 
                    }
                    
                    let message = await client.receiveMessage(source);
                    if (!message) {
                        res.statusMessage = "No messages available";
                        res.status(444).end();
                        return  
                    }

                    if (!req.params.complete || req.params.complete) {
                        await client.completeMessage(source, message);
                    }

                    res.setHeader('content-type', 'application/json');
                    res.send(JSON.stringify({
                        messageId: message.messageId,
                        body: message.body
                    })).end();
                }
            }
        ]
    }
}

class Client {
    constructor(id, connectionString) {
        this._id = id
        this._coonnectionString = connectionString
        this._client = new ServiceBusClient(connectionString);
        this._targets = new Map();
        this._sources = new Map();
    }

    connectTarget(targetId) {
        this._targets.set(targetId, this._client.createSender(targetId))
    }

    connectSource(sourceId) {
        this._sources.set(sourceId, this._client.createReceiver(sourceId));
    }

    getTarget(targetId) {
        return this._targets.get(targetId);
    }

    getSource(sourceId) {
        return this._sources.get(sourceId);
    }

    async sendMessage(targetId, message) {
        let sender = this.getTarget(targetId);
        return sender.sendMessages({
            body: message
        })
    }

    async receiveMessage(sourceId) {
        let receiver = this._sources.get(sourceId);
        let list = await receiver.receiveMessages(1);
        return list.length > 0 ? list[0] : null
    }

    async completeMessage(sourceId, message) {
        let receiver = this._sources.get(sourceId);
        receiver.completeMessage(message);
    }
}