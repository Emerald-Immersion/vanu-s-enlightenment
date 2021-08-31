module.exports = async function(config, args, settings) {
    const mariadb = require('mariadb');
    const { CanvasRenderService } = require('chartjs-node-canvas');
    const db_conn = mariadb.createConnection({ host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port });
    const canvasRenderService = new CanvasRenderService(settings.width, settings.height, (ChartJS) => {
        ChartJS.plugins.register({
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = 'rgba(250, 250, 250, 1)';
                ctx.fillRect(0, 0, settings.width, settings.height);
                ctx.restore();
            },
        });
    });

    const configuration = {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Indar',
                backgroundColor: 'rgba(231, 184, 154, 0.4)',
                data: [],
            },
            {
                label: 'Hossin',
                backgroundColor: 'rgba(74, 116, 94, 0.4)',
                data: [],
            },
            {
                label: 'Amerish',
                backgroundColor: 'rgba(115, 196, 106, 0.4)',
                data: [],
            },
            {
                label: 'Esamir',
                backgroundColor: 'rgba(230, 230, 230, 0.4)',
                data: [],
            }],
        },
        borderColor: 'rgba(0, 0, 0, 0.7)',
        borderWidth: 1,
        options: {
            scales: {
                yAxes: [{
                    stacked: true,
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'hour',
                    },
                }],
            },
        },
    };

    let hours_back;
    if (Number.isNaN(parseInt(args[1]))) {
        hours_back = '24';
    }
    else {
        hours_back = args[1];
    }
    const SQL_data = await (await db_conn).query(`
    SELECT
        *
    FROM
        continent_population
    WHERE
        continent_population.timestamp >= NOW() - INTERVAL ${hours_back} HOUR
    ORDER BY
        continent_population.timestamp
    DESC
    `);

    (await db_conn).end();

    for (const obj of SQL_data) {
        configuration.data.labels.push(obj.timestamp);
        configuration.data.datasets[0].data.push({ x: obj.timestamp, y: obj.indar_vs + obj.indar_nc + obj.indar_tr + obj.indar_ns });
        configuration.data.datasets[1].data.push({ x: obj.timestamp, y: obj.hossin_vs + obj.hossin_nc + obj.hossin_tr + obj.hossin_ns });
        configuration.data.datasets[2].data.push({ x: obj.timestamp, y: obj.amerish_vs + obj.amerish_nc + obj.amerish_tr + obj.amerish_ns });
        configuration.data.datasets[3].data.push({ x: obj.timestamp, y: obj.esamir_vs + obj.esamir_nc + obj.esamir_tr + obj.esamir_ns });
    }

    return {
        msg_txt: `Showing ${hours_back} hours of population data:`,
        stream: canvasRenderService.renderToStream(configuration),
    };
};