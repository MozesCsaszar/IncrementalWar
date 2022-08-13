class CombatMove {
    constructor(name, desc ) {
        this.name = name;
        this.desc = desc;
    }

    modify_stats(stats) {
        return stats;
    }
};

//A move that only modifies the 'Attack' value of one or more stats object(s)
class AttackMove extends CombatMove {
    constructor(name, desc, modifiers=[], modifier_types=[], targets = new Decimal(1)) {
        super(name, desc);
        this.modifiers = modifiers;
        this.modifier_types = modifier_types;
        this.attack_targets = targets;
    }

    get type() {
        return 'AttackMove';
    }

    modify_stats(stats) {
        stats = stats.add(new Stats([],[]));
        for(let i = 0; i < this.modifier_types; i++) {
            stats['Attack'] = stats['Attack'][this.modifier_types[i]](this.modifiers[i]);
        }
        stats['Attack'] = stats['Attack'];
        return stats;
    }
};

//A move that only modifies the 'Defense' value of one or more stats object(s)
class DefenseMove extends CombatMove {
    constructor(name, desc, modifiers=[], modifier_types=[], targets = new Decimal(1)) {
        super(name, desc);
        this.modifiers = modifiers;
        this.modifier_types = modifier_types;
        this.defense_targets = targets;
    }

    get type() {
        return 'DefenseMove';
    }

    modify_stats(stats) {
        //create a copy
        stats = stats.add(new Stats([],[]));
        for(let i = 0; i < this.modifier_types; i++) {
            console.log(this.modifier_types, i);
            stats['Defense'] = stats['Defense'][this.modifier_types[i]](this.modifiers[i]);
        }
        return stats;
    }
};

//A move that only modifies the 'Healht' value of one or more stats object(s)
class HealMove extends CombatMove {

};

//A move that executes a combination of the above
class CombinedMove extends CombatMove {
    constructor(name, desc, moves = []) {
        super(name, desc);
        this.moves = moves;
        this.attack_targets = new Decimal(0);
        this.defense_targets = new Decimal(0);
        //get attack and defense targets
        for(let i = 0; i < this.moves.length; i++) {
            if(this.moves[i].type == 'AttackMove') {
                this.attack_targets = this.attack_targets.add(this.moves[i].attack_targets);
            }
            else if(this.moves[i].type == 'DefenseMove') {
                this.defense_targets = this.defense_targets.add(this.moves[i].defense_targets);
            }
        }
    }

    get type() {
        return 'CombinedMove';
    }

    modify_stats(stats) {
        for(let i = 0; i < this.moves.length; i++) {
            stats = this.moves[i].modify_stats(stats);
        }
        return stats;
    }
}

//A class that stores Moves with rarity and priority and will choose the apropriate one
/*
    How priorities and rarities work:
        -rarities can be Common (0), Uncommon(1), Rare(2), Special(3) and Ultra Rare(4)
        -each rarity has a 1/2^m chance to be chosen (a random choosing between 1 and 2^n will happen, log_2(rand).floor() 
         will be the rarity of the move used)
        -then a move is gotten randomly from the selection
    Please provide moves as a layered array!
*/
class Moveset {
    static name_text_start = '<span style="color:';
    static move_rarities = {0:'Common', 1: 'Uncommon', 2: 'Rare', 3:'Special', 4:'Super', 5:'Ultra'}
    static rarity_colors = {0: 'aliceblue', 1: '#20d000', 2: '#4848ff', 3: '#b000b0', 4: '#FF0000', 5: '#FF0000'}
    static color_span_end = '">';
    static name_text_end = '</span>'

    constructor(moves=[[]]) {
        this.moves = moves;
        this.current_move = undefined;
        this.current_move_place = [];
    }

    get_move() {
        let rarity =  this.moves.length - 1 - Math.floor(Math.log2(1 + Math.floor( Math.random() * (2 ** this.moves.length - 1) )) );
        let move_nr = Math.floor(Math.random() * this.moves[rarity].length);
        this.current_move = this.moves[rarity][move_nr];
        this.current_move_place = [rarity, move_nr];
        return this.current_move;
    }

    get_current_move_name() {
        return this.get_move_name(...this.current_move_place);
    }

