var express = require('express')
let bodyParser = require('body-parser')
let helmet = require('helmet')
let BrCode = require('./lib/br_code')
let pino = require('pino-http')()
let QRCode = require('qrcode')

const app = express();

app.use(helmet());
app.use(pino);
app.use(bodyParser.json());

const port = process.env.PORT || 8000;
const QR_CODE_SIZE = 400;

const contentSecurityPolicy = ["script-src 'self' 'nonce-2726c7f26c' www.googletagmanager.com",].join(";");

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", contentSecurityPolicy);
    next();
});

app.post('/pix', (req, res) => {
    var { key, amount, name, reference, key_type, city } = req.body

    if (key) {
        const brCode = new BrCode(key, amount, name, reference, key_type, city);

        var code = brCode.generate_qrcp()

        QRCode.toDataURL(code, { width: QR_CODE_SIZE, height: QR_CODE_SIZE })
            .then(qrcode => {
                res.json({
                    qrcode_base64: qrcode,
                    code: code,
                    key_type: brCode.key_type,
                    key: brCode.key,
                    amount: brCode.amount,
                    name: brCode.name,
                    city: brCode.city,
                    reference: brCode.reference,
                    formated_amount: brCode.formated_amount()
                })
            })

            .catch(err => {
                console.error(err)
            })
    }
    else {
        res.status(422);
        res.json({ error: "Campo Key não presente" });
    }
});

app.post('/qrcode', (req, res) => {
    var { data } = req.body
    data.toString()
    if (data) {
        QRCode.toDataURL(data, { width: QR_CODE_SIZE, height: QR_CODE_SIZE }, function (err, url) {
            res.json(url);
        })
    }

    else {
        res.status(422);

    }
});

app.listen(port, () => {
    console.log(`Starting server on port ${port}!`)
});
