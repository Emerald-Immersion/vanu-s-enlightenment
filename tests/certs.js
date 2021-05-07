const certs = require('../commands/certs');

async function main() {
    const brakenium_chosen = new certs.requirement_obj('Chosen', 'brakenium');
    await brakenium_chosen.build();
    // debugger;
    const xHav0kx_chosen = new certs.requirement_obj('Chosen', 'PrettylnPinkUwU');
    await xHav0kx_chosen.build();
    debugger;
}

main();