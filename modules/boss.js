const BossArmySelectionPage = {
    container : undefined,
    armySelects: [[],[],[]],
    armyInfos: [],
    bossInfo: undefined,
    difficultyGauge : undefined,
    fight : undefined,
    nrArmies: 3,
    nrArmySelects: 3,
    startFightButton: undefined,
    displayOnLoad() {
    },
    display() {
        //show necessary army selects
        for(let i = 0; i < BossArmySelectionPage.fight.max_selectible_armies; i++) {
            BossArmySelectionPage.armySelects[i][0].parentElement.parentElement.hidden = false;
        }
        //hide ones that are not useable in current fight
        for(let i = BossArmySelectionPage.fight.max_selectible_armies; i < BossArmySelectionPage.nrArmySelects; i++) {
            BossArmySelectionPage.armySelects[i][0].parentElement.parentElement.hidden = true;
        }
        BossArmySelectionPage.bossInfo.innerHTML = stuff['bosses'][BossArmySelectionPage.fight.bosses[0]].get_text();
    },
    displayEveryTick() {
    },
    showHideFightButton() {
        for(let i in BossArmySelectionPage.fight.selected_armies) {
            if(BossArmySelectionPage.fight.selected_armies[i] != -1 && Player.armies[BossArmySelectionPage.fight.selected_armies[i]].creature != 'None') {
                BossArmySelectionPage.startFightButton.hidden = false;
                return;
            }
        }
        BossArmySelectionPage.startFightButton.hidden = true;
    },
    reset() {
        BossArmySelectionPage.startFightButton.hidden = true;
        for(let i = 0; i < BossArmySelectionPage.fight.max_selectible_armies; i++) {
            BossArmySelectionPage.armySelects[i][BossArmySelectionPage.fight.selected_armies[i]].style.borderColor='var(--default-toggle-button-border-color)';
            BossArmySelectionPage.armyInfos[i].innerHTML = "No army to be seen here.";
        }
    },
    save() {},
    load() {},
};

BossArmySelectionPage.container = document.querySelector('#BossArmySelectionPageContainer');
BossArmySelectionPage.armyInfos = document.querySelectorAll('.select_boss_army_info');
//build armySelects component
let selects = document.querySelectorAll('.select_boss_army_button');
for(let i = 0; i < BossArmySelectionPage.nrArmies; i++) {
    for(let j = 0; j < BossArmySelectionPage.nrArmySelects; j++) {
        BossArmySelectionPage.armySelects[i].push(selects[i*3 + j]);
    }
}
BossArmySelectionPage.bossInfo = document.querySelector('#BossInfo');
BossArmySelectionPage.difficultyGauge = document.querySelector('#BossFightDifficultyGauge');
//start fight button
BossArmySelectionPage.startFightButton = document.querySelector('#StartBossFightButton');
BossArmySelectionPage.startFightButton.addEventListener('click', function() {
    //reset boss fight page
    BossFightPage.reset();
    BossFightPage.fight = BossArmySelectionPage.fight;
    for(let i = 0; i < BossArmySelectionPage.fight.max_selectible_armies; i++) {
        for(let j = 0; j < TowerPage.Tower.raidedFloors.length; j++) {
            if(TowerPage.Tower.raidedFloors[j][0] == BossArmySelectionPage.fight.selected_armies[i]) {
                
                BossFightPage.armiesRemovedFrom.push(TowerPage.Tower.raidedFloors.splice(j,1)[0]);
                break;
            }
        }
    }
    BossArmySelectionPage.reset();
    HidePages(6);
});
//Back to tower page button
document.querySelector("#BackFromBossArmySelectionPage").addEventListener('click', function() {
    //get page buttons back
    document.querySelector("#PageButtonsContainer").hidden = false;
    document.querySelector('#PageTopResourcesContainer').hidden = false;
    //return to tower page
    HidePages(0);
});