    get_move_name(rarity, move_nr) {
        return Moveset.name_text_start + Moveset.rarity_colors[rarity] + Moveset.color_span_end + this.moves[rarity][move_nr].name + ' (' +
        Moveset.move_rarities[rarity] + ')' + Moveset.name_text_end;
    }

    get_move_description(rarity, move_nr) {
        return this.moves[rarity][move_nr].desc;
    }
}
/*
    Boss types:
        -Mini, Normal
    Boss soldier_loss_ratio:
        0 - no soldier lost, 1 - all soldies who are wounded (no Health at the end of fight) are lost,
        (0, 1) - a percentage of wounded soldiers lost
*/
//used for boss and miniboss fights
class Boss {
    constructor(name, desc, stats, type, soldier_loss_ratio, moveset) {
        this.stats = stats;
        this.name = name;
        this.desc = desc;
        this.type = type;
        this.soldier_loss_ratio = soldier_loss_ratio;
        this.attacks_per_second = 1;
        this.size = 100;
        this.moveset = moveset;
    }

    attack() {
        return this.stats['Attack'];
    }

    get_text() {
        let t = '<b>' + this.name + '</b><br>' + 
        '<i>' + this.type + '</i><br><br>' + 
        this.stats.get_text() + '<br>' +
        'Attacks/sec: ' + this.attacks_per_second + '<br>' +
        'Size: ' + this.size + '<br>' +
        'Moves: ';
        for(let i = 0; i < this.moveset.moves.length; i++) {
            for(let j = 0; j < this.moveset.moves[i].length; j++) {
                if(i != 0 || j != 0) {
                    t += ', '
                }
                t += this.moveset.get_move_name(i, j);
            }
        }
        t += '.<br>';
        return t;
    }
}

//simulates a whole army fighting against a boss
class FightingArmy {
    constructor(army) {
        this.stats = army.stats.add(new Stats([],[]));
        this.max_units = new Decimal(army.size);
        this.units = new Decimal(army.size);
        this.max_total_health = this.units.mul(this.stats['Health']);
        this.total_health = this.units.mul(this.stats['Health']);
        //when attack_counter reaches attack_time, the army attacks
        this.attack_time = new Decimal(1);
        this.attack_counter = new Decimal(0);

        this.size = 10;
        this.deployed = new Decimal(0);
    }

    get_total_attack(target) {
        return this.deployed.mul( this.stats.get_power(target.current_stats, 'Attack', 'Defense') ).max(new Decimal(0));
    }

    do_attack(target) {
        target.get_attacked(this.get_total_attack(target));
    }

    tick(tick_per_sec, target) {
        this.attack_counter = this.attack_counter.add(new Decimal(1).div(tick_per_sec));
        if(this.attack_counter.gte(this.attack_time)) {
            this.attack_counter = new Decimal(0);
            this.do_attack(target);
        }
    }

    deploy_around_boss(boss) {
        let max_nr = new Decimal(boss.get_nr_around(this.size));
        //while there can be units deployed around boss and you have units, do the deploy action
        while(max_nr.gt(this.deployed) && this.units.gt(this.deployed)) {
            boss.deploy_unit_around(this);
            this.deployed = this.deployed.add(1);
        }
    }
};

//simualtes a single soldier fighting against a boss
class FightingUnit {
    constructor(army) {
        this.army = army;
        this.stats = army.stats.add(new Stats([], []));
        this.is_dead = false;
    }

    lose_health(damage) {
        let lost_health = this.stats['Health'].min(damage);
        this.stats['Health'] = this.stats['Health'].sub(lost_health);
        this.army.total_health = this.army.total_health.sub(lost_health);
        if(this.stats['Health'].lte(new Decimal(0.00001))) {
            this.die();
        }
    }

    die() {
        this.army.units = this.army.units.sub(1);
        this.army.deployed = this.army.deployed.sub(1);
        this.is_dead = true;
    }
}

//simulates a boss fighting against armies represented by the FightingUnits which can get close enough to attack
class FightingBoss {
    constructor(boss) {
        this.stats = boss.stats.add(new Stats([],[]));
        this.max_units = new Decimal(1);
        this.units = new Decimal(1);
        this.max_total_health = this.units.mul(this.stats['Health']);
        this.total_health = this.units.mul(this.stats['Health']);
        //when attack_counter reaches attack_time, the boss attacks
        this.attack_time = new Decimal(1);
        this.attack_counter = new Decimal(0);
        this.floating_damage = new Decimal(0);

        this.moveset = boss.moveset;
        
        this.move = undefined;
        this.current_stats = undefined;
        this.size = boss.size;

        this.enemies_around = []
        this.targets = []

        this.choose_move();
    }

