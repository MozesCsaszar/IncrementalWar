//regular save divider = '/*/'
class Army {
    static level_bonuses = [new Decimal(1), new Decimal(1.1), new Decimal(1.2), new Decimal(1.3), new Decimal(1.5), new Decimal(2)];
    static level_prices = [new Decimal(1000), new Decimal(10000), new Decimal(150000), new Decimal('2.3e6'), new Decimal('3e7')];

    constructor(creature = 'None', weapons = ['None','None','None','None','None','None','None','None'], stats = new Stats(), body_parts = new Stats(), size = new Decimal(0), raiding = -1) {
        this.creature = creature;
        this.weapons = weapons;
        this._stats = stats;
        this._body_parts = body_parts;
        this._size = size;
        this.level = 0;
        this.level_bonus = new Decimal(1);
        this.raiding = -1;

        this.power = new Decimal(1);
    }

    get stats() {
        return this._stats.mul(this.level_bonus);
    }

    set stats(other) {
        this._stats = other;
    }

    get size() {
        return this._size;
    }

    set size(value) {
        this._size = value;
    }

    get body_parts() {
        return this._body_parts;
    }

    set body_parts(value) {
        this._body_parts = value;
    }

    get max_weapons() {
        return 8;
    }

    //the function that decides what to do when a level up is requested
    level_up() {
        if(this.level < Army.level_prices.length && Army.level_prices[this.level].lt(Player.gold)) {
            Player.gold = Player.gold.sub(Army.level_prices[this.level]);
            this.level_up_helper();
        }
    }
    //the function that does the level up
    level_up_helper() {
        this.level++;
        this.level_bonus = this.level_bonus.mul(Army.level_bonuses[this.level]);
        
    }
    level_down(to_level) {
        while(this.level > to_level) {
            this.level_bonus = this.level_bonus.div(Army.level_bonuses[this.level]);
            this.level--;
        }
    }
    get_level_up_text() {
        this.level_up_helper();
        const new_army = [this.size,this.stats, this.body_parts]
        this.level_down(this.level - 1);
        return this.get_compare_text(new_army);
    }
    get_compare_level_text() {
        if(this.level >= Army.level_bonuses.length) {
            return 'Max level reached, cannot upgrade further, sorry. :)';
        }
        return 'Power multiplier: ' + StylizeDecimals(this.level_bonus) + '<span style="color:' + 
        UtilityFunctions.get_compare_color(this.level_bonus, this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + '">' +  ' → ' + 
        StylizeDecimals(this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + '</span>';
    }
    //helper function to change from one item's stats to the other
    change_stats(type, change_to, change_index) {
        switch(type) {
            case 'creatures':
                if(change_to != 'None') {
                    this._stats = stuff.creatures[change_to].stats.add(new Stats([],[]));
                    this._body_parts = stuff[type][change_to].body_parts.add(new Stats([], []));
                }
                else {
                    this.stats = this._stats.sub(stuff.creatures[this.creature].stats);
                    this._body_parts = this._body_parts.sub(stuff[type][this.creature].body_parts);
                }
                break;
            case 'weapons':
                if(this[type][change_index] != 'None') {
                    this._stats = this._stats.sub(stuff[type][this[type][change_index]].stats);
                    this._body_parts = this._body_parts.sub(stuff[type][this[type][change_index]].body_parts);
                }

                if(change_to != 'None') {
                    this._stats = this._stats.add(stuff[type][change_to].stats);
                    this._body_parts = this._body_parts.add(stuff[type][change_to].body_parts);
                }
                break;
        }
    }
    //REVAMP FROM HERE
    change_element(type, change_to, change_index = 0, unlock_stuff = true) {
        //if we are talking about a creature, then the change is big
        switch(type) {
            case 'creatures':
                //reset the size of the army
                this.set_size(new Decimal(0));

                //and remove elements and refund their costs
                for(let i = this.weapons.length - 1; i > -1; i--) {
                    this.change_element('weapons','None',i);
                }

                //change stats from old to new
                this.change_stats(type, change_to, change_index);
                
                //change the stats of the army
                this.creature = change_to;

                break;
            case 'weapons':
                if(change_to == this.weapons[change_index]) {
                    return false;
                }

                if(!this.change_element_helper('weapons',change_to,change_index, unlock_stuff)) {
                    return false;
                }
                break;
        }
        //send unlock request after change
        if(unlock_stuff) {
            Unlockables.unlock(['army','power'],this.power);
            Unlockables.unlock(['army','size'],this.size);
        }
        return true;
    }
    //CHANGE STUFF TO WORK FOR EVERYTHING TOGETHER, NOT CREATURES AND OTHER STUFF TREATED AS DIFFERENT CASES
    can_change_element(type, element, index) {
        if(type == 'creatures' || element == 'None') {
            return true;
        }
        else {
            let temp_s = undefined;
            let temp_b = undefined;
            if(this[type][index] != 'None') {
                this._stats = this._stats.sub(stuff[type][this[type][index]].stats);
                this._body_parts = this._body_parts.sub(stuff[type][this[type][index]].body_parts);
                temp_s = this.stats;
                temp_b = this.body_parts;
                this._stats = this._stats.add(stuff[type][this[type][index]].stats);
                this._body_parts = this._body_parts.add(stuff[type][this[type][index]].body_parts);
            }
            else {
                temp_s = this.stats;
                temp_b = this.body_parts;
            }
            if(temp_b.add(stuff[type][element].body_parts).gte(0)) {
                if(stuff[type][element].requires.lte(temp_s)) {
                    if(temp_s['Health'].gt(0)) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    //helps to change the stuff that is not creature in your army
    change_element_helper(type, change_to, change_index = 0, do_shift = true) {
        if(!this.can_change_element(type, change_to, change_index)) {
            return false;
        }
        if(this[type][change_index] != 'None') {
            Player.inventory[type][this[type][change_index]] = Player.inventory[type][this[type][change_index]].add(this.size);
        }
        //change stats from old to new
        this.change_stats(type, change_to, change_index);

        //add in the new one
        this[type][change_index] = change_to;

        //maybe display (/ remove the ones you cannot) just the ones you can use (handcount and the stuff)
        if(change_to != 'None') {
            //set new size of the army to if the number of this item is less than the size of the army min(size, number of new item)
            Player.inventory[type][change_to] = Player.inventory[type][change_to].sub(this.size);
            
            if(this.size > Player.inventory[type][change_to]) {
                this.set_size(this.size.add(Player.inventory[type][change_to]));
            }
        }

        //if changed to 'None' and weapon shifting is necessary
        else if(change_to == 'None' && do_shift){
            let i = change_index;
            //shift the elements to the left by one unit
            while(i < this.max_weapons - 1 && this[type][i + 1] != 'None') {    
                this[type][i] = this[type][i+1];
                this[type][i+1] = 'None';
                i++;
            }
        }
        return true;
    }
    set_size(new_size) {
        //if the creature is 'None', then there can be no army
        if(this.creature == 'None' || new_size.lt(new Decimal(0))) {
            return;
        }
        //calculate the minimun of the elements which are available
        let minn = (new_size.sub(this.size)).min(Player.inventory.creatures[this.creature]);
        let i = 0;
        while(this.weapons[i] != 'None') {
            minn = minn.min(Player.inventory.weapons[this.weapons[i]]);
            i++;
        }
        //set new size
        this.size = minn.add(this.size);
        //set new values for the inventory of items used
        Player.inventory.creatures[this.creature] = Player.inventory.creatures[this.creature].sub(minn);
        i = 0;
        while(this.weapons[i] != 'None') {
            Player.inventory.weapons[this.weapons[i]] = Player.inventory.weapons[this.weapons[i]].sub(minn);
            i++;
        }
        //give visual feedback on what you have here
        
        ArmyPage.armySizeInput.value = StylizeDecimals(this.size,true);
    }
    get_stats_text() {
        return this.stats.get_text() + '<br>' + this.body_parts.get_text(true);
    }
    get_change_text(type, change_to, change_index = 0) {
        //if you reset your creature, show this text
        let changed = undefined;
        if(type == 'creatures') {
            if(change_to == 'None') {
                return 'You would dismantle your army with this action.';
            }
            changed = this.creature;
        }
        else {
            changed = this[type][change_index];
        }
        //let size = this._size;
        //change element then change it back to view changes
        if(this.can_change_element(type, change_to, change_index)) {
            let new_army = undefined
            switch(type) {
                case 'creatures':
                    this.change_stats(type, change_to, change_index);
                    this.creature = change_to;
                    new_army = [this.size.min(Player.inventory[type][change_to]),this.stats, this.body_parts];
                    this.change_stats(type, changed, change_index);
                    this.creature = changed;
                    break;
                case 'weapons':
                    this.change_stats(type, change_to, change_index);
                    this[type][change_index] = change_to;
                    new_army = [this.size.min(Player.inventory[type][change_to]),this.stats, this.body_parts];
                    this.change_stats(type, changed, change_index);
                    this[type][change_index] = changed;
                    break;
            }
            return this.get_compare_text(new_army);
        }
        return "Cannot change this element of your army, sorry!";
    }
    //helper function to get_change_text
    get_compare_text(new_army) {
        if(!Array.isArray(new_army)) {
            new_army = [new_army.size,new_army.stats, new_army.body_parts];
        }
        let text = 'Size: ' + StylizeDecimals(this.size, true) + '<span style="color:' + UtilityFunctions.get_compare_color(this.size,new_army[0]) + ';">' +
        ' → ' +  StylizeDecimals(new_army[0],true) + '</span><br>';
        text += this.stats.get_compare_text(new_army[1]) + '<br>';
        text += this.body_parts.get_compare_text(new_army[2]);
        return text;
    }
    get_text(with_size = false) {
        if(this.creature == 'None') {
            return 'An army without a creature is nothing. You can\'t fight with it, nor do anything with it. Just sayin\'. So please buy some creatures and make an army with them before anything else.';
        }
        let text = '';
        if(with_size == true) {
            text = 'Army size: ' + StylizeDecimals(this.size, true) + '<br>';
        }
        else {
            text += '<br>';
        }
        text += this.get_stats_text() + '<br>';
        return text;
    }
    get_fighting_stats_text() {
        if(this.creature == 'None') {
            return 'No army to be seen here.';
        }
        let text = '';
        text = 'Army size: ' + StylizeDecimals(this.size, true) + '<br>';
        text += 'Collective health: ' + StylizeDecimals(this.size.mul(this.stats['Health']), true) + '<br>';
        text += this.stats.get_text();
        return text;
    }
    save() {
        //  save the components of the army
        //save the creature
        let save_text = this.creature + '/*/';
        //save the weapons
        save_text += this.weapons.length;
        for(let i = 0; i < this.weapons.length; i++) {
            save_text += '/*/' + this.weapons[i];
        }
        //  save the size
        save_text += '/*/' + this._size;
        //save the tower level which this army is raiding
        save_text += '/*/' + this.raiding;
        save_text += '/*/' + this.level + '/*/' + this.level_bonus;
        return save_text;
    }
    load(save_text, i = 0) {
        //split the text by the '/*/'
        if(typeof(save_text) == 'string') {
            save_text = save_text.split('/*/');
        }
        
        //  load the components of the army
        //load the creature
        this.change_element('creatures',save_text[i], 0, false);
        i++;
        let j = new Number(save_text[i]);
        i++;
        let k = 0;
        //load the weapons
        while(j > 0) {
            this.change_stats('weapons', save_text[i], k);
            this.weapons[k] = save_text[i];
            //ARCHIVED this.change_element('weapons',save_text[i], k, false)
            j--;
            i++;
            k++;
        }
        //  load the size
        this.size = new Decimal(save_text[i]);
        i++;
        this.raiding = Number(save_text[i]);
        i++;
        this.level = Number(save_text[i]);
        i++;
        this.level_bonus = new Decimal(save_text[i]);
        i++;
        return i;
    }
}


const ArmyPage = {
    pageButton : undefined,
    container : undefined,
    selects: {
        creatures : [],
        weapons : undefined,
    },
    info : undefined,
    partInfo : undefined,
    armySizeInput : undefined,
    currentArmy : 0,
    changeArmyButtons : [],
    maxArmySizeButton : undefined,
    //a collection to help you get the number of some select button faster
    nameToButtonNumber : {
        creatures : {
            'None': 0, 'Human' : 1,
        },
        weapons : {
            'None' : 0, 'Knife' : 1, 'Dagger' : 2, 'Longsword' : 3,
        },
    },
    selectButtons : {
        creatures : [],
        weapons : [],
    },
    currentSelecting : {
        weapons : undefined,
    },
    levelText : undefined,
    levelUpButton : undefined,
    levelUpCost : undefined,
    displayOnLoad() {
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'var(--selected-toggle-button-border-color)';
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
        ArmyPage.armySizeInput.value = StylizeDecimals(Player.armies[ArmyPage.currentArmy].size,true);
    },
    display() {
        ArmyPage.changeArmy(ArmyPage.currentArmy);
    },
    displayEveryTick() {
        ArmyPage.selects.creatures[0].nextElementSibling.innerHTML = (Player.armies[ArmyPage.currentArmy].creature == 'None'  ? '(∞)' : '(' + StylizeDecimals(Player.inventory.creatures[Player.armies[ArmyPage.currentArmy].creature],true) + ')');
        for(i = 0; i < 8; i++) {
            ArmyPage.selects.weapons[i].nextElementSibling.innerHTML = (Player.armies[ArmyPage.currentArmy].weapons[i] == 'None' ? '(∞)' : '(' + StylizeDecimals(Player.inventory.weapons[Player.armies[ArmyPage.currentArmy].weapons[i]],true) + ')');
        }
    },
    changeArmy(change_to) {
        //          hide all the selectors
        ArmyPage.selectButtons.creatures[0].parentElement.hidden = true;
        ArmyPage.selectButtons.weapons[0].parentElement.hidden = true;
        //          reset(show selectButtons and set selects to None) in the army used 'till now
        //reset creature which was used
        ArmyPage.selects.creatures[0].innerHTML = Player.armies[change_to].creature;
        if(Player.armies[ArmyPage.currentArmy].creature != 'None') {
            ArmyPage.selectButtons.creatures[ArmyPage.nameToButtonNumber.creatures[Player.armies[ArmyPage.currentArmy].creature]].hidden = false;
        }
        let k = 0;
        //show previous army weapons and reset weapon selects if they where used
        while(k < 8 && Player.armies[ArmyPage.currentArmy].weapons[k] != 'None') {
            ArmyPage.selectButtons.weapons[ArmyPage.nameToButtonNumber.weapons[Player.armies[ArmyPage.currentArmy].weapons[k]]].hidden = false;
            ArmyPage.selects.weapons[k].innerHTML = 'None';
            k++;
        }
        //          set new selects and hide selectButtons used
        k = 0;
        ArmyPage.currentArmy = change_to;
        //hide current used creature
        if(Player.armies[ArmyPage.currentArmy].creature != 'None') {
            ArmyPage.selectButtons.creatures[ArmyPage.nameToButtonNumber.creatures[Player.armies[ArmyPage.currentArmy].creature]].hidden = true;
        }
        //hide current weapons, set setters' innerHTML value
        while(k < 8 && Player.armies[ArmyPage.currentArmy].weapons[k] != "None") {
            ArmyPage.selectButtons.weapons[ArmyPage.nameToButtonNumber.weapons[Player.armies[ArmyPage.currentArmy].weapons[k]]].hidden = true;
            ArmyPage.selects.weapons[k].parentElement.hidden = false;
            ArmyPage.selects.weapons[k].innerHTML = Player.armies[ArmyPage.currentArmy].weapons[k];
            k++;
        }
        //          show next selector if possible and needed
        //set the next weapon selector visible if needed and possible
        if( k < Player.armies[ArmyPage.currentArmy].max_weapons && Player.armies[ArmyPage.currentArmy].creature != "None") {
            ArmyPage.selects.weapons[k].parentElement.hidden = false;
            k++;
        }
        //          hide unused selectors
        //hide unused weapon selectors
        while(k < Player.armies[ArmyPage.currentArmy].max_weapons) {
            ArmyPage.selects.weapons[k].parentElement.hidden = true;
            k++;
        }
        //          set the info and other stuff
        ArmyPage.info.innerHTML = Player.armies[change_to].get_text();
        ArmyPage.armySizeInput.value = StylizeDecimals(Player.armies[change_to].size, true);
        if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
            ArmyPage.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[ArmyPage.currentArmy].level]);
            ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
        }
        else {
            ArmyPage.levelText.innerHTML = 'Level: Max';
            ArmyPage.levelText.hidden = true;
        }
    },
    save() {
        let save_text;
        //save current army
        save_text = ArmyPage.currentArmy+ '/*/';
        return save_text;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        //reset color before doing anything else
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'var(--selected-toggle-button-border-color)';
        ArmyPage.currentArmy = Number(save_text[i]);
        i++;
        let type, j;
        //load all the select buttons
        for(type in Player.inventory) {
            for(j = 0; j < ArmyPage.selectButtons[type].length; j++) {
                //if there is none in the inventory, hide it, else, show it
                if(Player.inventory[type][ArmyPage.selectButtons[type][j].innerHTML] == undefined && ArmyPage.selectButtons[type][j].innerHTML != 'None') {
                    ArmyPage.selectButtons[type][j].hidden = true;
                }
                else {
                    ArmyPage.selectButtons[type][j].hidden = false;
                }
            }
        }
        ArmyPage.displayOnLoad();
    },
}

ArmyPage.pageButton = document.querySelector('#ArmyPageButton');
ArmyPage.container = document.querySelector('#ArmyPageContainer');
ArmyPage.selects.creatures.push(document.querySelector('#CreatureSelect'));
ArmyPage.selects.weapons = document.querySelectorAll('.weapon_select');
ArmyPage.info = document.querySelector('#ArmyPageInfo');
ArmyPage.armySizeInput = document.querySelector('#ArmySizeInput');
ArmyPage.changeArmyButtons = document.querySelectorAll('.select_army_button');
ArmyPage.maxArmySizeButton = document.querySelector('#MaxArmySize');
ArmyPage.selectButtons.creatures = document.querySelectorAll('.creature_select_button');
ArmyPage.selectButtons.weapons = document.querySelectorAll('.weapon_select_button');
ArmyPage.partInfo = document.querySelector('#ArmyPagePartInfo');
ArmyPage.levelText = document.querySelector('#ArmyLevelText');
ArmyPage.levelUpButton = document.querySelector('#ArmyLevelUpButton');
ArmyPage.levelUpCost = document.querySelector('#ArmyLevelUpCost');

//initialize changeArmyButton's click function
for(let i = 0; i < ArmyPage.changeArmyButtons.length; i++) {
    ArmyPage.changeArmyButtons[i].addEventListener('click', () => {
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'var(--default-toggle-button-border-color)';
        ArmyPage.changeArmy(i);
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'var(--selected-toggle-button-border-color)';
    });
}

//      GENERALIZE THIS BIT
//initialize all select's, selectButtons parent's and selectButtons' mouse functions
for(let type in ArmyPage.selects) {
    if(type == 'creatures') {
        //select click
        ArmyPage.selects.creatures[0].addEventListener('click', function() {
            if(ArmyPage.selectButtons.creatures[0].parentElement.hidden) {
                ArmyPage.selects.creatures[0].innerHTML = 'Selecting...';
                ArmyPage.selectButtons.creatures[0].parentElement.hidden = false;
            }
            else {
                ArmyPage.selects.creatures[0].innerHTML = Player.armies[ArmyPage.currentArmy].creature;
                ArmyPage.selectButtons.creatures[0].parentElement.hidden = true;
            }
        });
        //selects' parent mouseenter and mouseleave
        ArmyPage.selects.creatures[0].parentElement.addEventListener('mouseenter', function() {
            ArmyPage.partInfo.innerHTML = stuff.creatures[Player.armies[ArmyPage.currentArmy].creature].get_text();
        });
        ArmyPage.selects.creatures[0].parentElement.addEventListener('mouseleave', function() {
            ArmyPage.partInfo.innerHTML = '';
        });
        //selectButton click, mouseenter and mouseleave
        for(let i = 0; i < ArmyPage.selectButtons.creatures.length; i++) {
            ArmyPage.selectButtons.creatures[i].addEventListener('click', () => {
                //save previous creature and weapons of the army for reset purposes
                const prev = Player.armies[ArmyPage.currentArmy].creature;
                let prev_weapons = [];
                for(let j = 0; j < Player.armies[ArmyPage.currentArmy].weapons.length; j++) {
                    prev_weapons.push(Player.armies[ArmyPage.currentArmy].weapons[j]);
                }
                if(!Player.armies[ArmyPage.currentArmy].change_element(type, ArmyPage.selectButtons[type][i].innerHTML)) {
                    return;
                }

                //if the previous select wasn't None, show it again
                if(prev != 'None') {
                    ArmyPage.selectButtons[type][ArmyPage.nameToButtonNumber[type][prev]].hidden = false;
                }

                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                ArmyPage.selects[type][0].innerHTML = ArmyPage.selectButtons[type][i].innerHTML;
                //hide select bars for weapons and the like
                for(let j = Player.armies[ArmyPage.currentArmy].weapons.length - 1; j > -1; j--) {
                    ArmyPage.selects.weapons[j].parentElement.hidden = true;
                    ArmyPage.selects.weapons[j].value = 'None';
                }
                if(ArmyPage.selects.creatures[0].innerHTML != 'None') {
                    ArmyPage.selects.weapons[0].parentElement.hidden = false;
                }
                //after selecting, hide select buttons
                ArmyPage.selectButtons.creatures[i].parentElement.hidden = true;
                //if the selected thing is not None, then hide it to not show anymore
                if(ArmyPage.selects.creatures[0].innerHTML != 'None') {
                    ArmyPage.selectButtons.creatures[i].hidden = true;
                }
                //show unequipped weapons
                for(let j = 0; j < prev_weapons.length; j++) {
                    ArmyPage.selectButtons['weapons'][ArmyPage.nameToButtonNumber['weapons'][prev_weapons[j]]].hidden = false;
                    ArmyPage.selects['weapons'][j].innerHTML = 'None';
                }
            });
            ArmyPage.selectButtons.creatures[i].addEventListener('mouseenter', function(event) {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text('creatures',ArmyPage.selectButtons.creatures[i].innerHTML, false);
                //show info text for the changed part
                ArmyPage.partInfo.innerHTML = stuff.creatures[Player.armies[ArmyPage.currentArmy].creature].get_compare_text(stuff.creatures[ArmyPage.selectButtons.creatures[i].innerHTML]);
            });
            ArmyPage.selectButtons.creatures[i].addEventListener('mouseleave', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                //hide info text of the changing part
                ArmyPage.partInfo.innerHTML = '';
            });
        }
    }
    else if(type == 'weapons') {
        //selects and their parents
        for(let i = 0; i < 8; i++) {
            //select click
            ArmyPage.selects[type][i].addEventListener('click', function() {
                //if there is no selection going on
                if(ArmyPage.selectButtons[type][i].parentElement.hidden) {
                    //set text and show the selector buttons
                    ArmyPage.selects[type][i].innerHTML = 'Selecting...';
                    ArmyPage.selects[type][i].parentElement.nextElementSibling.parentNode.insertBefore(ArmyPage.selectButtons[type][i].parentElement, ArmyPage.selects[type][i].parentElement.nextElementSibling);
                    ArmyPage.selectButtons[type][i].parentElement.hidden = false;
                    ArmyPage.currentSelecting[type] = i;
                }
                //if there is selection going on
                else {
                    //if it is the same as clicked on, then just hide the thing
                    if(i == ArmyPage.currentSelecting[type]) {
                        ArmyPage.selects[type][i].innerHTML = Player.armies[ArmyPage.currentArmy][type][i];
                        ArmyPage.selectButtons[type][i].parentElement.hidden = true;
                        ArmyPage.currentSelecting[type] = undefined;
                    }
                    else {
                        //reset text of the other one
                        ArmyPage.selects[type][ArmyPage.currentSelecting[type]].innerHTML = Player.armies[ArmyPage.currentArmy][type][ArmyPage.currentSelecting[type]];
                        ArmyPage.selects[type][i].parentElement.nextElementSibling.parentNode.insertBefore(ArmyPage.selectButtons[type][i].parentElement, ArmyPage.selects[type][i].parentElement.nextElementSibling);
                        ArmyPage.currentSelecting[type] = i;
                        ArmyPage.selects[type][i].innerHTML = 'Selecting...';
                    }
                }
            });
            //selects' parent mouseenter and mouseleave
            ArmyPage.selects[type][i].parentElement.addEventListener('mouseenter', function() {
                ArmyPage.partInfo.innerHTML = stuff[type][Player.armies[ArmyPage.currentArmy][type][i]].get_text();
            });
            ArmyPage.selects[type][i].parentElement.addEventListener('mouseleave', function() {
                ArmyPage.partInfo.innerHTML = '';
            });
        }
        //selectButton click, mouseenter and mouseleave
        for(let i = 0; i < ArmyPage.selectButtons[type].length; i++) {
            ArmyPage.selectButtons[type][i].addEventListener('click', () => {

                let prev = Player.armies[ArmyPage.currentArmy][type][ArmyPage.currentSelecting[type]];

                if(!Player.armies[ArmyPage.currentArmy].change_element(type,ArmyPage.selectButtons[type][i].innerHTML, ArmyPage.currentSelecting[type])) {
                    return;
                }

                //if the previous select wasn't None, show it again
                if(prev != 'None') {
                    ArmyPage.selectButtons[type][ArmyPage.nameToButtonNumber[type][prev]].hidden = false;
                }

                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                
                ArmyPage.selects[type][ArmyPage.currentSelecting[type]].innerHTML = ArmyPage.selectButtons[type][i].innerHTML;
                //after selecting, hide select buttons
                ArmyPage.selectButtons[type][i].parentElement.hidden = true;

                //if the selected thing is not None, then hide it to not show anymore
                if(ArmyPage.selectButtons[type][i].innerHTML != 'None') {
                    ArmyPage.selectButtons[type][i].hidden = true;
                }

                //hide stuff with None, only leave one
                const c_army = Player.armies[ArmyPage.currentArmy]
                found = false
                for(let j = 0; j < c_army.max_weapons; j++) {
                    ArmyPage.selects[type][j].innerHTML = c_army.weapons[j];
                    if(c_army.weapons[j] == 'None') {
                        if(found) {
                            ArmyPage.selects[type][j].parentElement.hidden = true;
                        }
                        else {
                            found = true;
                            ArmyPage.selects[type][j].parentElement.hidden = false;
                        }
                    }
                }
            });
            ArmyPage.selectButtons[type][i].addEventListener('mouseenter', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text(type,ArmyPage.selectButtons[type][i].innerHTML, ArmyPage.currentSelecting[type]);
                //show info text for the changed part
                ArmyPage.partInfo.innerHTML = stuff[type][Player.armies[ArmyPage.currentArmy][type][ArmyPage.currentSelecting[type]]].get_compare_text(stuff[type][ArmyPage.selectButtons[type][i].innerHTML]);
            });
            ArmyPage.selectButtons[type][i].addEventListener('mouseleave', function() {
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                //hide info text of the changing part
                ArmyPage.partInfo.innerHTML = '';
            });
        
        };
    }
}

//army size buttons click functions
ArmyPage.armySizeInput.addEventListener('change', () => {
    Player.armies[ArmyPage.currentArmy].set_size(new Decimal(ArmyPage.armySizeInput.value));
});
ArmyPage.maxArmySizeButton.addEventListener('click', () => {
    Player.armies[ArmyPage.currentArmy].set_size(new Decimal(Infinity));
});

ArmyPage.levelUpButton.addEventListener('mouseenter', function() {
    if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_level_up_text();
    ArmyPage.partInfo.innerHTML = Player.armies[ArmyPage.currentArmy].get_compare_level_text();
    ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1) + 
    '<span style="color:' + UtilityFunctions.get_compare_color(Player.armies[ArmyPage.currentArmy].level, Player.armies[ArmyPage.currentArmy].level + 1, false)  + '">' + ' → ' +
     (Player.armies[ArmyPage.currentArmy].level + 2) + '</span><br>';
    }
});

ArmyPage.levelUpButton.addEventListener('mouseleave', function() {
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
    ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
    ArmyPage.partInfo.innerHTML = '';
});

ArmyPage.levelUpButton.addEventListener('click', function() {
    Player.armies[ArmyPage.currentArmy].level_up();
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
    
    ArmyPage.partInfo.hidden = true;
    if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
        ArmyPage.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[ArmyPage.currentArmy].level]);
        ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
    }
    else {
        ArmyPage.levelText.innerHTML = 'Level: Max';
        ArmyPage.levelText.hidden = true;
    }
});