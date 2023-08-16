/*  A module which will store statistical data of your game, such as equipment bought this run and equipment bought overall */


//a class which stores data in a list and conveniently gives access to it as well
//currently has
class StatisticClass {
    static levelToIndex = {'base' : 0};
    constructor() {
        //each index corresponds to a different level of resets, starting from base to the latest
        this.stats = [new Decimal(0)];
        this.overall = new Decimal(0);
    }
    get type() {
        return 'StatisticClass';
    }
    add(amount) {
        for(let i = 0; i < this.stats.length; i++) {
            this.stats[i] = this.stats[i].add(amount);
        }
        this.overall = this.overall.add(amount);
    }
    setToMax(amount) {
        for(let i = 0; i < this.stats.length; i++) {
            this.stats[i] = this.stats[i].max(amount);
        }
        this.overall = this.overall.max(amount);
    }
    //levels: base, overall
    getStatistics(level) {
        if(level == 'overall') {
            return this.overall;
        }
        else {
            return this.stats[StatisticClass.levelToIndex[level]];
        }
    }
    //reset everything except overall number to 0
    reset(level) {
        let len = level == 'overall' ? this.stats.length : StatisticClass.levelToIndex[level] + 1;
        for(let i = 0; i < len; i++) {
            this.stats[i] = new Decimal(0);
        }
        if(level == 'overall') {
            this.overall == new Decimal(0);
        }
    }
    save() {
        let saveText = '';
        for(let i = 0; i < this.stats.length; i++) {
            saveText += this.stats[i] + '/*/';
        }
        saveText += this.overall;
        return saveText;
    }
    //returns the new i
    load(saveText, i) {
        for(let ii = 0; ii < this.stats.length; ii++) {
            this.stats[ii] = new Decimal(saveText[i]); i++;
        }
        this.overall = new Decimal(saveText[i]); i++;
        return i;
    }
};

//an thisect that stores all statistics under it's stats property
const allThingsStatistics = {
    stats : {
        'StorePage' : {
            'creatures': {
                'Human' : new StatisticClass(),
            },
            'weapons': {
                'Knife' : new StatisticClass(),
                'Dagger' : new StatisticClass(),
                'Longsword' : new StatisticClass(),
            },
        },
        'Player' : {
            'armies' : {
                0 : {
                    'Attack' : new StatisticClass(),
                },
                1 : {
                    'Attack' : new StatisticClass(),
                },
                2 : {
                    'Attack' : new StatisticClass(),
                },
                'all' : {
                    'Attack' : new StatisticClass(),
                }
            }
        },
        'Tower' : [],
    },
    buildTowerLevel(floor_nr, level_nr) {
        this.stats['Tower'][floor_nr][level_nr] = {};
        let level = this.stats['Tower'][floor_nr][level_nr];
        let level_stats = ['times_visited'];
        for(let i = 0; i < level_stats.length; i++) {
            level[level_stats[i]] = new StatisticClass();
        }
    },
    buildTowerStats() {
        let nr_floors = 1;
        let levels_per_floor = [9];
        for(let i = 0; i < nr_floors; i++) {
            this.stats['Tower'].push([]);
            for(let j = 0; j < levels_per_floor[i]; j++) {
                this.buildTowerLevel(i, j);
            }
        }
    },
    //a function that returns the StatisticClass thisect corresponding to path
    getStatsFromPath(path) {
        let stats = this.stats;
        for(let elem of path) {
            stats = stats[elem];
        }
        return stats;
    },
    //functions which change statistics, then unlock new stuff if needed
    //they return the value true if an unlock was made, false otherwise
    addToStatistics(path, amount) {
        this.getStatsFromPath(path).add(amount);
        return UH.doUnlock(path);
    },
    setStatisticsToMax(path, amount) {
        this.getStatsFromPath(path).setToMax(amount);
        return UH.doUnlock(path);
    },
    getStatistics(path, level) {
        return this.getStatsFromPath(path).getStatistics(level);
    },
    saveRecursive(this) {
        let saveText = String(Object.keys(this).length);
        for(let [key, val] of Object.entries(this)) {
            if(val.type == 'StatisticClass') {
                saveText += '/*/' + key + '/*/' + val.save();
            }
            else {
                saveText += '/*/' + key + '/*/' + this.saveRecursive(val);
            }
        }
        return saveText;
    },
    save() {
        let saveText = String(Object.keys(this.stats).length);
        for(let [key, val] of Object.entries(this.stats)) {
            saveText += '/*/' + key + '/*/' + this.saveRecursive(val);
        }
        return saveText;
    },
    //returns the value of i (the index in saveText we are currently scrying for information)
    loadRecursive(saveText, this, i) {
        if(this.type == 'StatisticClass') {
            i = this.load(saveText, i);
        }
        else {
            let len = Number(saveText[i]); i++;
            for(let ii = 0; ii < len; ii++) {
                i = this.loadRecursive(saveText, this[saveText[i]], i + 1);
            }
        }
        return i;
    },
    load(saveText) {
        saveText = saveText.split('/*/');
        let i = 0;
        let len = Number(saveText[i]); i++;
        let this = this.stats;
        for(let ii = 0; ii < len; ii++) {
            i = this.loadRecursive(saveText, this[saveText[i]], i + 1);
        }
    }
}

allThingsStatistics.buildTowerStats();