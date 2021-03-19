const path = require('path');
class paths {
    constructor() {
        this.paths = {};

        // The working directory
        this.paths.working_dir = process.cwd();

        // The individual directories
        this.paths.dirs = {};
        this.paths.dirs.json = path.join(this.paths.working_dir, 'json');
        this.paths.dirs.js = path.join(this.paths.working_dir, 'js');
        this.paths.dirs.scripts = path.join(this.paths.working_dir, 'scripts');
        this.paths.dirs.commands = path.join(this.paths.working_dir, 'commands');
        this.paths.dirs.chart = path.join(this.paths.dirs.js, 'chart');

        // Filepaths
        this.paths.files = {};

        // JSON related paths
        this.paths.files.config = path.join(this.paths.dirs.json, 'config.json');
        this.paths.files.constants = path.join(this.paths.dirs.json, 'constants.json');
        this.paths.files.loadouts = path.join(this.paths.dirs.json, 'loadouts.json');

        // JS related paths
        this.paths.files.lieutenant_item_requirement = path.join(this.paths.dirs.js, 'lieutenant_item_requirement.js');
        this.paths.files.worlds = path.join(this.paths.dirs.js, 'worlds.js');
        this.paths.files.zones = path.join(this.paths.dirs.js, 'zones.js');
    }
    returnPaths() {
        return this.paths;
    }
}


module.exports = new paths().returnPaths();
