const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolveSrv('_mongodb._tcp.cluster0.mcqjjgz.mongodb.net', (err, addresses) => {
    console.log('SRV with Google DNS:', addresses, err ? err.message : '');
});