//click events for army selection buttons
//i represents the position where an army is selected
for(let i = 0; i < BossArmySelectionPage.nrArmies; i++) {
    //j represents the army that was selected
    for(let j = 0; j < BossArmySelectionPage.nrArmySelects; j++) {
        BossArmySelectionPage.armySelects[i][j].addEventListener('click', function() {
            //reset old armies
            if(BossArmySelectionPage.fight.selected_armies[i] != -1) {
                BossArmySelectionPage.armySelects[i][BossArmySelectionPage.fight.selected_armies[i]].style.borderColor = 'var(--default-toggle-button-border-color)';
                for(let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
                    if(i != k) {
                        BossArmySelectionPage.armySelects[k][BossArmySelectionPage.fight.selected_armies[i]].hidden = false;
                    }
                }
            }
            //if you select the same army again
            if(j == BossArmySelectionPage.fight.selected_armies[i]) {
                BossArmySelectionPage.fight.selected_armies[i] = -1;
                BossArmySelectionPage.armyInfos[i].innerHTML = "No army to be seen here.";
            }
            //if you selected a new army
            else {
                BossArmySelectionPage.fight.selected_armies[i] = j;
                BossArmySelectionPage.armyInfos[i].innerHTML = Player.armies[j].get_fighting_stats_text();
                BossArmySelectionPage.armySelects[i][j].style.borderColor = 'var(--selected-toggle-button-border-color)';
                for(let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
                    if(k != i) {
                        BossArmySelectionPage.armySelects[k][j].hidden = true;
                    }
                }
            }
            BossArmySelectionPage.showHideFightButton();
        });
    }
}

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
    static move_rarities = {0:'Common', 1: 'Uncommon', 2: 'Rare', 3:'Super', 4:'Ultra'}
    static rarity_colors = {0: 'aliceblue', 1: '#20d000', 2: '#4848ff', 3: '#b000b0', 4: '#FF0000'}
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
        
        this.move = this.moveset.get_move();
        this.current_stats = this.move.modify_stats(this.stats);
        this.size = boss.size;

        this.enemies_around = []
        
    }

    get_total_attack(target) {
        return this.units.mul( this.current_stats.get_power(target, 'Attack', 'Defense') );
    }

    do_attack(target) {
        //find attack targets
        let targets = [];
        for(let i = 0; i < this.move.attack_targets; i++) {
            let nr = Math.floor(Math.random() * this.enemies_around.length);
            targets.push(nr);
        }
        //attack them
        let dead = []
        for(let i = 0; i < targets.length; i++) {
            let enemy = this.enemies_around[targets[i]];
            //if the enemy was targeted multiple times, but by now is dead, just roll with it
            if(enemy.is_dead) {
                continue;
            }
            let power = this.current_stats.get_power(enemy.stats, 'Attack', 'Defense');
            enemy.lose_health(power);
            if(enemy.is_dead) {
                //remove enemy from around boss
                dead.push(targets[i]);
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
        BossFightPage.feedMoves.push([this, this.moveset.current_move_place]);
        if(BossFightPage.feedMoves.length > BossFightPage.feedElements.length) {
            BossFightPage.feedMoves.shift();
        }

        BossFightPage.update_feed();
        this.move = this.moveset.get_move();
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

const BossFightPage = {
    container : undefined,
    fight : undefined,
    armyStatusBars : [],
    nrArmyStatusBars: 3,
    barElementsPerArmy: 6,
    bossStatusBars : [],
    nrBossStatusBats: 1,
    barElementsPerBoss: 6,
    barWidth: 300,
    fightingArmies: [],
    fightingBosses: [],
    fightingArmyStatuses: [],
    fightingBossStatuses: [],
    fightingArmiesNr: 0,
    fightingBossesNr: 0,
    armiesRemovedFrom: [],
    feedElements: [],
    feedMoves: [],
    displayOnLoad() {
    },
    display() {
        for(let i = 0; i < BossFightPage.fight.max_selectible_armies; i++) {
            BossFightPage.armyStatusBars[i][0].parentElement.parentElement.hidden = false;
            //create actually fighting armies
            BossFightPage.fightingArmies.push(new FightingArmy(Player.armies[BossFightPage.fight.selected_armies[i]]));
            BossFightPage.fightingArmyStatuses.push(1);
        }
        BossFightPage.fightingArmiesNr = BossFightPage.fight.max_selectible_armies;

        for(let i = BossFightPage.fight.max_selectible_armies; i < BossFightPage.nrArmyStatusBars; i++) {
            BossFightPage.armyStatusBars[i][0].parentElement.parentElement.hidden = true;
            BossFightPage.fightingBossStatuses.push(1);
        }
        BossFightPage.fightingBossesNr = 1;

        //create actually fighting boss
        BossFightPage.fightingBosses.push(new FightingBoss(stuff['bosses'][BossFightPage.fight.bosses[0]]));
        BossFightPage.deploy_armies();
        document.querySelector('.boss_in_boss_fight_name').innerHTML = BossFightPage.fight.bosses[0];
    },
    deploy_armies() {
        for(let i = 0; i < BossFightPage.fightingArmies.length; i++) {
            BossFightPage.fightingArmies[i].deploy_around_boss(BossFightPage.fightingBosses[0]);
        }
    },
    get_width(curr, max) {
        return new Decimal(BossFightPage.barWidth).mul( curr.div(max) ).floor().toNumber();
    },
    do_fight() {
        for(let i = 0; i < BossFightPage.fightingArmies.length; i++) {
            if(BossFightPage.fightingArmyStatuses[i] == 1) {
                BossFightPage.fightingArmies[i].tick(20, BossFightPage.fightingBosses[0]);
                if(BossFightPage.fightingArmies[i].total_health.lte(0.00001)) {
                    BossFightPage.fightingArmyStatuses[i] = 0;
                    BossFightPage.fightingArmies[i].total_health = new Decimal(0);
                    BossFightPage.fightingArmiesNr -= 1;
                    if(BossFightPage.fightingArmiesNr == 0) {
                        return true;
                    }
                }
            }
            
        }

        for(let i = 0; i < BossFightPage.fightingBosses.length; i++) {
            if(BossFightPage.fightingBossStatuses[i] == 1) {
                BossFightPage.fightingBosses[i].tick(20, BossFightPage.fightingArmies[0]);
                if(BossFightPage.fightingBosses[i].total_health.lte(0.00001)) {
                    BossFightPage.fightingBossStatuses[i] = 0;
                    BossFightPage.fightingBosses[i].total_health = new Decimal(0);
                    BossFightPage.fightingBossesNr -= 1;
                    if(BossFightPage.fightingBossesNr == 0) {
                        return true;
                    }
                }
            }
            
        }
    },
    resolve_win() {
        //Boss won
        if(BossFightPage.fightingArmiesNr == 0) {
            
        }
        //Army won
        else {

        }
        //put armies back to raid what they were raiding before
        for(let i = 0; i < BossFightPage.armiesRemovedFrom.length; i++) {
            TowerPage.Tower.raidedFloors.push(BossFightPage.armiesRemovedFrom[i]);
        }
    
        //change page to fight end page
        HidePages(7);
    },
    displayEveryTick() {
        //fill in sliders
        for(let i = 0; i < BossFightPage.fightingArmies.length; i++) {
            //health foreground
            BossFightPage.armyStatusBars[i][0].style.width = BossFightPage.get_width(BossFightPage.fightingArmies[i].total_health, BossFightPage.fightingArmies[i].max_total_health) ;
            BossFightPage.armyStatusBars[i][1].innerHTML = StylizeDecimals(BossFightPage.fightingArmies[i].total_health) + '/' + StylizeDecimals(BossFightPage.fightingArmies[i].max_total_health);
            //unit nr foreground
            BossFightPage.armyStatusBars[i][2].style.width = BossFightPage.get_width(BossFightPage.fightingArmies[i].units, BossFightPage.fightingArmies[i].max_units) ;
            BossFightPage.armyStatusBars[i][3].innerHTML = StylizeDecimals(BossFightPage.fightingArmies[i].units, true) + '/' + StylizeDecimals(BossFightPage.fightingArmies[i].max_units, true) +
                                                            ' (' + StylizeDecimals(BossFightPage.fightingArmies[i].deployed, true) + ')';
            //attack status foreground
            BossFightPage.armyStatusBars[i][4].style.width = BossFightPage.get_width(BossFightPage.fightingArmies[i].attack_counter, BossFightPage.fightingArmies[i].attack_time);
            BossFightPage.armyStatusBars[i][5].innerHTML = StylizeDecimals(BossFightPage.fightingArmies[i].get_total_attack(BossFightPage.fightingBosses[0]) );
        }

        for(let i = 0; i < BossFightPage.fightingBosses.length; i++) {
            //health foreground
            BossFightPage.bossStatusBars[i][0].style.width = BossFightPage.get_width(BossFightPage.fightingBosses[i].total_health, BossFightPage.fightingBosses[i].max_total_health) ;
            BossFightPage.bossStatusBars[i][1].innerHTML = StylizeDecimals(BossFightPage.fightingBosses[i].total_health) + '/' + StylizeDecimals(BossFightPage.fightingBosses[i].max_total_health);
            //unit nr foreground
            BossFightPage.bossStatusBars[i][2].style.width = BossFightPage.get_width(BossFightPage.fightingBosses[i].units, BossFightPage.fightingBosses[i].max_units) ;
            BossFightPage.bossStatusBars[i][3].innerHTML = StylizeDecimals(BossFightPage.fightingBosses[i].units, true) + '/' + StylizeDecimals(BossFightPage.fightingBosses[i].max_units, true);
            //attack status foreground
            BossFightPage.bossStatusBars[i][4].style.width = BossFightPage.get_width(BossFightPage.fightingBosses[i].attack_counter, BossFightPage.fightingBosses[i].attack_time);
            BossFightPage.bossStatusBars[i][5].innerHTML = StylizeDecimals(BossFightPage.fightingBosses[i].get_total_attack(BossFightPage.fightingArmies[0]) );
        }

        if(BossFightPage.do_fight()) {
            BossFightPage.resolve_win();
        }
    },
    update_feed() {
        let i, ii = BossFightPage.feedMoves.length - 1;
        for(i = 0; i < BossFightPage.feedMoves.length; i++, ii--) {
            BossFightPage.feedElements[ii].innerHTML = '<br>' + BossFightPage.feedMoves[i][0].moveset.get_move_name(...BossFightPage.feedMoves[i][1]) + '<br>';
        }
        for(i; i < BossFightPage.feedElements.length;i++) {
            BossFightPage.feedElements[i].innerHTML = '';
        }
    },
    reset() {
        //reset fighting armies and bosses
        BossFightPage.fightingArmies =[];
        BossFightPage.fightingArmiesNr = 0;
        BossFightPage.fightingBosses = [];
        BossFightPage.fightingBossesNr = 0;
        BossFightPage.fightingArmyStatuses = [];
        BossFightPage.fightingBossStatuses = [];
        //reset army removal (from raiding a tower level) tracker array
        BossFightPage.armiesRemovedFrom = [];
        //reset feed
        BossFightPage.feedMoves = [];
        BossFightPage.update_feed();
    },
    save() {},
    load() {},
    
}
BossFightPage.container = document.querySelector('#BossFightPageContainer');

//get army status bars
let status_bars = document.querySelectorAll('.army_in_boss_fight_bar');
for(let i = 0; i < BossFightPage.nrArmyStatusBars; i++) {
    BossFightPage.armyStatusBars.push([]);
    for(let j = 0; j < BossFightPage.barElementsPerArmy; j++) {
        BossFightPage.armyStatusBars[i].push(status_bars[i * BossFightPage.barElementsPerArmy + j]);
    }
}

//get boss status bars
status_bars = document.querySelectorAll('.boss_in_boss_fight_bar');
for(let i = 0; i < BossFightPage.nrBossStatusBats; i++) {
    BossFightPage.bossStatusBars.push([]);
    for(let j = 0; j < BossFightPage.barElementsPerBoss; j++) {
        BossFightPage.bossStatusBars[i].push(status_bars[i * BossFightPage.barElementsPerBoss+ j]);
    }
}

//feed elements
BossFightPage.feedElements = document.querySelectorAll('.boss_fight_move_feed_element');
for(let i = 0; i < BossFightPage.feedElements.length; i++) {
    BossFightPage.feedElements[i].addEventListener('mouseenter', function(event) {
        if(BossFightPage.feedElements[i].innerHTML != '') {
            //display anew only if mouse was moved
            if(!(PopupWindow.left == event.clientX && PopupWindow.top == event.clientY)) {
                let feed_elem = BossFightPage.feedMoves[BossFightPage.feedMoves.length - 1 - i];
                PopupWindow.show(event.clientX, event.clientY, feed_elem[0].moveset.get_move_description(...feed_elem[1]));
            }
            
        }
    }); 
    BossFightPage.feedElements[i].addEventListener('mousemove', function(event) {
        let feed_elem = BossFightPage.feedMoves[BossFightPage.feedMoves.length - 1 - i];
        PopupWindow.show(event.clientX, event.clientY, feed_elem[0].moveset.get_move_description(...feed_elem[1]));
    }); 
    BossFightPage.feedElements[i].addEventListener('mouseleave', function(event) {
        PopupWindow.hide();
    }); 
}

const BossFightingResultPage = {
    container : undefined,
    resultInfo: undefined,
    generate_message() {
        let t;
        if(BossFightPage.fightingArmiesNr == 0) {
            t = 'You lost!<br>';
            if(BossFightPage.fight.lose_soldiers) {
                t += 'With your loss, you lost all your soldiers as well!';
            }
            else {
                t += 'Don\'t worry though, you didn\'t lose anyone, the magic of the Tower kept them all alive.';
            }
            
        }
        else {
            t = 'You won!<br>';
            if(BossFightPage.fight.lose_soldiers) {
                t += "Though you lost part of your army.";
            }
            else {
                t += 'Don\'t worry, you didn\'t lose anyone, the magic of the Tower kept them all alive.';
            }
        }
        return t;
    },
    displayOnLoad() {
    },
    display() {
        BossFightingResultPage.resultInfo.innerHTML = BossFightingResultPage.generate_message();
    },
    displayEveryTick() {
    },
    save() {},
    load() {},
};

BossFightingResultPage.container = document.querySelector('#BossFightingResultPageContainer');
BossFightingResultPage.resultInfo = document.querySelector("#AfterFightMessage");

//Back to tower page button
document.querySelector("#BackButtonFromResults").addEventListener('click', function() {
    //get resource bar and page buttons back
    document.querySelector("#PageButtonsContainer").hidden = false;
    document.querySelector('#PageTopResourcesContainer').hidden = false;
    //return to tower page
    HidePages(0);
});

