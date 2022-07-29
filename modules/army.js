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
        UtilityFunctions.get_compare_color(this.level_bonus, this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + '">' +  ' &rightarrow; ' + 
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
    change_element(type, change_to, change_index = 0, unlock_stuff = true, army_nr) {
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
                
                //Deequip creature from army
                ArmyPage.deequipElementByArmy(type, this.creature, army_nr)

                //change the stats of the army
                this.creature = change_to;

                //equip on ArmyPage
                
                ArmyPage.equipElementByArmy(type, change_to, army_nr);
                break;
            case 'weapons':
                if(change_to == this.weapons[change_index]) {
                    return false;
                }

                if(!this.change_element_helper('weapons',change_to,change_index, unlock_stuff, army_nr)) {
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
                console.log(type, index, );
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
    change_element_helper(type, change_to, change_index = 0, do_shift = true, army_nr = 0) {
        if(!this.can_change_element(type, change_to, change_index)) {
            return false;
        }
        if(this[type][change_index] != 'None') {
            Player.inventory[type][this[type][change_index]] = Player.inventory[type][this[type][change_index]].add(this.size);
        }
        //change stats from old to new
        this.change_stats(type, change_to, change_index);

        //Deequip element from army
        ArmyPage.deequipElementByArmy(type, this[type][change_index], army_nr)

        //add in the new one
        this[type][change_index] = change_to;

        //equip element in army
        ArmyPage.equipElementByArmy(type, change_to, army_nr)

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
        ' &rightarrow; ' +  StylizeDecimals(new_army[0],true) + '</span><br>';
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
    load(save_text, i = 0, army_nr = 0) {
        //split the text by the '/*/'
        if(typeof(save_text) == 'string') {
            save_text = save_text.split('/*/');
        }
        
        //  load the components of the army
        //load the creature
        this.change_element('creatures',save_text[i], 0, false, army_nr);
        i++;
        let j = new Number(save_text[i]);
        i++;
        let k = 0;
        //load the weapons
        while(j > 0) {
            this.change_stats('weapons', save_text[i], k);
            this.weapons[k] = save_text[i];
            ArmyPage.equipElementByArmy('weapons', save_text[i], k);
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
    armyManagerContainer : undefined,
    selectRows: {
        creatures : [],
        weapons : [],
    },
    //the end number of select rows in each category, in order: creatures, weapons
    selectRowsTypes: ['creatures', 'weapons'],
    selectRowsNrs: [1, 9],
    //store equipped state by a bitwise method ( 2 ** army_nr shows if that army equipped the element or not)
    elementEquipState: {
        creatures: {'None' : 0, 'Human' : 0,},
        weapons: {'None' : 0, 'Knife': 0},
    },
    info : undefined,
    partInfo : undefined,
    armySizeInput : undefined,
    currentArmy : 0,
    changeArmyButtons : [],
    maxArmySizeButton : undefined,
    elementSelectList:undefined,
    //a collection to help you get the number of some select button faster
    nameToButtonNumber : {
        creatures : {
            'None': 0, 'Human' : 1,
        },
        weapons : {
            'None' : 0, 'Knife' : 1, 'Dagger' : 2, 'Longsword' : 3,
        },
    },
    currentSelecting : {
        weapons : -1,
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
        ArmyPage.selectRows.creatures[0][0].innerHTML = (Player.armies[ArmyPage.currentArmy].creature == 'None'  ? '(&infin;)' : '(' + StylizeDecimals(Player.inventory.creatures[Player.armies[ArmyPage.currentArmy].creature],true) + ')');
        for(i = 0; i < 8; i++) {
            ArmyPage.selectRows.weapons[i][0].innerHTML = (Player.armies[ArmyPage.currentArmy].weapons[i] == 'None' ? '(&infin;)' : '(' + StylizeDecimals(Player.inventory.weapons[Player.armies[ArmyPage.currentArmy].weapons[i]],true) + ')');
        }
    },
    changeArmy(change_to) {

        //      reset creature which was used
        ArmyPage.selectRows.creatures[0][1].innerHTML = Player.armies[change_to].creature;
        
        //      reset weapon selects if they where used
        let k = 0;
        while(k < 8 && Player.armies[ArmyPage.currentArmy].weapons[k] != 'None') {
            ArmyPage.selectRows.weapons[k][1].innerHTML = 'None';
            k++;
        }
        //          set new selects and hide selectButtons used
        k = 0;
        ArmyPage.currentArmy = change_to;
        //     set setters' innerHTML value
        while(k < 8 && Player.armies[ArmyPage.currentArmy].weapons[k] != "None") {
            ArmyPage.selectRows.weapons[k][0].parentElement.hidden = false;
            ArmyPage.selectRows.weapons[k][1].innerHTML = Player.armies[ArmyPage.currentArmy].weapons[k];
            k++;
        }
        //          show next selector if possible and needed
        //      set the next weapon selector visible if needed and possible
        if( k < Player.armies[ArmyPage.currentArmy].max_weapons && Player.armies[ArmyPage.currentArmy].creature != "None") {
            ArmyPage.selectRows.weapons[k][0].parentElement.hidden = false;
            k++;
        }
        //          hide unused selectors
        //      hide unused weapon selectors
        while(k < Player.armies[ArmyPage.currentArmy].max_weapons) {
            ArmyPage.selectRows.weapons[k][0].parentElement.hidden = true;
            k++;
        }
        //          set the info and other stuff
        ArmyPage.info.innerHTML = Player.armies[change_to].get_text();
        ArmyPage.armySizeInput.value = StylizeDecimals(Player.armies[change_to].size, true);
        //set level text
        ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
        if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
            ArmyPage.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[ArmyPage.currentArmy].level]);
            
            //show level up stuff
            ArmyPage.levelUpButton.hidden = false;
            document.getElementById('ArmyLevelUpCost').hidden = false;
        }
        else {
            ArmyPage.levelText.innerHTML += ' (Max)';
            //hide level up stuff
            ArmyPage.levelUpButton.hidden = true;
            document.getElementById('ArmyLevelUpCost').hidden = true;
        }
        //      if element selection was active, hide it
        if(!ArmyPage.elementSelectList.hidden) {
            ArmyPage.elementSelectList.container.hidden = true;
            ArmyPage.armyManagerContainer.hidden = false;
        }
    },
    save() {
        let save_text;
        //save current army
        save_text = ArmyPage.currentArmy+ '/*/';
        return save_text;
    },
    equipElementByArmy(type, element, army_nr) {
        if(element != 'None') {
            let nr = 2 ** army_nr;
            if(ArmyPage.elementEquipState[type][element] == undefined) {
                ArmyPage.elementEquipState[type][element];
            }
            ArmyPage.elementEquipState[type][element] += nr;
        }
    },
    deequipElementByArmy(type, element, army_nr) {
        if(element != 'None') {
            let nr = 2 ** army_nr;
            ArmyPage.elementEquipState[type][element] -= nr;
        }
    },
    isElementEquippedByArmy(type, element, army_nr) {
        let nr = 2 ** army_nr;
        return Math.floor( ArmyPage.elementEquipState[type][element] / nr ) == 1;
    },
    generateItemList(type, army_nr) {
        let list = []
        for(let element of Object.keys(ArmyPage.elementEquipState[type])) {
            if(!ArmyPage.isElementEquippedByArmy(type, element, army_nr)) {
                list.push(element);
            }
        }
        return list;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        //reset color before doing anything else
        ArmyPage.changeArmyButtons[ArmyPage.currentArmy].style.borderColor = 'var(--selected-toggle-button-border-color)';
        ArmyPage.currentArmy = Number(save_text[i]);
        i++;
        ArmyPage.displayOnLoad();
    },
}

ArmyPage.pageButton = document.querySelector('#ArmyPageButton');
ArmyPage.container = document.querySelector('#ArmyPageContainer');
ArmyPage.armyManagerContainer = document.querySelector(".army_management_container");
ArmyPage.info = document.querySelector('#ArmyPageInfo');
ArmyPage.armySizeInput = document.querySelector('#ArmySizeInput');
ArmyPage.changeArmyButtons = document.querySelectorAll('.select_army_button');
ArmyPage.maxArmySizeButton = document.querySelector('#MaxArmySize');
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

class ItemList {
    //class names come in form of: .<name> or #<name>
    constructor(container_name,list_name, list_item_name, back_button_name, item_list = [], type = 'creatures') {
        this.item_list = item_list;
        this.type = type;
        this.change_index = 0;
        this.container = document.querySelector(container_name + ' > ' + list_name);
        this.items = document.querySelectorAll(container_name + ' > ' + list_name + ' > ' + list_item_name);
        this.back_button = document.querySelector(container_name + ' > ' + list_name + ' > ' + back_button_name);
        let current_obj = this;
        //item mouse functions
        for(let i = 0; i < this.items.length; i++) {
            
            this.items[i].addEventListener('mouseenter', function() {
                if(i < current_obj.item_list.length) {
                    //GENERALIZE THIS PART
                    if(current_obj.item_list[i] == 'None') {
                        ArmyPage.partInfo.innerHTML = 'None';
                    }
                    else {
                        ArmyPage.partInfo.innerHTML = stuff[current_obj.type][current_obj.item_list[i]].get_text();
                    }
                    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text(current_obj.type,current_obj.item_list[i],current_obj.change_index);
                }
                else {
                    ArmyPage.partInfo.innerHTML = '';
                }
                
            });
            this.items[i].addEventListener('mouseleave', function() {
                //GENERALIZE THIS PART
                ArmyPage.partInfo.innerHTML = '';
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
            });
            this.items[i].addEventListener('click', function() {
                if(!Player.armies[ArmyPage.currentArmy].change_element(type, current_obj.items[i].innerHTML, current_obj.change_index, true, ArmyPage.currentArmy)) {
                    return;
                }
                ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
                ArmyPage.selectRows[type][0][1].innerHTML = current_obj.items[i].innerHTML;
                //hide select rows for weapons and the like
                for(let j = Player.armies[ArmyPage.currentArmy].weapons.length - 1; j > -1; j--) {
                    ArmyPage.selectRows.weapons[j][0].parentElement.hidden = true;
                    ArmyPage.selectRows.weapons[j][1].innerHTML = 'None';
                }
                //show first weapon selection row and the like if the creature is not None
                if(ArmyPage.selectRows.creatures[0][1].innerHTML != 'None') {
                    ArmyPage.selectRows.weapons[0][0].parentElement.hidden = false;
                }
                //hide selection list
                current_obj.container.hidden = true;
                //show management item
                ArmyPage.armyManagerContainer.hidden = false;
            });
        }
        this.back_button.addEventListener('mouseenter', function() {
            ArmyPage.partInfo.innerHTML = 'Take me back, baby!';
        });
        this.back_button.addEventListener('mouseleave', function() {
            ArmyPage.partInfo.innerHTML = '';
        });
        this.back_button.addEventListener('click', function() {
            current_obj.container.hidden = true;
            ArmyPage.armyManagerContainer.hidden = false;
        });
    }

    get hidden() {
        return this.container.hidden;
    }

    change_item_list(item_list) {
        this.item_list = item_list;
    }

    change_type(type) {
        this.type = type;
    }

    change_selection(type, item_list) {
        this.change_type(type);
        this.change_item_list(item_list);
    }
    
    show() {
        this.container.hidden = false;
        ArmyPage.armyManagerContainer.hidden = true;
        for(let i = 0; i < this.items.length; i++) {
            if(i < this.item_list.length) {
                this.items[i].innerHTML = this.item_list[i];
            }
            else {
                this.items[i].innerHTML = '';
            }
        }
    }
};

//      GENERALIZE THIS BIT
ArmyPage.elementSelectList = new ItemList('.army_info_container', '.element_select_list', '.element_select_list_item', '.element_select_list_back_button', ['None', 'Human']);
let item_rows1 = document.querySelectorAll(".nr_available_div.page_army");
//      MAYBE NEEDED LATER
//let item_rows2 = document.querySelectorAll(container_name + ' > ' + list_name + ' > ' + list_item_name + " > .element_name_div");
let item_rows3 = document.querySelectorAll(".complementary_button.page_army");
//get them selectRows up & running
let selectRowsI = 0;
for(let i = 0; i < item_rows1.length; i++) {
    //change to new type if old one ran out
    if(i >= ArmyPage.selectRowsNrs[selectRowsI]) {
        selectRowsI++;
    }
    ArmyPage.selectRows[ArmyPage.selectRowsTypes[selectRowsI]].push([item_rows1[i], item_rows3[i]]);
}

//initialize all select's, selectButtons parent's and selectButtons' mouse functions
for(let type in ArmyPage.selectRows) {
    if(type == 'creatures') {
        //select click
        ArmyPage.selectRows.creatures[0][1].addEventListener('click', function() {
            if(ArmyPage.elementSelectList.hidden) {
                ArmyPage.elementSelectList.change_type(type);
                ArmyPage.elementSelectList.change_item_list(ArmyPage.generateItemList(type, ArmyPage.currentArmy));
                ArmyPage.elementSelectList.show();
            }
            else {
                ArmyPage.selectRows.creatures[0][1].innerHTML = Player.armies[ArmyPage.currentArmy].creature;
            }
        });
        //selects' parent mouseenter and mouseleave
        ArmyPage.selectRows.creatures[0][1].addEventListener('mouseenter', function() {
            ArmyPage.partInfo.innerHTML = stuff.creatures[Player.armies[ArmyPage.currentArmy].creature].get_text();
        });
        ArmyPage.selectRows.creatures[0][1].addEventListener('mouseleave', function() {
            ArmyPage.partInfo.innerHTML = '';
        });
        /*      ARCHIVED
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
                ArmyPage.selectRows[type][0].innerHTML = ArmyPage.selectButtons[type][i].innerHTML;
                //hide select bars for weapons and the like
                for(let j = Player.armies[ArmyPage.currentArmy].weapons.length - 1; j > -1; j--) {
                    ArmyPage.selectRows.weapons[j].parentElement.hidden = true;
                    ArmyPage.selectRows.weapons[j].value = 'None';
                }
                if(ArmyPage.selectRows.creatures[0].innerHTML != 'None') {
                    ArmyPage.selectRows.weapons[0].parentElement.hidden = false;
                }
                //after selecting, hide select buttons
                ArmyPage.selectButtons.creatures[i].parentElement.hidden = true;
                //if the selected thing is not None, then hide it to not show anymore
                if(ArmyPage.selectRows.creatures[0].innerHTML != 'None') {
                    ArmyPage.selectButtons.creatures[i].hidden = true;
                }
                //show unequipped weapons
                for(let j = 0; j < prev_weapons.length; j++) {
                    ArmyPage.selectButtons['weapons'][ArmyPage.nameToButtonNumber['weapons'][prev_weapons[j]]].hidden = false;
                    ArmyPage.selectRows['weapons'][j].innerHTML = 'None';
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
        //*/
    }
    else if(type == 'weapons') {
        //selects and their parents
        for(let i = 0; i < 8; i++) {
            //select click
            ArmyPage.selectRows[type][i][1].addEventListener('click', function() {
                if(ArmyPage.elementSelectList.hidden) {
                    ArmyPage.elementSelectList.change_type(type);
                    ArmyPage.elementSelectList.change_item_list(ArmyPage.generateItemList(type, ArmyPage.currentArmy));
                    ArmyPage.elementSelectList.change_index = i;
                    ArmyPage.elementSelectList.show();
                }
                else {
                    ArmyPage.selectRows.weapons[i][1].innerHTML = Player.armies[ArmyPage.currentArmy].weapons[i];
                }
            });
            //selects' parent mouseenter and mouseleave
            ArmyPage.selectRows[type][i][1].addEventListener('mouseenter', function() {
                ArmyPage.partInfo.innerHTML = stuff.weapons[Player.armies[ArmyPage.currentArmy].weapons[i]].get_text();
            });
            ArmyPage.selectRows[type][i][1].addEventListener('mouseleave', function() {
                ArmyPage.partInfo.innerHTML = '';
            });
        }
        /*      ARCHIVED
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
                
                ArmyPage.selectRows[type][ArmyPage.currentSelecting[type]].innerHTML = ArmyPage.selectButtons[type][i].innerHTML;
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
                    ArmyPage.selectRows[type][j].innerHTML = c_army.weapons[j];
                    if(c_army.weapons[j] == 'None') {
                        if(found) {
                            ArmyPage.selectRows[type][j].parentElement.hidden = true;
                        }
                        else {
                            found = true;
                            ArmyPage.selectRows[type][j].parentElement.hidden = false;
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
        //*/
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
    '<span style="color:' + UtilityFunctions.get_compare_color(Player.armies[ArmyPage.currentArmy].level, Player.armies[ArmyPage.currentArmy].level + 1, false)  + '">' + ' &rightarrow; ' +
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
    
    ArmyPage.partInfo.innerHTML = '';
    ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1);
    if(Player.armies[ArmyPage.currentArmy].level < Army.level_prices.length) {
        ArmyPage.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[ArmyPage.currentArmy].level]);
    }
    else {
        ArmyPage.levelText.innerHTML = 'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1) + ' (Max)';
        ArmyPage.levelUpButton.hidden = true;
        document.getElementById('ArmyLevelUpCost').hidden = true;
    }
});