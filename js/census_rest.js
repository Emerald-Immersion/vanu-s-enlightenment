class census_rest {
    static async get(query, root_name, count = false) {
        const config = require('../json/config.json');
        const { get } = require('axios');
        const result = await get(`https://census.daybreakgames.com/s:${config.dbg_api.service_id}/${count ? 'count' : 'get'}/ps2:v2/${query}`).catch(error => {
            if (error.code == 'ECONNRESET') {
                console.error('ECONNRESET ' + query);
                return undefined;
            }
            console.error(error);
        });

        if (result?.data?.[root_name] != undefined) {
            return result.data[root_name];
        }
        else {
            console.error(new Error(`Root_name ${root_name} does not exist in\n:${result?.data}`));
        }
    }
}

module.exports = census_rest;