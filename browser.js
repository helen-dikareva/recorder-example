const http          = require('http');
const browserTools  = require('testcafe-browser-tools');
const endpointUtils = require('endpoint-utils');

const GUID_TITLE = '7cae8e73-44eb-49d8-a275-62a333e6172f';

const WATCH_BROWSER_PAGE = `
    <html>
        <body>
            <script>
                document.title="${GUID_TITLE}";
	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', './readyToWatch', true);
	            xhr.send();
	            xhr.onreadystatechange = function() {
                    if (xhr.readyState != 4 || !xhr.responseText)
                        return;

                    window.location = xhr.responseText;
                };
	        </script>
        </body>
    </html>
`;

let resolveBrowserClosed = null;
let url                  = '';
let port                 = 0;
let currentBrowserId     = null;


const createServer = freePort => {
    port = freePort;

    http.createServer(async (req, res) => {
        const isReadyToWatch = req.url.includes('/readyToWatch');

        if (isReadyToWatch) {
            const watchedBrowserId = await browserTools.findWindow(GUID_TITLE);

            currentBrowserId = watchedBrowserId;

            browserTools.watchWindow(currentBrowserId).then(() => {
                if (currentBrowserId === watchedBrowserId) {
                    currentBrowserId = null;

                    resolveBrowserClosed();
                }
            });
        }

        res.writeHead(200, {
            'Content-Type':  isReadyToWatch ? 'text/plain' : 'text/html',
            'cache-control': 'no-cache, no-store, must-revalidate',
            'pragma':        'no-cache'
        });
        res.write(isReadyToWatch ? url : WATCH_BROWSER_PAGE);
        res.end();
    }).listen(port);
};

function run (startUrl, browser) {
    const initPromise = !port ? endpointUtils.getFreePort().then(createServer) : Promise.resolve();

    return new Promise((resolver, reject) => {
        url = startUrl;

        initPromise
            .then(() => browserTools.getBrowserInfo(browser))
            .then(browserInfo => browserTools.open(browserInfo, `http://localhost:${port}/`))
            .catch(reject);

        resolveBrowserClosed = resolver;
    });
}

async function close () {
    if (currentBrowserId) {
        const id = currentBrowserId;

        currentBrowserId = null;
        await browserTools.close(id);
    }
}

exports.run   = run;
exports.close = close;
