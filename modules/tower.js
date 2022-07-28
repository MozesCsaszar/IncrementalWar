class TowerFloor {
    constructor(levels = [], name = '', desc = '', raided_levels = []) {
        this.levels = levels;
        this.name = name;
        this.desc = desc;
        this.raided_levels = raided_levels;
    }

    display(nr_floor) {
        //hide which is not needed, then show which is needed
        let j = TowerPage.Tower.floors[nr_floor].levels.length;
        while(j < TowerPage.towerLevels.length) {
            TowerPage.towerLevels[j].hidden = true;
            j++;
        };
        j = 0;
        while(j < TowerPage.Tower.floors[nr_floor].levels.length) {
            //only show if it is unlocked
            TowerPage.towerLevels[j].hidden = !(IsUnlocked['towerLevels'][nr_floor][j]);
            j++;
        };
        //color by availability and set position
        j = 0;
        while(j < TowerPage.Tower.floors[nr_floor].levels.length) {
            TowerPage.towerLevels[j].style.background = TowerPage.Tower.floors[nr_floor].levels[j].get_color();
            TowerPage.towerLevels[j].style.width = TowerPage.Tower.floors[nr_floor].levels[j].width;
            TowerPage.towerLevels[j].style.height = TowerPage.Tower.floors[nr_floor].levels[j].height;
            TowerPage.towerLevels[j].style.top = TowerPage.Tower.floors[nr_floor].levels[j].top;
            TowerPage.towerLevels[j].style.left = TowerPage.Tower.floors[nr_floor].levels[j].left;
            TowerPage.towerLevels[j].style.zIndex = TowerPage.Tower.floors[nr_floor].levels[j].z_index;
            j++;
        }
        //display floor info
        TowerPage.towerInfo.innerHTML = this.get_text();
    };

    get_text() {
        return '<b>' + this.name + '</b><br>' + 
        '<br><i>' + this.desc + '</i>';
    }

    
};

class ParentTowerLevel {
    constructor(width, height, top, left, z_index, capacity, unlocks, name, desc, raiding_army) {
        this.width = width;
        this.height = height;
        this.top = top;
        this.left = left;
        this.capacity = capacity;
        this.raiding_army = raiding_army;
        this.name = name;
        this.desc = desc;
        this.z_index = z_index;
        this.unlocks = unlocks;
        //it is to prevent trying to unlock multiple times the unlocks
        this.unlocked_next_levels = false;
    }

    display(floor_name, floor_nr, level_nr) {
        TowerPage.towerInfo.innerHTML = this.get_text(floor_name, floor_nr, level_nr);
    }
}

//the level class that makes up the tower floors (a floor consists of one or more levels)
class TowerLevel extends ParentTowerLevel {
    constructor(width, height, top, left, z_index, stats, capacity, gold_per_power, unlocks = [], name = '', desc = '', raiding_army = -1) {
        super(width, height, top, left, z_index, capacity, unlocks, name, desc, raiding_army);

        this.gold_per_power = gold_per_power;
        this.stats = stats;
        this.type = 'Raid';
    }

    get goldPerSecond() {
        return (Player.armies[this.raiding_army].size.min(this.capacity)).mul(this.gold_per_power).mul(Player.armies[this.raiding_army].power);
    }

    get_color() {
        let def_power = this.stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(this.stats, 'Attack', 'Defense');
        if(atk_power.lt(def_power)) {
            return 'var(--disabled-tower-level-background-color)';
        }
        else {
            return 'var(--default-tower-level-background-color)';
        }
    }

    tick(nr_ticks) {
        Player.gold = Player.gold.add(this.goldPerSecond.div(new Decimal(nr_ticks)));
    }

    get_text(floor_name) {
            return '<b>' + floor_name + ' - ' + this.name + '</b><br>' + 
            '<i>Type: ' + this.type + '</i><br>' +
            'Raided by: ' + (this.raiding_army == -1 ? 'None' : this.raiding_army + 1) + '<br>' +
            'Defense: ' + this.stats.Defense.get_text() + '<br>' +
            'Capacity: ' + StylizeDecimals(this.capacity,true) + 
            '<br>' + 'Gold per power: ' + StylizeDecimals(this.gold_per_power) + '<br>' +
            '</br><i>' + this.desc + '</i>';
    }

