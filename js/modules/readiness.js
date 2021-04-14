
export default function ReadinessModule(config, server) {
    return {
        routes: [
            {
                path: "/status",
                method: "GET",
                handler: (req, res) => {
                    res.send("OK")    
                }
            }
        ]
    }
} 