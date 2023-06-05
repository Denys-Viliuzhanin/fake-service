
import client from 'prom-client'
import bodyParser from 'body-parser';

// Create a Registry which registers the metrics
const register = new client.Registry()
//client.collectDefaultMetrics({register});

const counter = new client.Counter({
    name: 'metric_name',
    help: 'metric_help',
  });
  counter.inc(); // Increment by 1
  counter.inc(10); // Increment by 10

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in microseconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  })

  register.registerMetric(httpRequestDurationMicroseconds)
  register.registerMetric(counter)
  

export default function ReadinessModule(config, server) {
    let metrics = new Map();
    return {
        routes: [
            {
                path: "/metrics",
                method: "GET",
                handler: async (req, res) => {
                    res.setHeader('Content-Type', register.contentType);
                      counter.inc()
                    let data = await register.metrics()
                    res.send(data)
                }
            },
            {
              path: "/metrics",
              method: "POST",
              bodyParser: bodyParser.json(),
              handler: async (req, res) => {
                req.body.forEach(metric => {
                  if (metrics.has(metric.id)) {
                    console.log(`Skip ${metric.id}`)
                    return; 
                  }
                  console.log(`Registering metric ${metric.id}`)
                  if ("counter" == metric.type) {
                    let newCounter = {
                      id: metric.id,
                      type: metric.type,
                      object: new client.Counter({
                        name: metric.id,
                        help: metric.help ? metric.help : metric.id,
                      }) 
                    }
                  } else if ("gauge" == metric.type) {
                    let newCounter = {
                      id: metric.id,
                      type: metric.type,
                      object: new client.Gauge({
                        name: metric.id,
                        help: metric.help ? metric.help : metric.id,
                        labelNames: metric.labels ? metric.labels : [],
                      }) 
                  }
                    metrics.set(newCounter.id, newCounter);
                    register.registerMetric(newCounter.object)
                  }
                })
                res.end();     
              }
          },
            {
              path: "/values",
              method: "POST",
              bodyParser: bodyParser.json(),
              handler: async (req, res) => {
                req.body.forEach(metricReq => {
                  if (!metrics.has(metricReq.id)) {
                    console.log(`Can't find metric ${metricReq.id}`)
                    return; 
                  }
                  let metric = metrics.get(metricReq.id);
                  if ("counter" == metric.type) {
                    metric.object.inc();    
                  } else if ("gauge" == metric.type) {
                    metric.object.set(metricReq.labels, metricReq.value);
                  }
                })
                res.end();     
              }
          },
          {
            path: "/metrics/:id",
            method: "POST",
            bodyParser: bodyParser.json(),
            handler: async (req, res) => {
              if (!metrics.has(req.params.id)) {
                console.log(`Can't find metric ${req.params.id}`)
                res.sendStatus(404)
                return; 
              }
              let metric = metrics.get(req.params.id);
              if ("counter" == metric.type) {
                metric.object.inc();    
              } else if ("gauge" == metric.type) {
                metric.object.set(req.body.labels, req.body.value);
              }
              res.end();     
            }
        }
        ]
    }
} 