    raid(level_nr, ) {
        /*
            Input:  level_nr: the number of the level in the current floor
            Output: the number of the level this army was raiding before this floor
                    -1 if ther was no such army
        */
        //get attacking and defensive power respective to this tower level
        let def_power = this.stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(this.stats, 'Attack', 'Defense');
        //last level raided by same army
        let last_one = -1;
        if(def_power.lte(atk_power)) {
            //if it is the same army raiding it then to which you are trying to set it, then remove that army
            if(this.raiding_army == TowerPage.currentArmy) {
                this.raiding_army = -1;
                Player.armies[TowerPage.currentArmy].raiding = -1;
                //remove the problematic element from the end of the array which stores the raided places
                for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                    if(TowerPage.Tower.raidedFloors[j][0] == TowerPage.Tower.currentFloor && TowerPage.Tower.raidedFloors[j][1] == level_nr) {
                        TowerPage.Tower.raidedFloors.splice(j,1);
                        break;
                    }
                }
                //return the same level_nr as this level
                last_one = level_nr;
            }
            else {
                //if this army was already raiding, remove previous raid
                if(Player.armies[TowerPage.currentArmy].raiding != -1) {
                    for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                        if(TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[j][0]].levels[TowerPage.Tower.raidedFloors[j][1]].raiding_army == TowerPage.currentArmy)  {
                            last_one = TowerPage.Tower.raidedFloors[j][1];
                            TowerPage.Tower.raidedFloors.splice(j,1);
                            break;
                        }
                    }
                    TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[Player.armies[TowerPage.currentArmy].raiding].raiding_army = -1;
                }
                //if the level is already raided, remove it
                if(this.raiding_army != -1) {
                    for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                        if(TowerPage.Tower.raidedFloors[j][0] == TowerPage.Tower.currentFloor && TowerPage.Tower.raidedFloors[j][1] == level_nr) {
                            TowerPage.Tower.raidedFloors.splice(j,1);
                            break;
                        }
                    }
                    Player.armies[this.raiding_army].raiding = -1;
                    this.raiding_army = -1;
                }
                this.raiding_army = TowerPage.currentArmy;
                Player.armies[TowerPage.currentArmy].raiding = level_nr;
                TowerPage.Tower.raidedFloors.push([TowerPage.Tower.currentFloor,level_nr]);
            }
            //unlock new levels
            if(!this.unlocked_next_levels) {
                for(let j = 0; j < this.unlocks.length; j++) {
                    let un = this.unlocks[j];
                    Unlockables.unlock(['towerLevels',un[0]] , 0, un[1]);
                    //* CHANGE THIS (MOVE IT SOMEWHERE ELSE)
                    if(un[0] == TowerPage.Tower.currentFloor) {
                        TowerPage.towerLevels[un[1]].hidden = false;
                    }
                    //*/
                }
                this.unlocked_next_levels = true;
            }
        }
        else {
            return false;
        }    
        return last_one;
    }
};

/*
    bosses - the names of the bosses from stuff which you need to fight
    max_selectible_armies - max number of armies the player can bring to the fight
    lose_soldiers - true if you lose soldiers based on the soldier_loss_ratio of the boss you are fighting
                    false if you don't lose soldiers no matter what
*/
class Fight {
    constructor(bosses=[], max_selectible_armies, lose_soldiers) {
        this.bosses = bosses;
        this.max_selectible_armies = max_selectible_armies;
        this.lose_soldiers = lose_soldiers;
        //initialize selected armies
        this.selected_armies = []
        for(let i = 0; i < max_selectible_armies; i++) {
            this.selected_armies.push(-1);
        }
    }
}

class BossFightLevel extends ParentTowerLevel {
    constructor(width, height, top, left, z_index, boss, capacity, rewards, unlocks = [], name = '', desc = '', raiding_army = -1) {
        super(width, height, top, left, z_index, capacity, unlocks, name, desc, raiding_army);

        this.rewards = rewards;
        this.boss = boss;
    }

    get type() {
        return stuff.bosses[this.boss].type;
    }

    get stats() {
        return stuff.bosses[this.boss].stats;
    }

