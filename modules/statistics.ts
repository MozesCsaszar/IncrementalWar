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
        let save_text = '';
        for(let i = 0; i < this.stats.length; i++) {
            save_text += this.stats[i] + '/*/';
        }
        save_text += this.overall;
        return save_text;
    }
    //returns the new i
    load(save_text, i) {
        for(let ii = 0; ii < this.stats.length; ii++) {
            this.stats[ii] = new Decimal(save_text[i]); i++;
        }
        this.overall = new Decimal(save_text[i]); i++;
        return i;
    }
};

//an object that stores all statistics under it's stats property
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
    //a function that returns the StatisticClass object corresponding to path
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
    saveRecursive(obj) {
        let save_text = String(Object.keys(obj).length);
        for(let [key, val] of Object.entries(obj)) {
            if(val.type == 'StatisticClass') {
                save_text += '/*/' + key + '/*/' + val.save();
            }
            else {
                save_text += '/*/' + key + '/*/' + this.saveRecursive(val);
            }
        }
        return save_text;
    },
    save() {
        let save_text = String(Object.keys(this.stats).length);
        for(let [key, val] of Object.entries(this.stats)) {
            save_text += '/*/' + key + '/*/' + this.saveRecursive(val);
        }
        return save_text;
    },
    //returns the value of i (the index in save_text we are currently scrying for information)
    loadRecursive(save_text, obj, i) {
        if(obj.type == 'StatisticClass') {
            i = obj.load(save_text, i);
        }
        else {
            let len = Number(save_text[i]); i++;
            for(let ii = 0; ii < len; ii++) {
                i = this.loadRecursive(save_text, obj[save_text[i]], i + 1);
            }
        }
        return i;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        let len = Number(save_text[i]); i++;
        let obj = this.stats;
        for(let ii = 0; ii < len; ii++) {
            i = this.loadRecursive(save_text, obj[save_text[i]], i + 1);
        }
    }
}

allThingsStatistics.buildTowerStats();