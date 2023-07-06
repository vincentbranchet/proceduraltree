import crypto from "crypto"
import fs from "fs"

export default async function routes(server, options) {
    // INDEX
    server.get('/', (request, reply) => {
        const html = fs.readFileSync('front/views/create.html')
        reply.header('Content-Type', 'text/html').send(html)
    })

    // CREATE
    server.post('/create', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    date: { type: 'string' }
                },
                required: ['name', 'date']
            }
        }
    }, (request, reply) => {
        const toHash = request.body.name + request.body.date
        const hash = crypto.createHash('md5').update(toHash).digest('hex')
        const datetime = new Date(request.body.date).toISOString().slice(0, 19).replace('T', ' ')

        server.mysql.query(
            'INSERT INTO seeds ( name, planted, hash ) VALUES (?, ?, ?)',
            [request.body.name, datetime, hash],
            (err, result) => {
                if (err)
                    reply.send(err)
                else {
                    reply.redirect('/' + hash)
                }
            }
        )
    })

    // SHOW
    server.get('/:hash', (request, reply) => {

        server.mysql.query(
            'SELECT * FROM seeds WHERE hash = ?',
            [request.params.hash],
            (err, result) => {
                if (result.length === 1) {
                    try {
                        const js = fs.readFileSync(process.env.FRONT_JS)
                        const html = fs.readFileSync('front/views/index.html')
                        const config = fs.readFileSync(process.env.BACK_CONFIG)

                        const clientJs = js.toString().replace('PLACEHOLDER_NAME', result[0].name).replace('PLACEHOLDER_BIRTHDAY', result[0].planted).replace('\"PLACEHOLDER_CONFIG\"', config)
                        const clientHtml = html.toString().replace('PLACEHOLDER_APP_CODE', clientJs).replace('PLACEHOLDER_TREE_NAME', result[0].name)

                        reply.header('Content-Type', 'text/html').send(clientHtml)
                    } catch (err) {
                        reply.send(err)
                    }
                }
            }
        )
    })

}