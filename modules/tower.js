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
            TowerPage.towerLevels[j].hidden = false;
            j++;
        };
        //color by availability and set position
        j = 0;
        while(j < TowerPage.Tower.floors[nr_floor].levels.length) {
            TowerPage.towerLevels[j].setAttribute('contenttext',TowerPage.Tower.floors[nr_floor].levels[j].raiding_army == -1 ? ' ' : String(TowerPage.Tower.floors[nr_floor].levels[j].raiding_army + 1));
            TowerPage.towerLevels[j].innerHTML = TowerPage.Tower.floors[nr_floor].levels[j].raiding_army == -1 ? ' ' : String(TowerPage.Tower.floors[nr_floor].levels[j].raiding_army + 1);
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
        return (Player.armies[this.raiding_army].size.min(this.capacity)).mul(this.gold_per_power).mul(Player.armies[this.raiding_army].stats.get_power(this.stats, 'Attack', 'Defense')).max(new Decimal(0));
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
            'Current gold per second: ' + ( this.raiding_army == -1 ? 'None' : StylizeDecimals(this.goldPerSecond) ) + '<br>' +
            '<br><i>' + this.desc + '</i>';
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
                for(let j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
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
                    for(let j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
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
                    for(let j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
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
        HidePages('BossArmySelectionPage');

        return false;
    }
    
}

class TowerSelectArmyButtonsClass extends ButtonGroupClass {
    constructor(container_idetifier, button_identifier, selected_style, default_style) {
        super(container_idetifier, button_identifier, selected_style, default_style);
    }

    buttonClick(button_nr) {
        super.buttonClick(button_nr);
        TowerPage.changeArmy(button_nr);
    }
}

class TowerClass {
    constructor() {
        this.floors = [];
        this.raidedFloors = [];
        this.currentFloor = 0;
    }

    getGoldPerSecond() {
        let gold_per_second = new Decimal(0);
        for(let i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
            gold_per_second = gold_per_second.add(TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].goldPerSecond);
        }
        return gold_per_second;
    }
}

class TowerPageClass extends PageClass {
    constructor(name) {
        super(name);
        
        this.towerFloors = Array.from(document.querySelectorAll('.tower_part').values());
        
        //reverse tower floors
        let i = 0;
        let j = this.towerFloors.length;
        while(i < j) {
            [this.towerFloors[i],this.towerFloors[j]] = [this.towerFloors[j], this.towerFloors[i]];
            i++;
            j--;
        }
        this.towerFloors.shift();
        this.towerLevels = document.querySelectorAll('.tower_level');
        this.towerInfo = document.getElementById('TowerPageTowerInfo');
        this.pageButton = document.getElementById('TowerPageButton');
        this.changeArmyButtons = new TowerSelectArmyButtonsClass('.toggle_button_container.page_tower', '.toggle_button', {'borderColor': 'var(--selected-toggle-button-border-color)'}, {'borderColor': 'var(--default-toggle-button-border-color)'});
        this.currentArmy = 0;
        this.armyInfo = document.getElementById('TowerPageArmyInfo');
        this.Tower = new TowerClass();
        this.initializeTowerFloors();

        this.initializeEventListeners();
    }
    //a place to store data about Tower floors
    initializeTowerFloors() {
        this.Tower.floors[0] = new TowerFloor([new TowerLevel(100,50,500,100, 0, new Stats(['Defense'],[new SubStats(new Decimal(0.5))]), new Decimal(500), new Decimal(1), [[0, 1], [0, 2]], 'Sewers 1', 'Still laughing, you go inside the building only to realize that the stink is even worse than what you thought it would be. Now you start to feel sorry for the guy who tried to organize a date here. <br> Going one step further, you find yourselves in knee-high dirty water hoping that the situation will change for the better in the next few minutes.'),
                                            new TowerLevel(100,50,449,49, 3, new Stats(['Defense'],[new SubStats(new Decimal(1))]), new Decimal(250), new Decimal(2), [[0, 3], [0, 4]], 'Sewers 2', 'You took the trapdoor on the left side of the first level. The stench is no better, but at least some new strange moss is inhabiting the left wall.'),
                                            new TowerLevel(100,50,449,151, 3, new Stats(['Defense'],[new SubStats(new Decimal(1))]), new Decimal(250), new Decimal(2), [[0, 3], [0, 5]], 'Sewers 3', 'You took the trapdoor on the right side of the first level. The stench is no better, but at least some new strange moss is inhabiting the right wall.'),
                                            new TowerLevel(120,50,423,115, 2,new Stats(['Defense'],[new SubStats(new Decimal(3.4))]), new Decimal(450), new Decimal(15), [[0, 6]], 'Sewers 4', 'After taking one door to the back, you find yourself in a moss-filled place. Instead of the wetness of water, you are greeted with the slimeiness of... well, of slime.'),
                                            new TowerLevel(30,50,385,75, 3, new Stats(['Defense'],[new SubStats(new Decimal(2))]), new Decimal(600), new Decimal(5),[[1, 0]], 'Sewers 5', 'Another trapdoor in the left portion of the ceiling, who would\'ve guessed? At least the place is not wet anymore and... well, it\'s way hotter and the stink is worse... You got comfort for your legs, but at what price?'),
                                            new TowerLevel(30,50,385,229, 3, new Stats(['Defense'],[new SubStats(new Decimal(2))]), new Decimal(600), new Decimal(5),[[1, 0]], 'Sewers 6', 'Another trapdoor in the right portion of the ceiling, who would\'ve guessed? At least the place is not wet anymore and... well, it\'s way hotter and the stink is worse... You got comfort for your legs, but at what price?'),
                                            new TowerLevel(80,50,397,162, 1,new Stats(['Defense'],[new SubStats(new Decimal(5.5))]), new Decimal(900), new Decimal(37),[[0,7]], 'Sewers 7', 'The slime coating becomes more consistent, sticky and concentrated. Surprising no one, this is even more unconfortable than it was.'),
                                            new TowerLevel(30,70,300,220, 0,new Stats(['Defense'],[new SubStats(new Decimal(9.5))]), new Decimal(1200), new Decimal(87),[[0,8]], 'Sewers 8', 'The stink intensifies to an unheard-of level when you enter the room. The slime pools on the ground, knee-high in places, ankle high in others. It is dripping from the ceiling as well, along from the edges of the spiral staircase leading ever upwards. Some railing would come in handy, but you can\'t get everything in life...'),
                                            new BossFightLevel(30,70,230,220, 0,'Slime', new Decimal(1200), new Decimal(40),[], 'Sewer\'s Top', 'The topmost level of the sewers. It is lit with candles. Due to the slight topwards incline and the slight upwards arc of the floor, the slime is only running in two rivers next to the walls.  You don\'t want to find out what lurks in the shadows, but will have to do so eventually...'),],
                                        'Sewers', 'Wet and stinky and the odor gets worse the higher you go. Before the entrance stands a lone sign: \'EXTREME DANGER OF DEATH (also not an ideal place for a date, trust me)\'');
        this.Tower.floors[1] = new TowerFloor([new TowerLevel(100,50,300,100, 0, new Stats(['Defense'],[new SubStats(new Decimal(5))]),new Decimal(300),new Decimal(2),[],'The Slums','When you venture beyond the sewers, the place looks like a big slum, full of giant rats.')],'Rat-haven','A place where the rats thrive.')

    }
    //called when page reloads
    initializeEventListeners() {
        let c_obj = this;

        //initialize TOWER FLOOR hover functions
        for(let i = 0; i < this.towerFloors.length; i++) {
            //revert the numbering on the floors because they are in the list in reverse order
            //on mouseenter display new floor
            this.towerFloors[i].addEventListener('mouseenter', () => {
                if(i >= c_obj.Tower.floors.length) {
                    c_obj.towerInfo.innerHTML = 'Under developement, sorry. :<)';
                }
                else {
                    c_obj.Tower.floors[i].display(i);
                    //if the current floor is not selected
                    if(i != c_obj.Tower.currentFloor) {
                        c_obj.towerFloors[i].style.backgroundColor = 'var(--hover-tower-floor-background-color)';
                    }
                    else {
                        c_obj.towerFloors[i].style.backgroundColor = 'var(--hover-selected-tower-floor-background-color)';
                    }
                }
            });
            //on mouseleave, revert to current floor
            this.towerFloors[i].addEventListener('mouseleave', () => {
                c_obj.Tower.floors[c_obj.Tower.currentFloor].display(c_obj.Tower.currentFloor);
                if(i != c_obj.Tower.currentFloor) {
                    c_obj.towerFloors[i].style.backgroundColor = 'var(--default-tower-floor-background-color)';
                }
                else {
                    c_obj.towerFloors[i].style.backgroundColor = 'var(--selected-tower-floor-background-color)';
                }
                
            });
            //on click change color and currentFloor
            this.towerFloors[i].addEventListener('click', () => {
                if(i >= c_obj.Tower.floors.length) {
                    return;
                }
                c_obj.towerFloors[c_obj.Tower.currentFloor].style.background = 'var(--default-tower-floor-background-color)';
                c_obj.Tower.currentFloor = i;
                c_obj.towerFloors[i].style.background = 'var(--selected-tower-floor-background-color)';
            });
        };

        //TOWER LEVEL click, enter and leave events and new atribute
        for(let i = 0; i < this.towerLevels.length; i++) {
            //display new level stuff on mouseenter
            this.towerLevels[i].addEventListener('mouseenter', () => {
                c_obj.Tower.floors[c_obj.Tower.currentFloor].levels[i].display(c_obj.Tower.floors[c_obj.Tower.currentFloor].name);
            });
            //on mouseleave, display current floor
            this.towerLevels[i].addEventListener('mouseleave', () => {
                c_obj.towerInfo.innerHTML = c_obj.Tower.floors[c_obj.Tower.currentFloor].get_text();
            });
            //on click, change army that is raiding it
            this.towerLevels[i].addEventListener('click', () => {
                let last_one = c_obj.Tower.floors[c_obj.Tower.currentFloor].levels[i].raid(i);
                if(!(last_one === false)) {
                    if(c_obj.Tower.floors[c_obj.Tower.currentFloor].levels[i].raiding_army == -1) {
                        c_obj.towerLevels[i].setAttribute('contenttext','');
                        c_obj.towerLevels[i].innerHTML = '';
                    }
                    else {
                        let cont_text = String(c_obj.currentArmy + 1);
                        c_obj.towerLevels[i].setAttribute('contenttext', cont_text);
                        c_obj.towerLevels[i].innerHTML = cont_text;
                    }
                    if(last_one != -1) {
                        c_obj.towerLevels[last_one].setAttribute('contenttext','');
                        c_obj.towerLevels[last_one].innerHTML = '';
                    }
                    c_obj.Tower.floors[c_obj.Tower.currentFloor].levels[i].display(c_obj.Tower.floors[c_obj.Tower.currentFloor].name);
                }
            });
            this.towerLevels[i].setAttribute('contenttext','');
        };
    }
    //called when new save gets loaded
    displayOnLoad() {
        this.towerFloors[this.Tower.currentFloor].style.backgroundColor = 'var(--selected-tower-floor-background-color)';
        this.changeArmy(this.currentArmy);
        this.Tower.floors[this.Tower.currentFloor].display(this.Tower.currentFloor);
        //set the context text to the value you need on levels raided
        for(let i = 0; i < this.Tower.raidedFloors.length; i++) {
            let path = this.Tower.raidedFloors[i];
            this.towerLevels[path[1]].setAttribute('contenttext',this.Tower.floors[path[0]].levels[path[1]].raiding_army + 1);
        }
    }
    display() {
        this.changeArmy(this.currentArmy);
        this.Tower.floors[this.Tower.currentFloor].display(this.Tower.currentFloor);
        if(this.timesVisited == 0) {
            TutorialPage.unlockTutorial('Tower Page');
            TutorialPage.startTutorial('Tower Page', true, 'TowerPage');
        }
        this.timesVisited++;
    }
    displayEveryTick(c_obj) {}
    //called when a save text is needed
    save() {
        let save_text = super.save();

        save_text += '/*/' + this.currentArmy + '/*/' + this.Tower.currentFloor + '/*/';
        //save raided floors and raided levels
        save_text += this.Tower.raidedFloors.length;
        for(let i = 0; i < this.Tower.raidedFloors.length; i++) {
            save_text += '/*/' + this.Tower.raidedFloors[i][0] + '/*/' + this.Tower.raidedFloors[i][1] + '/*/' + this.Tower.floors[this.Tower.raidedFloors[i][0]].levels[this.Tower.raidedFloors[i][1]].raiding_army;
        }

        save_text += '/*/' + this.changeArmyButtons.save();

        return save_text;
    }
    //called when you need to get values from a save_text
    //maybe should call displayOnLoad?
    //returns the number of steps taken
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = super.load(save_text);
        this.currentArmy = Number(save_text[i]);
        i++;
        this.Tower.currentFloor = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        //get raided levels set up
        for(let j = 0; j < len; j++) {
            this.Tower.raidedFloors.push([Number(save_text[i]),Number(save_text[i+1])]);
            this.Tower.floors[this.Tower.raidedFloors[j][0]].levels[this.Tower.raidedFloors[j][1]].raiding_army = Number(save_text[i+2]);
            this.towerLevels[this.Tower.raidedFloors[j][1]].innerHTML = Number(save_text[i+2])+1;
            i+=3;
        }

        i += this.changeArmyButtons.load(save_text, i);

        //display changes with on load function
        this.displayOnLoad();
    }
    changeArmy(change_to) {
        this.currentArmy = change_to;
        this.armyInfo.innerHTML = Player.armies[this.currentArmy].get_text(true);
        this.Tower.floors[this.Tower.currentFloor].display(this.Tower.currentFloor);
    }
};
                 
let TowerPage = new TowerPageClass('TowerPage');