    get_targets() {
        this.targets = [];
        if(this.enemies_around.length == 0) {
            return;
        }
        for(let i = 0; i < this.move.attack_targets; i++) {
            
            let nr = Math.floor(Math.random() * this.enemies_around.length);
            this.targets.push(nr);
        }
    }

    choose_move() {
        this.move = this.moveset.get_move();
        this.current_stats = this.move.modify_stats(this.stats);
        this.get_targets();
    }

    get_total_attack() {
        let attack = new Decimal(0);
        for(let i = 0; i < this.targets.length; i++) {
            attack = attack.add(this.current_stats.get_power(this.enemies_around[this.targets[i]], 'Attack', 'Defense').max(new Decimal(0)));
        }
        return attack;
    }

    do_attack() {
        //attack them
        let dead = []
        for(let i = 0; i < this.targets.length; i++) {
            let enemy = this.enemies_around[this.targets[i]];
            //if the enemy was targeted multiple times, but by now is dead, just roll with it
            if(enemy.is_dead) {
                continue;
            }
            let power = this.current_stats.get_power(enemy.stats, 'Attack', 'Defense');
            enemy.lose_health(power);
            if(enemy.is_dead) {
                //remove enemy from around boss
                dead.push(this.targets[i]);
                //deploy new unit if applicable
                enemy.army.deploy_around_boss(this);
            }
        }
        //remove the dead from the army
        for(let i = 0; i < dead.length; i++) {
            this.enemies_around[dead[i]] = -1;
        }
        let i = 0;
        while(i < this.enemies_around.length) {
            if(this.enemies_around[i] == -1) {
                this.enemies_around.splice(i, 1);
            }
            else {
                i++;
            }
        }

        //move feed, maybe move it somewhere else?
        BossFightingPage.feedMoves.push([this, this.moveset.current_move_place]);
        if(BossFightingPage.feedMoves.length > BossFightingPage.feedElements.length) {
            BossFightingPage.feedMoves.shift();
        }

        BossFightingPage.update_feed();
        //choose move
        this.choose_move();
        this.current_stats = this.move.modify_stats(this.stats);
    }

    tick(tick_per_sec, target) {
        this.attack_counter = this.attack_counter.add(new Decimal(1).div(tick_per_sec));
        if(this.attack_counter.gte(this.attack_time)) {
            this.attack_counter = new Decimal(0);
            this.do_attack(target);
        }
    }

    get_attacked(power) {
        this.total_health = this.total_health.sub(power);
        this.floating_damage = this.floating_damage.add(power);
        let nr_units_dead = this.floating_damage.div(this.stats['Health']).floor();
        if(this.floating_damage.gte(this.stats['Health'])) {
            this.units = this.units.sub(nr_units_dead);
            this.floating_damage = this.floating_damage.sub(nr_units_dead.mul(this.stats['Health']));
        }
    }
    //a function which calculates how many units can there be around the boss at a given moment
    //works with numbers currently, please change this!
    get_nr_around = function(u_s) {
        function is_good(n, u_s) {
            let x = (n - 2) / (2 * n) * Math.PI;
            if(Math.cos(x) / (1 - Math.cos(x)) >= u_s) {
                return true;
            }
            return false;
        };

        u_s = u_s / this.size;
        let bot = 2, top = this.size * 10;
        let mid = Math.floor( (top + bot) / 2 );
        while(!is_good(mid, u_s)) {
            top = mid;
            mid = Math.floor( (top + bot) / 2 );
            if(mid == 2) {
                return 2;
            }
        }
        let last;
        while(is_good(mid, u_s)) {
            last = mid;
            bot = mid;
            mid = Math.floor( (top + bot) / 2 );
        }
        return last;
    }

    deploy_unit_around(army) {
        this.enemies_around.push(new FightingUnit(army));
    }
};

