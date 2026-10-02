// Entry point: starts the web server.
const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`Taxi system is running at http://localhost:${config.port}`);
});
