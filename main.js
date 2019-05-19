const http = require('http');
const turndown = require('turndown');

let convert = (html) => {
    let turndownService = new turndown({
        'headingStyle': 'atx',
        'hr': '---',
        'bulletListMarker': '*',
        'codeBlockStyle': 'fenced',
        'fence': '```',
        'emDelimiter': '*',
        'strongDelimiter': '**',
        'linkStyle': 'inlined',
        'linkReferenceStyle': 'full',
    });
    turndownService.addRule('removeThumbsup', {
        filter: (node, options) => {
            return ('DIV' == node.nodeName
                && node.getAttribute('class')
                && node.getAttribute('class').includes('book-article-kb-star')
                || 'A' == node.nodeName
                && node.getAttribute('class')
                && node.getAttribute('class').includes('star_count'));
        },
        replacement: (content, node, options) => {
            return '';
        },
    }).addRule('fixImageLink', {
        filter: (node, options) => {
            return ('A' == node.nodeName
                && node.getAttribute('class')
                && node.getAttribute('class').includes('fluidbox fluidbox__instance')
                && node.getAttribute('href')
                && node.getAttribute('href').includes('https://')
                && node.getAttribute('href').includes('uploads/images'));
        },
        replacement: (content, node, options) => {
            return content;
        },
    }).addRule('removeCopyright', {
        filter: (node, options) => {
            return ('DIV' == node.nodeName
                && node.getAttribute('style')
                && node.getAttribute('style').includes('overflow: hidden;'));
        },
        replacement: (content, node, options) => {
            return '';
        },
    });

    return turndownService.turndown(html) + "\n";
};

http.createServer((req, res) => {
    res.setHeader('Connection', 'close');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin','*');

    switch (req.url) {
        case '':
        case '/':
            if ('POST' == req.method) {
                let body = [];
                req.on('error', (err) => {
                    console.err(err);
                }).on('data', (chunk) => {
                    let maxLength = 1 << 24; // 16MB
                    if (chunk.length > maxLength) {
                        req.connection.destroy();
                        return;
                    }
                    body.push(chunk);
                }).on('end', () => {
                    let html = Buffer.concat(body).toString();
                    console.log(`input size: ${html.length} B`);
                    if (0 == html.trim().length) {
                        res.statusCode = 204;
                        res.end(null);
                        return;
                    }
                    let md = convert(html);
                    console.log(`output size: ${md.length} B`);
                    res.statusCode = 200;
                    res.end(md);
                });
            } else {
                res.statusCode = 405;
                res.end('Invalid request');
            }
            break;
        default:
            res.statusCode = 404;
            res.end(null);
            break;
    }
}).listen(9999);
