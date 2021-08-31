module.exports = async function(config, args) {
    const mariadb = require('mariadb');
    const { CanvasRenderService } = require('chartjs-node-canvas');
    const db_conn = mariadb.createConnection({ host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port });
    const canvasRenderService = new CanvasRenderService(1920, 1080, (ChartJS) => {
        ChartJS.plugins.register({
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = 'rgba(250, 250, 250, 1)';
                ctx.fillRect(0, 0, 1920, 1080);
                ctx.restore();
            },
        });
    });

    const configuration = {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'VS',
                backgroundColor: '#830afc',
                data: [0],
            },
            {
                label: 'NC',
                backgroundColor: '#0a36fc',
                data: [0],
            },
            {
                label: 'TR',
                backgroundColor: '#fc0e0a',
                data: [0],
            }],
        },
        options: {
        },
    };

    let months_back;
    if (Number.isNaN(parseInt(args[2]))) {
        months_back = 1;
    }
    else {
        months_back = parseInt(args[2]);
    }

    const SQL_data = await (await db_conn).query(`
    SELECT
        *
    FROM
        metagame_events
    WHERE
        metagame_events.timestamp >= NOW() - INTERVAL ${months_back} MONTH
        AND
        metagame_event_state_name = 'ended'
    ORDER BY
        metagame_events.timestamp
    DESC
    `);

    (await db_conn).end();

    configuration.data.labels = [`Total wins per faction over ${months_back} month`];
    for (const obj of SQL_data) {
        const indexOfWinner = await [obj.faction_vs, obj.faction_nc, obj.faction_tr].reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
        configuration.data.datasets[indexOfWinner].data[0]++;
    }

    console.log(configuration.data.datasets[0].data);
    console.log(configuration.data.datasets[1].data);
    console.log(configuration.data.datasets[2].data);

    return {
        msg_txt: `Showing wins per faction for ${months_back} months data:`,
        stream: canvasRenderService.renderToStream(configuration),
    };
};