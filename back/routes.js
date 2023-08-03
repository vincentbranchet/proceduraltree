import crypto from "crypto"
import fs from "fs"
import Stripe from 'stripe'

export default async function routes(server, options) {
    // INDEX
    server.get('/', (request, reply) => {
        const html = fs.readFileSync('front/views/create.html')
        reply.header('Content-Type', 'text/html').send(html)
    })

    // CGV
    server.get('/cgv', (request, reply) => {
        try {
            const html = fs.readFileSync('front/views/cgv.html')

            reply.header('Content-Type', 'text/html').send(html)
        } catch (err) {
            reply.send(err)
        }
    })

    // Mentions légales
    server.get('/mentions', (request, reply) => {
        try {
            const html = fs.readFileSync('front/views/mentions.html')

            reply.header('Content-Type', 'text/html').send(html)
        } catch (err) {
            reply.send(err)
        }
    })

    // CHECKOUT - Process
    server.post('/checkout', async (request, reply) => {
        const stripe = new Stripe(process.env.STRIPE_API_KEY)
        const { name, date } = request.body

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    // Virtualyptus - 14,99€
                    price: process.env.STRIPE_PRODUCT_KEY,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://${process.env.HOST_NAME}/checkout-success?name=${name}&date=${date}`,
            cancel_url: `http://${process.env.HOST_NAME}/`,
        });

        reply.redirect(303, session.url);
    })

    // CHECKOUT - Success
    server.get('/checkout-success', (request, reply) => {
        const { name, date } = request.query

        try {
            const toHash = name + date
            const hash = crypto.createHash('md5').update(toHash).digest('hex')
            const datetime = new Date(date).toISOString().slice(0, 19).replace('T', ' ')

            server.mysql.query(
                'INSERT INTO seeds ( name, planted, hash ) VALUES (?, ?, ?)',
                [name, datetime, hash],
                (err, result) => {
                    if (err)
                        reply.send(err)
                    else {
                        // TODO : add 'first_sight' param
                        reply.redirect('/' + hash)
                    }
                }
            )
        } catch (err) {
            reply.send(err)
        }
    })

    // SHOW
    server.get('/:hash', (request, reply) => {
        const { first_sight } = request.query
        // if first_sight is true, then show popup in html template
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