class BossSelectArmyButtonsClass extends ButtonGroupClass {
    constructor(container_idetifier, button_identifier, selected_style, default_style, number) {
        container_idetifier += ".n" + String(number);
        super(container_idetifier, button_identifier, selected_style, default_style);

        this.number = number;
        this.selected = -1;
    }
    showButton(button_nr) {
        super.showButton(button_nr);
        this.buttons[button_nr].hidden = false;
    }
    hideButton(button_nr) {
        super.hideButton(button_nr);
        this.buttons[button_nr].hidden = true;
    }
    deselect() {
        if(this.selected != -1) {
            for(let [key, value] of Object.entries(this.defaultStyle)) {
                this.buttons[this.selected].style[key] = value;
            }
            this.selected = -1;
        }
    }

    buttonClick(button_nr) {
        //reset old armies
        if(BossArmySelectionPage.fight.selected_armies[this.number] != -1) {
            for(let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
                if(this.number != k) {
                    BossArmySelectionPage.armySelects[k].showButton(button_nr);
                }
            }
        }
        //if you select the same army again
        if(button_nr == this.selected) {
            BossArmySelectionPage.fight.selected_armies[this.number] = -1;
            BossArmySelectionPage.armyInfos[this.number].innerHTML = "No army to be seen here.";
        }
        //if you selected a new army
        else {
            BossArmySelectionPage.fight.selected_armies[this.number] = button_nr;
            BossArmySelectionPage.armyInfos[this.number].innerHTML = Player.armies[button_nr].get_fighting_stats_text();
            for(let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
                if(k != this.number) {
                    BossArmySelectionPage.armySelects[k].hideButton(button_nr);
                }
            }
        }

        //do button group things
        if(this.selected == button_nr) {
            this.deselect();
        }
        else {
            if(this.selected != -1) {
                for(let [key, value] of Object.entries(this.defaultStyle)) {
                    this.buttons[this.selected].style[key] = value;
                }
            }
            this.selectButton(button_nr);
        }
        BossArmySelectionPage.showHideFightButton();
    }
}

class BossArmySelectionPageClass extends PageClass {
    constructor(name) {
        super(name);

        this.nrArmies= 3;
        this.nrArmySelects= 3;
        //build armySelects component
        this.armySelects= [];
        for(let i = 0; i < this.nrArmies; i++) {
            this.armySelects.push(new BossSelectArmyButtonsClass('.toggle_button_container.page_boss_select_army', '.toggle_button', {'borderColor': 'var(--selected-toggle-button-border-color)'}, {'borderColor': 'var(--default-toggle-button-border-color)'}, i));
        }
        this.armyInfos= document.querySelectorAll('.select_boss_army_info');
        this.bossInfo= document.querySelector('#BossInfo');
        this.difficultyGauge = document.querySelector('#BossFightDifficultyGauge');
        this.fight = undefined;
        this.backButton = document.querySelector("#BackFromBossArmySelectionPage");
        this.startFightButton= document.querySelector('#StartBossFightButton');

        this.initializeEventListeners();
    }
    initializeEventListeners() {
        let c_obj = this;
        //start fight button
        this.startFightButton.addEventListener('click', function() {
            //reset boss fight page
            BossFightingPage.reset();
            BossFightingPage.fight = c_obj.fight;
            for(let i = 0; i < c_obj.fight.max_selectible_armies; i++) {
                if(c_obj.fight.selected_armies[i] != -1) {
                    let result = TowerPage.Tower.removeRaidedLevelByArmy(c_obj.fight.selected_armies[i]);
                    if(result != undefined) {
                        BossFightingPage.armiesRemovedFrom.push();
                    }
                }
            }
            c_obj.reset();
            HidePages('BossFightingPage');
        });
        //Back to tower page button
        this.backButton.addEventListener('click', function() {
            //get page buttons back
            document.querySelector("#PageButtonsContainer").hidden = false;
            document.querySelector('#PageTopResourcesContainer').hidden = false;
            //return to tower page
            HidePages('TowerPage');
        });
    }
    displayOnLoad() {}
    display() {
        //show necessary army selects
        for(let i = 0; i < this.fight.max_selectible_armies; i++) {
            this.armySelects[i].container.parentElement.hidden = false;
            this.armySelects[i].deselect();
        }
        //hide ones that are not useable in current fight
        for(let i = this.fight.max_selectible_armies; i < this.nrArmySelects; i++) {
            this.armySelects[i].container.parentElement.hidden = true;
        }
        this.bossInfo.innerHTML = stuff['bosses'][this.fight.bosses[0]].get_text();
        if(this.timesVisited == 0) {
            TutorialPage.unlockTutorial('Boss Fighting Army Selection Page');
            TutorialPage.startTutorial('Boss Fighting Army Selection Page', true, 'BossArmySelectionPage');
        }
        this.timesVisited++;
    }
    displayEveryTick(c_obj) {}
    save() {
        let save_text = super.save();

        return save_text;
    }
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = super.load(save_text);
    }
    showHideFightButton() {
        for(let i in this.fight.selected_armies) {
            if(this.fight.selected_armies[i] != -1 && Player.armies[this.fight.selected_armies[i]].creature != 'None') {
                this.startFightButton.hidden = false;
                return;
            }
        }
        this.startFightButton.hidden = true;
    }
    reset() {
        this.startFightButton.hidden = true;
        for(let i = 0; i < this.fight.max_selectible_armies; i++) {
            this.armySelects[i].selectButton([this.fight.selected_armies[i]]);
            this.armyInfos[i].innerHTML = "No army to be seen here.";
        }
    }
};