    get_color() {
        let def_power = stuff.bosses[this.boss].stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(stuff.bosses[this.boss].stats, 'Attack', 'Defense');
        if(atk_power.lt(def_power)) {
            return 'var(--disabled-tower-level-background-color)';;
        }
        else {
            return 'var(--default-tower-level-background-color)';
        }
    }

    get_text(floor_name) {
        return '<b>' + floor_name + ' - ' + this.name + '</b><br>' + 
        '<i>Type: ' + this.type + '</i><br><br>' + 
        stuff.bosses[this.boss].name + '<br>' + 
        stuff.bosses[this.boss].stats.get_text() + '<br>' +
        '<i>' + stuff.bosses[this.boss].desc + '</i><br><br>' + 
        'Capacity:' + StylizeDecimals(this.capacity, true) + '<br><br>' +
        '<i>' + this.desc + '</i>';
    }

    tick(nr_ticks) {
        
    }

    raid(level_nr, ) {
        document.querySelector("#PageButtonsContainer").hidden = true;
        document.querySelector('#PageTopResourcesContainer').hidden = true;
        BossArmySelectionPage.fight = new Fight([this.boss], 1, false)
        HidePages(5);

        return false;
    }
    
}

const TowerPage = {
    towerFloors : [],
    towerLevels : [],
    towerInfo : undefined,
    pageButton : undefined,
    container : undefined,
    changeArmyButtons : undefined,
    currentArmy : 0,
    armyInfo : undefined,
    Tower : {
        floors : [],
        raidedFloors : [],
        currentFloor : 0,
    },
    displayOnLoad() {
        TowerPage.towerFloors[TowerPage.Tower.currentFloor].style.backgroundColor = 'var(--selected-tower-floor-background-color)';
        TowerPage.changeArmyButtons[TowerPage.currentArmy].style.borderColor = 'var(--selected-toggle-button-border-color)';
        TowerPage.changeArmy(TowerPage.currentArmy);
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].display(TowerPage.Tower.currentFloor);
        //set the context text to the value you need on levels raided
        for(let i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
            let path = TowerPage.Tower.raidedFloors[i];
            TowerPage.towerLevels[path[1]].setAttribute('contenttext',TowerPage.Tower.floors[path[0]].levels[path[1]].raiding_army + 1);
        }
    },
    display() {
        TowerPage.changeArmy(TowerPage.currentArmy);
    },
    displayEveryTick() {

    },
    changeArmy(change_to) {
        TowerPage.currentArmy = change_to;
        TowerPage.armyInfo.innerHTML = Player.armies[TowerPage.currentArmy].get_text(true);
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].display(TowerPage.Tower.currentFloor);
    },
    save() {
        //save the current army and Tower
        let save_text = TowerPage.currentArmy + '/*/' + TowerPage.Tower.currentFloor + '/*/';
        //save raided floors and raided levels
        save_text += TowerPage.Tower.raidedFloors.length;
        for(let i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
            save_text += '/*/' + TowerPage.Tower.raidedFloors[i][0] + '/*/' + TowerPage.Tower.raidedFloors[i][1] + '/*/' + TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].raiding_army;
        }
        return save_text
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        TowerPage.currentArmy = Number(save_text[i]);
        i++;
        TowerPage.Tower.currentFloor = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        //get raided levels set up
        for(j = 0; j < len; j++) {
            TowerPage.Tower.raidedFloors.push([Number(save_text[i]),Number(save_text[i+1])]);
            TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[j][0]].levels[TowerPage.Tower.raidedFloors[j][1]].raiding_army = Number(save_text[i+2]);
            TowerPage.towerLevels[TowerPage.Tower.raidedFloors[j][1]].innerHTML = Number(save_text[i+2])+1;
            i+=3;
        }
        //display changes with on load function
        TowerPage.displayOnLoad();
    },
};
                                                                    //730 = -630
