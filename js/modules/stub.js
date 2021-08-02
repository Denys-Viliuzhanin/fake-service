import bodyParser from 'body-parser';

export default function StubModule(config, server) {
    let stubs = new Map();
    return {
        routes: [
            {
                path: "/text/:stub",
                method: "GET",
                handler: (req, res) => {
                    if (!stubs.has(req.params.stub)) {
                        console.log(`Can't find stub ${req.params.stub}`)
                        res.sendStatus(404)
                        return;    
                    }
                    let stub = stubs.get(req.params.stub)
                    res.send(stub.content).end()
                }
            },
            {
                path: "/text/:stub",
                method: "POST",
                bodyParser: bodyParser.text(),
                handler: (req, res) => {
                    console.log(`Stub (text): ${req.body}`)
                    stubs.set(req.params.stub, {
                        type: "plain/text",
                        content: req.body
                    });
                    res.end();   
                }
            }
        ]
    }
} 