import {execSync} from 'child_process'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs'
import YAML from 'yaml'
import k8s from '@kubernetes/client-node'

let buildNumber = new Date().getMilliseconds()
let tag =`fake-service:${buildNumber}`

const BUILD_FOLDER = folder('./build')
const KUBER_BUILD_FOLDER = folder(`${BUILD_FOLDER}/minikube-${buildNumber}`)

processSpec('./minikube/fake-service-deployment.yml',
            `${KUBER_BUILD_FOLDER}/fake-service-deployment.yml`,
            (srcSpec) => srcSpec.spec.template.spec.containers[0].image = tag)
processSpec('./minikube/fake-service-service.yml',
            `${KUBER_BUILD_FOLDER}/fake-service-service.yml`)

exec(`docker build -t ${tag} .`)
exec(`minikube image load ${tag} `)
exec(`kubectl apply -f ${KUBER_BUILD_FOLDER}/fake-service-deployment.yml`)
exec(`kubectl apply -f ${KUBER_BUILD_FOLDER}/fake-service-service.yml`)


function exec(command) {
    console.log(`Execute: ${command}`)
    console.log("=============================================")
    execSync(
        command,
        {stdio: 'inherit'}
    )  
    console.log("=============================================")  
}

function folder(path) {
    if (!existsSync(path)) {
        mkdirSync(path)
    }
    return path;
}

function processSpec(source, target, handler) {
    let sourceSpec = loadSpec(source)
    if (handler) {
        handler(sourceSpec)
    }
    storeSpec(target, sourceSpec)
}

function loadSpec(path) {
    const spec = readFileSync(path, 'utf8')
    let doc = YAML.parseDocument(spec).toJSON()
    return doc
}

function storeSpec(path, specJson) {
    const doc = new YAML.Document();
    doc.contents = specJson;
    writeFileSync(path, doc.toString())
}
// const kc = new k8s.KubeConfig();
// kc.loadFromDefault();

// const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