let BossArmySelectionPage = new BossArmySelectionPageClass('BossArmySelectionPage');

class BossFightingPageClass extends PageClass {
    constructor(name) {
        super(name);

        this.fight = undefined;

        //applicable to all status bars
        this.barWidth= 300;

        //army status bars
        this.nrArmyStatusBars= 3;
        this.barElementsPerArmy= 6;
        this.armyStatusBars = [];

        let status_bars = document.querySelectorAll('.army_in_boss_fight_bar');
        for(let i = 0; i < this.nrArmyStatusBars; i++) {
            this.armyStatusBars.push([]);
            for(let j = 0; j < this.barElementsPerArmy; j++) {
                this.armyStatusBars[i].push(status_bars[i * this.barElementsPerArmy + j]);
            }
        }

        //boss status bars
        this.nrBossStatusBats= 1;
        this.barElementsPerBoss= 6;
        this.bossStatusBars = [];

        status_bars = document.querySelectorAll('.boss_in_boss_fight_bar');
        for(let i = 0; i < this.nrBossStatusBats; i++) {
            this.bossStatusBars.push([]);
            for(let j = 0; j < this.barElementsPerBoss; j++) {
                this.bossStatusBars[i].push(status_bars[i * this.barElementsPerBoss+ j]);
            }
        }
        
        //feed
        this.feedElements= [];
        this.feedMoves= [];
        this.feedElements = document.querySelectorAll('.boss_fight_move_feed_element');

        this.fightingArmies= [];
        this.fightingBosses= [];
        this.fightingArmyStatuses= [];
        this.fightingBossStatuses= [];
        this.fightingArmiesNr= 0;
        this.fightingBossesNr= 0;
        this.armiesRemovedFrom= [];
                
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        let c_obj = this;

        //feed elements
        for(let i = 0; i < this.feedElements.length; i++) {
            this.feedElements[i].addEventListener('mouseenter', function(event) {
                if(c_obj.feedElements[i].innerHTML != '') {
                    //display anew only if mouse was moved
                    if(!(PopupWindow.left == event.clientX && PopupWindow.top == event.clientY)) {
                        let feed_elem = c_obj.feedMoves[c_obj.feedMoves.length - 1 - i];
                        PopupWindow.show(event.clientX, event.clientY, feed_elem[0].moveset.get_move_description(...feed_elem[1]));
                    }
                    
                }
            }); 
            this.feedElements[i].addEventListener('mousemove', function(event) {
                let feed_elem = c_obj.feedMoves[c_obj.feedMoves.length - 1 - i];
                PopupWindow.show(event.clientX, event.clientY, feed_elem[0].moveset.get_move_description(...feed_elem[1]));
            }); 
            this.feedElements[i].addEventListener('mouseleave', function(event) {
                PopupWindow.hide();
            }); 
        }
    }
    displayOnLoad() {
    }
    display() {
        //if not yet visited, show tutorial
        if(this.timesVisited == 0) {
            TutorialPage.unlockTutorial('Boss Fighting Page');
            TutorialPage.startTutorial('Boss Fighting Page', true, 'BossFightingPage');
        }
        //else set up the fight
        else {
            for(let i = 0; i < this.fight.max_selectible_armies; i++) {
                this.armyStatusBars[i][0].parentElement.parentElement.hidden = false;
                //create actually fighting armies
                this.fightingArmies.push(new FightingArmy(Player.armies[this.fight.selected_armies[i]]));
                this.fightingArmyStatuses.push(1);
            }
            this.fightingArmiesNr = this.fight.max_selectible_armies;
    
            for(let i = this.fight.max_selectible_armies; i < this.nrArmyStatusBars; i++) {
                this.armyStatusBars[i][0].parentElement.parentElement.hidden = true;
                this.fightingBossStatuses.push(1);
            }
            this.fightingBossesNr = 1;
    
            //create actually fighting boss
            this.fightingBosses.push(new FightingBoss(stuff['bosses'][this.fight.bosses[0]]));
            this.deploy_armies();
            document.querySelector('.boss_in_boss_fight_name').innerHTML = this.fight.bosses[0];
        }
        this.timesVisited++;
    }
    displayEveryTick(c_obj) {
        //fill in sliders
        for(let i = 0; i < c_obj.fightingArmies.length; i++) {
            //health foreground
            c_obj.armyStatusBars[i][0].style.width = c_obj.get_width(c_obj.fightingArmies[i].total_health, c_obj.fightingArmies[i].max_total_health) ;
            c_obj.armyStatusBars[i][1].innerHTML = StylizeDecimals(c_obj.fightingArmies[i].total_health) + '/' + StylizeDecimals(c_obj.fightingArmies[i].max_total_health);
            //unit nr foreground
            c_obj.armyStatusBars[i][2].style.width = c_obj.get_width(c_obj.fightingArmies[i].units, c_obj.fightingArmies[i].max_units) ;
            c_obj.armyStatusBars[i][3].innerHTML = StylizeDecimals(c_obj.fightingArmies[i].units, true) + '/' + StylizeDecimals(c_obj.fightingArmies[i].max_units, true) +
                                                            ' (' + StylizeDecimals(c_obj.fightingArmies[i].deployed, true) + ')';
            //attack status foreground
            c_obj.armyStatusBars[i][4].style.width = c_obj.get_width(c_obj.fightingArmies[i].attack_counter, c_obj.fightingArmies[i].attack_time);
            c_obj.armyStatusBars[i][5].innerHTML = StylizeDecimals(c_obj.fightingArmies[i].get_total_attack(c_obj.fightingBosses[0]) );
        }

        for(let i = 0; i < c_obj.fightingBosses.length; i++) {
            //health foreground
            c_obj.bossStatusBars[i][0].style.width = c_obj.get_width(c_obj.fightingBosses[i].total_health, c_obj.fightingBosses[i].max_total_health) ;
            c_obj.bossStatusBars[i][1].innerHTML = StylizeDecimals(c_obj.fightingBosses[i].total_health) + '/' + StylizeDecimals(c_obj.fightingBosses[i].max_total_health);
            //unit nr foreground
            c_obj.bossStatusBars[i][2].style.width = c_obj.get_width(c_obj.fightingBosses[i].units, c_obj.fightingBosses[i].max_units) ;
            c_obj.bossStatusBars[i][3].innerHTML = StylizeDecimals(c_obj.fightingBosses[i].units, true) + '/' + StylizeDecimals(c_obj.fightingBosses[i].max_units, true);
            //attack status foreground
            c_obj.bossStatusBars[i][4].style.width = c_obj.get_width(c_obj.fightingBosses[i].attack_counter, c_obj.fightingBosses[i].attack_time);
            c_obj.bossStatusBars[i][5].innerHTML = StylizeDecimals(c_obj.fightingBosses[i].get_total_attack());
        }

        if(c_obj.do_fight()) {
            c_obj.resolve_win();
        }
    }
    save() {
        let save_text = super.save();

        return save_text;
    }
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = super.load(save_text);
    }
    deploy_armies() {
        for(let i = 0; i < this.fightingArmies.length; i++) {
            this.fightingArmies[i].deploy_around_boss(this.fightingBosses[0]);
        }
        this.fightingBosses[0].get_targets();
    }
    get_width(curr, max) {
        return new Decimal(this.barWidth).mul( curr.div(max) ).floor().toNumber();
    }
    do_fight() {
        for(let i = 0; i < this.fightingArmies.length; i++) {
            if(this.fightingArmyStatuses[i] == 1) {
                this.fightingArmies[i].tick(20, this.fightingBosses[0]);
                if(this.fightingArmies[i].total_health.lte(0.00001)) {
                    this.fightingArmyStatuses[i] = 0;
                    this.fightingArmies[i].total_health = new Decimal(0);
                    this.fightingArmiesNr -= 1;
                    if(this.fightingArmiesNr == 0) {
                        return true;
                    }
                }
            }
            
        }

        for(let i = 0; i < this.fightingBosses.length; i++) {
            if(this.fightingBossStatuses[i] == 1) {
                this.fightingBosses[i].tick(20, this.fightingArmies[0]);
                if(this.fightingBosses[i].total_health.lte(0.00001)) {
                    this.fightingBossStatuses[i] = 0;
                    this.fightingBosses[i].total_health = new Decimal(0);
                    this.fightingBossesNr -= 1;
                    if(this.fightingBossesNr == 0) {
                        return true;
                    }
                }
            }
            
        }
    }
    resolve_win() {
        //Boss won
        if(this.fightingArmiesNr == 0) {
            
        }
        //Army won
        else {

        }
        //put armies back to raid what they were raiding before
        for(let i = 0; i < this.armiesRemovedFrom.length; i++) {
            TowerPage.Tower.raidedLevels.push(this.armiesRemovedFrom[i]);
        }
    
        //change page to fight end page
        HidePages('BossFightingResultPage');
    }
    update_feed() {
        let i, ii = this.feedMoves.length - 1;
        for(i = 0; i < this.feedMoves.length; i++, ii--) {
            this.feedElements[ii].innerHTML = '<br>' + this.feedMoves[i][0].moveset.get_move_name(...this.feedMoves[i][1]) + '<br>';
        }
        for(i; i < this.feedElements.length;i++) {
            this.feedElements[i].innerHTML = '';
        }
    }
    reset() {
        //reset fighting armies and bosses
        this.fightingArmies =[];
        this.fightingArmiesNr = 0;
        this.fightingBosses = [];
        this.fightingBossesNr = 0;
        this.fightingArmyStatuses = [];
        this.fightingBossStatuses = [];
        //reset army removal (from raiding a tower level) tracker array
        this.armiesRemovedFrom = [];
        //reset feed
        this.feedMoves = [];
        this.update_feed();
    }
};

