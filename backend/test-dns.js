const dns = require('dns');
dns.lookup('cluster0.mcqjjgz.mongodb.net', (err, address, family) => {
    console.log('cluster0:', address, family, err ? err.message : '');
});
dns.resolveSrv('_mongodb._tcp.cluster0.mcqjjgz.mongodb.net', (err, addresses) => {
    console.log('SRV:', addresses, err ? err.message : '');
    if (addresses && addresses.length > 0) {
        dns.lookup(addresses[0].name, (err, address, family) => {
            console.log('Node 0:', address, family, err ? err.message : '');
        });
    }
});
