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
            BossArmySelectionPage.armySelects[i][0].parentElement.hidden = false;
        }
        //hide ones that are not useable in current fight
        for(let i = BossArmySelectionPage.fight.max_selectible_armies; i < BossArmySelectionPage.nrArmySelects; i++) {
            BossArmySelectionPage.armySelects[i][0].parentElement.hidden = true;
        }
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
BossArmySelectionPage.startFightButton = document.querySelector('#StartBossFightButton');
BossArmySelectionPage.startFightButton.addEventListener('click', function() {
    BossFightPage.fight = BossArmySelectionPage.fight;
    HidePages(6);
});

//click events for army selection buttons
//i represents the position where an army is selected
for(let i = 0; i < BossArmySelectionPage.nrArmies; i++) {
    //j represents the army that was selected
    for(let j = 0; j < BossArmySelectionPage.nrArmySelects; j++) {
        BossArmySelectionPage.armySelects[i][j].addEventListener('click', function() {
            //reset old armies
            if(BossArmySelectionPage.fight.selected_armies[i] != -1) {
                BossArmySelectionPage.armySelects[i][BossArmySelectionPage.fight.selected_armies[i]].style.borderColor = 'orangered';
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
                BossArmySelectionPage.armySelects[i][j].style.borderColor = 'blue';
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
        this.floating_damage = new Decimal(0);
    }

    get_total_attack(target) {
        return this.units.mul( this.stats.get_power(target.stats, 'Attack', 'Defense') );
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

    get_attacked(power) {
        this.total_health = this.total_health.sub(power);
        this.floating_damage = this.floating_damage.add(power);
        let nr_units_dead = this.floating_damage.div(this.stats['Health']).floor();
        if(this.floating_damage.gte(this.stats['Health'])) {
            this.units = this.units.sub(nr_units_dead);
            this.floating_damage = this.floating_damage.sub(nr_units_dead.mul(this.stats['Health']));
        }
    }
};

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
    }

    get_total_attack(target) {
        return this.units.mul( this.stats.get_power(target.stats, 'Attack', 'Defense') );
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

    get_attacked(power) {
        this.total_health = this.total_health.sub(power);
        this.floating_damage = this.floating_damage.add(power);
        let nr_units_dead = this.floating_damage.div(this.stats['Health']).floor();
        if(this.floating_damage.gte(this.stats['Health'])) {
            this.units = this.units.sub(nr_units_dead);
            this.floating_damage = this.floating_damage.sub(nr_units_dead.mul(this.stats['Health']));
        }
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
        
    },
    get_width(curr, max) {
        return new Decimal(BossFightPage.barWidth).mul( curr.div(max) ).floor().toNumber();
    },
    do_fight() {
        for(let i = 0; i < BossFightPage.fightingArmies.length; i++) {
            if(BossFightPage.fightingArmyStatuses[i] == 1) {
                BossFightPage.fightingArmies[i].tick(20, BossFightPage.fightingBosses[0]);
                if(BossFightPage.fightingArmies[i].total_health.lt(0)) {
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
                if(BossFightPage.fightingBosses[i].total_health.lte(0)) {
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
            BossFightPage.armyStatusBars[i][3].innerHTML = StylizeDecimals(BossFightPage.fightingArmies[i].units, true) + '/' + StylizeDecimals(BossFightPage.fightingArmies[i].max_units, true);
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

const BossFightingResultPage = {
    container : undefined,
    displayOnLoad() {
    },
    display() {
    },
    displayEveryTick() {
    },
    load() {},
};

BossFightingResultPage.container = document.querySelector('#BossFightingResultPageContainer');