let BossFightingPage = new BossFightingPageClass('BossFightingPage');

class BossFightingResultPageClass extends PageClass {
    constructor(name) {
        super(name);

        this.resultInfo= document.querySelector("#AfterFightMessage");
        this.backButton = document.querySelector("#BackButtonFromResults");

        this.initializeEventListeners();
    }
    initializeEventListeners() {
        //Back to tower page button
        this.backButton.addEventListener('click', function() {
            //get resource bar and page buttons back
            document.querySelector("#PageButtonsContainer").hidden = false;
            document.querySelector('#PageTopResourcesContainer').hidden = false;
            //return to tower page
            HidePages('TowerPage');
        });
    }
    displayOnLoad() {}
    display() {
        this.resultInfo.innerHTML = this.generate_message();
    }
    displayEveryTick(c_obj) {}
    save() {
        let save_text = super.save();

        return save_text;
    }
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = super.load(save_text);
    }
    generate_message() {
        let t;
        if(BossFightingPage.fightingArmiesNr == 0) {
            t = 'You lost!<br>';
            if(BossFightingPage.fight.lose_soldiers) {
                t += 'With your loss, you lost all your soldiers as well!';
            }
            else {
                t += 'Don\'t worry though, you didn\'t lose anyone, the magic of the Tower kept them all alive.';
            }
            
        }
        else {
            t = 'You won!<br>';
            if(BossFightingPage.fight.lose_soldiers) {
                t += "Though you lost part of your army.";
            }
            else {
                t += 'Thank you for playing the game! <br> If you have a minute, I would really appreciate it if ' + 
                'you could give me some feedback through <a href="https://forms.gle/rMwKTcsQJGxfFLDN8">a survey here</a> or in private.<br> Thank you for your time again!';
            }
        }
        return t;
    }
};

let BossFightingResultPage = new BossFightingResultPageClass('BossFightingResultPage')