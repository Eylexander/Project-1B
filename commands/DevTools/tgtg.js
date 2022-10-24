const axios = require('axios');
const _ = require('lodash');

module.exports.help = {
    name : "tgtg",
    description: 'TooGoodToGo notify app',
    aliases : ['tgtg'],
    usage : '[Information]'
};

module.exports.execute = async (client, message, args) => {
    const api = axios.create({
        baseURL: "https://apptoogoodtogo.com/api/",
        headers: _.defaults(config.get("api.headers"), {
          "User-Agent":
            "TooGoodToGo/21.9.0 (813) (iPhone/iPhone 7 (GSM); iOS 15.1; Scale/2.00)",
          "Content-Type": "application/json",
          Accept: "",
          "Accept-Language": "fr-FR",
          "Accept-Encoding": "gzip",
        }),
        responseType: "json",
        resolveBodyOnly: true,
    });
    
    api.defaults.headers
};