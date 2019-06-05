const createTestCafe = require('testcafe');
const embeddingUtils = require('testcafe').embeddingUtils;
const { run, close } = require('./browser');

let testcafe = null;

async function handleClosing (err) {
    console.log(err);
    await close();
    testcafe.close();
    process.exit();
}

createTestCafe()
    .then(tc => {
        testcafe = tc;

        return testcafe.createBrowserConnection();
    })
    .then(connection => {
        const testCafeRunner = testcafe.createRunner();

        connection.once('ready', () => {
            testCafeRunner
                .src('./recorded-examples.testcafe')
                .browsers(connection)
                .run()
                .then(() => handleClosing())
                .catch(async error => {
                    console.log('testCafeRunner.run');
                    return handleClosing(error)
                });
        });

        connection.once('disconnected', () => {
            console.log('browserDisconnected');
            connection.suppressError();
        });

        run(connection.url, 'chrome')
            .then(() => handleClosing())
            .catch(async error => {
                console.log('runBrowser');
                return handleClosing(error)
            });
    });