TowerPage.Tower.floors[0] = new TowerFloor([new TowerLevel(100,50,500,100, 0, new Stats(['Defense'],[new SubStats(new Decimal(1))]), new Decimal(500), new Decimal(0.2), [[0, 1], [0, 2]], 'Sewers 1', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(100,50,449,49, 3, new Stats(['Defense'],[new SubStats(new Decimal(2))]), new Decimal(250), new Decimal(0.3), [[0, 3], [0, 4]], 'Sewers 2', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(100,50,449,151, 3, new Stats(['Defense'],[new SubStats(new Decimal(2))]), new Decimal(250), new Decimal(0.3), [[0, 3], [0, 5]], 'Sewers 3', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(120,50,423,115, 2,new Stats(['Defense'],[new SubStats(new Decimal(3.4))]), new Decimal(450), new Decimal(3), [[0, 6]], 'Sewers 4', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(30,50,385,75, 3, new Stats(['Defense'],[new SubStats(new Decimal(2.5))]), new Decimal(600), new Decimal(1),[[1, 0]], 'Sewers 5', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(30,50,385,229, 3, new Stats(['Defense'],[new SubStats(new Decimal(2.5))]), new Decimal(600), new Decimal(1),[[1, 0]], 'Sewers 6', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(80,50,397,162, 1,new Stats(['Defense'],[new SubStats(new Decimal(7.5))]), new Decimal(900), new Decimal(12),[[0,7]], 'Sewers 7', 'Stinky and bad. The first level of the sewers.'),
                                            new TowerLevel(30,70,300,220, 0,new Stats(['Defense'],[new SubStats(new Decimal(15))]), new Decimal(1200), new Decimal(40),[[0,8]], 'Sewers 8', 'Stinky and bad. The first level of the sewers.'),
                                            new BossFightLevel(30,70,230,220, 0,'Slime', new Decimal(1200), new Decimal(40),[], 'Sewer\'s Top', 'The topmost level of the sewers. It is lit with candles. You don\'t want to find out what lurks in the shadows, but will have to do so eventually...'),],
                                        'Sewers', 'Stinky and bad and it gets worse the higher you go.');
TowerPage.Tower.floors[1] = new TowerFloor([new TowerLevel(100,50,300,100, 0, new Stats(['Defense'],[new SubStats(new Decimal(5))]),new Decimal(300),new Decimal(2),[],'The Slums','When you venture beyond the sewers, the place looks like a big slum, full of giant rats.')],'Rat-haven','A place where the rats thrive.')

TowerPage.towerFloors = Array.from(document.querySelectorAll('.tower_part'));
TowerPage.towerLevels = document.querySelectorAll('.tower_level');
TowerPage.pageButton = document.querySelector('#TowerPageButton');
TowerPage.container = document.querySelector('#TowerPageContainer');
TowerPage.changeArmyButtons = document.querySelectorAll('.change_army_button');
TowerPage.armyInfo = document.querySelector('#TowerPageArmyInfo');
TowerPage.towerInfo = document.querySelector('#TowerPageTowerInfo');

//reverse tower levels
let i = 0;
let j = 27;
while(i < j) {
    [TowerPage.towerFloors[i],TowerPage.towerFloors[j]] = [TowerPage.towerFloors[j], TowerPage.towerFloors[i]];
    i++;
    j--;
}

//initialize tower page change army buttons
for(let i = 0; i < TowerPage.changeArmyButtons.length; i++) {
    TowerPage.changeArmyButtons[i].addEventListener('click', () => {
        TowerPage.changeArmyButtons[TowerPage.currentArmy].style.borderColor = 'var(--default-toggle-button-border-color)';
        TowerPage.changeArmy(i);
        TowerPage.changeArmyButtons[TowerPage.currentArmy].style.borderColor = 'var(--selected-toggle-button-border-color)';
    })
};

//initialize TOWER FLOOR hover functions
for(let i = 0; i < TowerPage.towerFloors.length; i++) {
    //revert the numbering on the floors because they are in the list in reverse order
    //on mouseenter display new floor
    TowerPage.towerFloors[i].addEventListener('mouseenter', () => {
        if(i >= TowerPage.Tower.floors.length) {
            TowerPage.towerInfo.innerHTML = 'Under developement, sorry. :<)';
        }
        else {
            TowerPage.Tower.floors[i].display(i);
            //if the current floor is not selected
            if(i != TowerPage.Tower.currentFloor) {
                TowerPage.towerFloors[i].style.backgroundColor = 'var(--hover-tower-floor-background-color)';
            }
            else {
                TowerPage.towerFloors[i].style.backgroundColor = 'var(--hover-selected-tower-floor-background-color)';
            }
        }
    });
    //on mouseleave, revert to current floor
    TowerPage.towerFloors[i].addEventListener('mouseleave', () => {
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].display(TowerPage.Tower.currentFloor);
        if(i != TowerPage.Tower.currentFloor) {
            TowerPage.towerFloors[i].style.backgroundColor = 'var(--default-tower-floor-background-color)';
        }
        else {
            TowerPage.towerFloors[i].style.backgroundColor = 'var(--selected-tower-floor-background-color)';
        }
        
    });
    //on click change color and currentFloor
    TowerPage.towerFloors[i].addEventListener('click', () => {
        if(i >= TowerPage.Tower.floors.length) {
            return;
        }
        TowerPage.towerFloors[TowerPage.Tower.currentFloor].style.background = 'var(--default-tower-floor-background-color)';
        TowerPage.Tower.currentFloor = i;
        TowerPage.towerFloors[i].style.background = 'var(--selected-tower-floor-background-color)';
    });
};

//TOWER LEVEL click, enter and leave events and new atribute
for(let i = 0; i < TowerPage.towerLevels.length; i++) {
    //display new level stuff on mouseenter
    TowerPage.towerLevels[i].addEventListener('mouseenter', () => {
        TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].display(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].name);
    });
    //on mouseleave, display current floor
    TowerPage.towerLevels[i].addEventListener('mouseleave', () => {
        TowerPage.towerInfo.innerHTML = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].get_text();
    });
    //on click, change army that is raiding it
    TowerPage.towerLevels[i].addEventListener('click', () => {
        //let def_power = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].stats.get_power(Player.armies[TowerPage.currentArmy].stats,'Defense','Attack');
        //let atk_power = Player.armies[TowerPage.currentArmy].stats.get_power(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].stats, 'Attack', 'Defense');
        let last_one = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raid(i);
        if(!(last_one === false)) {
            if(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army == -1) {
                TowerPage.towerLevels[i].setAttribute('contenttext','');
                TowerPage.towerLevels[i].innerHTML = '';
            }
            else {
                let cont_text = String(TowerPage.currentArmy + 1);
                TowerPage.towerLevels[i].setAttribute('contenttext', cont_text);
                TowerPage.towerLevels[i].innerHTML = cont_text;
            }
            if(last_one != -1) {
                TowerPage.towerLevels[last_one].setAttribute('contenttext','');
                TowerPage.towerLevels[last_one].innerHTML = '';
            }
            /*
            //if it is the same army raiding it then to which you are trying to set it, then remove that army
            if(TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].raiding_army == TowerPage.currentArmy) {
                TowerPage.towerLevels[i].setAttribute('contenttext','');
                TowerPage.towerLevels[i].innerHTML = '';
            }
            else {
                //if this army was occupied, remove previous raid
                if(Player.armies[TowerPage.currentArmy].raiding != -1) {
                    for(j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
                        if(TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[j][0]].levels[TowerPage.Tower.raidedFloors[j][1]].raiding_army == TowerPage.currentArmy)  {
                            if(TowerPage.Tower.raidedFloors[j][0] == TowerPage.Tower.currentFloor) {
                                TowerPage.towerLevels[Player.armies[TowerPage.currentArmy].raiding].setAttribute('contenttext','');
                                TowerPage.towerLevels[Player.armies[TowerPage.currentArmy].raiding].innerHTML = '';
                            }
                            break;
                        }
                    }
                    TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[Player.armies[TowerPage.currentArmy].raiding].raiding_army = -1;
                }
                contenttext = String(TowerPage.currentArmy + 1);
                TowerPage.towerLevels[i].setAttribute('contenttext',contenttext);
                TowerPage.towerLevels[i].innerHTML = contenttext;
            }
            //*/
            //unlock new levels
            /*
            if(!TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocked_next_levels) {
                for(let j = 0; j < TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocks.length; j++) {
                    let un = TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocks[j];
                    Unlockables.unlock(['towerLevels',un[0]] , 0, un[1]);
                    if(un[0] == TowerPage.Tower.currentFloor) {
                        TowerPage.towerLevels[un[1]].hidden = false;
                    }
                    
                }
                TowerPage.Tower.floors[TowerPage.Tower.currentFloor].levels[i].unlocked_next_levels = true;
            }
            //*/
        }
    });
    TowerPage.towerLevels[i].setAttribute('contenttext','');
};