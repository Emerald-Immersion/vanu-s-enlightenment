const cert_group = require('../commands/certs/cert_groups.js');

const cert_category = cert_group.list[0].requirements.categories[0];

const cat_name = cert_category.name(cert_category);

debugger;