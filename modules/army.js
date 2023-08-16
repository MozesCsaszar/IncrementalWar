//regular save divider = '/*/'
class Army {
    static level_bonuses = [new Decimal(1), new Decimal(1.1), new Decimal(1.2), new Decimal(1.3), new Decimal(1.5), new Decimal(1.7), new Decimal(2)];
    static level_prices = [new Decimal(1000), new Decimal(6000), new Decimal(15000), new Decimal(50000), new Decimal(175000), new Decimal('1e6')];

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
        UtilityFunctions.get_compare_color(this.level_bonus, this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + '"> &rightarrow; </span>' + 
        StylizeDecimals(this.level_bonus.mul(Army.level_bonuses[this.level + 1]));
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
                    this.change_element('weapons','None',i, unlock_stuff);
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

                if(!this.change_element_helper('weapons',change_to,change_index, unlock_stuff, army_nr)) {
                    console.log('here');
                    return false;
                }
                break;
        }
        //send unlock request after change
        if(unlock_stuff) {
            allThingsStatistics.setStatisticsToMax(['Player', 'armies', ArmyPage.currentArmy, 'Attack'], this.stats['Attack'].get_plain_power());
            allThingsStatistics.setStatisticsToMax(['Player', 'armies', 'all', 'Attack'], this.stats['Attack'].get_plain_power());
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
        let text = 'Size: ' + StylizeDecimals(this.size, true) + '<span style="color:' + UtilityFunctions.get_compare_color(this.size,new_army[0]) + ';"> &rightarrow; </span>' +
        StylizeDecimals(new_army[0],true) + '<br>';
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
};

class SelectionItemListClass extends ItemListClass {
    //class names come in form of: .<name> or #<name>
    constructor(container_idetifier,element_idetifier, previous_button_identifier, back_button_identifier, next_button_identifier, item_list = []) {
        super(container_idetifier,element_idetifier, previous_button_identifier, back_button_identifier, next_button_identifier, item_list);

        this.type = 'creatures';
        this.changeIndex = 0;
    }
    hideElement(elem_nr) {
        super.hideElement(elem_nr);
        this.elements[elem_nr].innerHTML = '';
        this.elements[elem_nr].style.borderStyle = 'none';
    }
    showElement(elem_nr) {
        super.showElement(elem_nr);
        this.elements[elem_nr].style.borderStyle = 'solid';
    }
    elementMouseenter(elem_nr) {
        if(this.itemList[elem_nr] == 'None') {
            ArmyPage.partInfo.innerHTML = 'None';
        }
        else {
            ArmyPage.partInfo.innerHTML = stuff[this.type][this.itemList[elem_nr]].get_text();
        }
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text(this.type,this.itemList[elem_nr],this.changeIndex);
    }
    elementMouseleave(elem_nr) {
        ArmyPage.partInfo.innerHTML = '';
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
    }
    elementClick(elem_nr) {
        if(!Player.armies[ArmyPage.currentArmy].change_element(this.type, this.elements[elem_nr].innerHTML, this.changeIndex, true, ArmyPage.currentArmy)) {
            return;
        }
        ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_text();
        ArmyPage.selectRows[this.type][this.changeIndex][1].innerHTML = this.elements[elem_nr].innerHTML;
        if(this.type == 'creatures') {
            //hide select rows for weapons and the like
            for(let j = Player.armies[ArmyPage.currentArmy].weapons.length - 1; j > -1; j--) {
                ArmyPage.selectRows.weapons[j][0].parentElement.hidden = true;
                ArmyPage.selectRows.weapons[j][1].innerHTML = 'None';
            }
            //show first weapon selection row and the like if the creature is not None
            if(ArmyPage.selectRows.creatures[0][1].innerHTML != 'None') {
                ArmyPage.selectRows.weapons[0][0].parentElement.hidden = false;
            }
        }
        else if(this.type == 'weapons') {
            let found = false;
            //hide select rows for weapons and the like
            for(let j = 0; j < Player.armies[ArmyPage.currentArmy].weapons.length; j++) {
                if(Player.armies[ArmyPage.currentArmy].weapons[j] == 'None') {
                    if(found) {
                        ArmyPage.selectRows.weapons[j][0].parentElement.hidden = true;
                    }
                    else {
                        found = true;
                        ArmyPage.selectRows.weapons[j][0].parentElement.hidden = false;
                    }
                }
                ArmyPage.selectRows.weapons[j][1].innerHTML = Player.armies[ArmyPage.currentArmy].weapons[j];
            }
        }
        
        //hide selection list
        this.container.hidden = true;
        //show management item
        ArmyPage.armyManagerContainer.hidden = false;
    }
    populateElement(elem_nr) {
        this.elements[elem_nr].innerHTML = this.itemList[this.getItemListIndex(elem_nr)];
    }
    backButtonMouseenter() {
        ArmyPage.partInfo.innerHTML = 'Take me back, baby!';
    }
    backButtonMouseleave() {
        ArmyPage.partInfo.innerHTML = '';
    }
    backButtonClick() {
        this.hide();
        ArmyPage.armyManagerContainer.hidden = false;
    }
    hidePreviousButton() {
        super.hidePreviousButton();
        this.previousButton.style.borderStyle = 'none';
        this.previousButton.innerHTML = ''
    }
    showPreviousButton() {
        super.showPreviousButton();
        this.previousButton.style.borderStyle = 'solid';
        this.previousButton.innerHTML = '&lt;'
    }
    hideNextButton() {
        super.hideNextButton();
        this.nextButton.style.borderStyle = 'none';
        this.nextButton.innerHTML = ''
    }
    showNextButton() {
        super.showNextButton();
        this.nextButton.style.borderStyle = 'solid';
        this.nextButton.innerHTML = '&gt;'
    }

    changeType(type) {
        this.type = type;
    }

    changeSelection(type, item_list) {
        this.changeType(type);
        this.changeItemList(item_list);
    }
    
    show() {
        super.show(true);
        ArmyPage.armyManagerContainer.hidden = true;
    }
};

class SelectArmyButtonsClass extends ButtonGroupClass {
    constructor(container_idetifier, button_identifier, selected_style, default_style) {
        super(container_idetifier, button_identifier, selected_style, default_style);
    }

    buttonClick(button_nr) {
        super.buttonClick(button_nr);
        ArmyPage.changeArmy(button_nr);
    }
}

class ArmyPageClass extends PageClass {
    constructor(name) {
        super(name);

        this.pageButton= document.querySelector('#ArmyPageButton');
        this.armyManagerContainer= document.querySelector(".army_management_container");
        this.selectRows= {
            creatures : [],
            weapons : [],
        };
        //the end number of select rows in each category, in order=creatures, weapons
        this.selectRowsTypes=['creatures', 'weapons'];
        this.selectRowsNrs=[1, 9];
        //set up select rows
        let item_rows1 = document.querySelectorAll(".nr_available_div.page_army");
        //      MAYBE NEEDED LATER
        //let item_rows2 = document.querySelectorAll(container_name + ' > ' + list_name + ' > ' + list_item_name + " > .element_name_div");
        let item_rows3 = document.querySelectorAll(".complementary_button.page_army");
        //get them selectRows up & running
        let selectRowsI = 0;
        for(let i = 0; i < item_rows1.length; i++) {
            //change to new type if old one ran out
            if(i >= this.selectRowsNrs[selectRowsI]) {
                selectRowsI++;
            }
            this.selectRows[this.selectRowsTypes[selectRowsI]].push([item_rows1[i], item_rows3[i]]);
        }
        
        //store equipped state by a bitwise method ( 2 ** army_nr shows if that army equipped the element or not)
        this.elementEquipState={
            creatures: {'None' : 0, 'Human' : 0,},
            weapons: {'None' : 0},
        };
        this.info= document.querySelector('#ArmyPageInfo');
        this.partInfo= document.querySelector('#ArmyPagePartInfo');
        this.armySizeInput= document.querySelector('#ArmySizeInput');
        this.currentArmy= 0;
        this.changeArmyButtons=  new SelectArmyButtonsClass('.select_subpage_container.page_army', '.select_button', {'borderColor': 'var(--selected-toggle-button-border-color)'}, {'borderColor': 'var(--default-toggle-button-border-color)'});
        this.maxArmySizeButton= document.querySelector('#MaxArmySize');
        this.elementSelectList= new SelectionItemListClass('.element_list.page_army', '.element_list_item', '.element_list_prev_button', '.element_list_back_button', '.element_list_next_button', []);
        this.currentSelecting= {
            weapons : -1,
        };
        this.levelText= document.querySelector('#ArmyLevelText');
        this.levelUpButton= document.querySelector('#ArmyLevelUpButton');
        this.levelUpCost= document.querySelector('#ArmyLevelUpCost');

        this.initializeEventListeners();
    }
    //called when page reloads
    initializeEventListeners() {
        let c_obj = this;

        //initialize all select's, selectButtons parent's and selectButtons' mouse functions
        for(let type in this.selectRows) {
            if(type == 'creatures') {
                //select click
                this.selectRows.creatures[0][1].addEventListener('click', function() {
                    if(c_obj.elementSelectList.hidden) {
                        c_obj.elementSelectList.changeType(type);
                        c_obj.elementSelectList.changeItemList(c_obj.generateItemList(type, c_obj.currentArmy));
                        c_obj.elementSelectList.changeIndex = 0;
                        c_obj.elementSelectList.show();
                    }
                    else {
                        c_obj.selectRows.creatures[0][1].innerHTML = Player.armies[c_obj.currentArmy].creature;
                    }
                });
                //selects' parent mouseenter and mouseleave
                this.selectRows.creatures[0][1].addEventListener('mouseenter', function() {
                    c_obj.partInfo.innerHTML = stuff.creatures[Player.armies[c_obj.currentArmy].creature].get_text();
                });
                this.selectRows.creatures[0][1].addEventListener('mouseleave', function() {
                    c_obj.partInfo.innerHTML = '';
                });
            }
            else if(type == 'weapons') {
                //selects and their parents
                for(let i = 0; i < 8; i++) {
                    //select click
                    this.selectRows[type][i][1].addEventListener('click', function() {
                        if(c_obj.elementSelectList.hidden) {
                            c_obj.elementSelectList.changeType(type);
                            c_obj.elementSelectList.changeItemList(c_obj.generateItemList(type, c_obj.currentArmy));
                            c_obj.elementSelectList.changeIndex = i;
                            
                            c_obj.elementSelectList.show();
                        }
                        else {
                            c_obj.selectRows.weapons[i][1].innerHTML = Player.armies[c_obj.currentArmy].weapons[i];
                        }
                    });
                    //selects' parent mouseenter and mouseleave
                    this.selectRows[type][i][1].addEventListener('mouseenter', function() {
                        c_obj.partInfo.innerHTML = stuff.weapons[Player.armies[c_obj.currentArmy].weapons[i]].get_text();
                    });
                    this.selectRows[type][i][1].addEventListener('mouseleave', function() {
                        c_obj.partInfo.innerHTML = '';
                    });
                }
            }
        }

        //army size buttons click functions
        this.armySizeInput.addEventListener('change', () => {
            Player.armies[c_obj.currentArmy].set_size(new Decimal(c_obj.armySizeInput.value));
        });
        this.maxArmySizeButton.addEventListener('click', () => {
            Player.armies[c_obj.currentArmy].set_size(new Decimal(Infinity));
        });

        this.levelUpButton.addEventListener('mouseenter', function() {
            if(Player.armies[c_obj.currentArmy].level < Army.level_prices.length) {
                c_obj.info.innerHTML = Player.armies[c_obj.currentArmy].get_level_up_text();
                c_obj.partInfo.innerHTML = Player.armies[c_obj.currentArmy].get_compare_level_text();
                c_obj.levelText.innerHTML = 'Level: ' + (Player.armies[c_obj.currentArmy].level+1) + 
                                                '<span style="color:' + UtilityFunctions.get_compare_color(Player.armies[c_obj.currentArmy].level, Player.armies[c_obj.currentArmy].level + 1, false)
                                                + '"> &rightarrow; </span>' + (Player.armies[c_obj.currentArmy].level + 2) + '<br>';
            }
        });

        this.levelUpButton.addEventListener('mouseleave', function() {
            c_obj.info.innerHTML = Player.armies[c_obj.currentArmy].get_text();
            c_obj.levelText.innerHTML = 'Level: ' + (Player.armies[c_obj.currentArmy].level+1) + (Player.armies[c_obj.currentArmy].level >= Army.level_prices.length ? ' (Max)' : '');
            c_obj.partInfo.innerHTML = '';
        });

        this.levelUpButton.addEventListener('click', function() {
            Player.armies[c_obj.currentArmy].level_up();
            c_obj.info.innerHTML = Player.armies[c_obj.currentArmy].get_text();
            
            c_obj.levelText.innerHTML = 'Level: ' + (Player.armies[c_obj.currentArmy].level+1);
            if(Player.armies[c_obj.currentArmy].level < Army.level_prices.length) {
                c_obj.info.innerHTML = Player.armies[c_obj.currentArmy].get_level_up_text();
                c_obj.partInfo.innerHTML = Player.armies[c_obj.currentArmy].get_compare_level_text();
                c_obj.levelText.innerHTML = 'Level: ' + (Player.armies[c_obj.currentArmy].level+1) + 
                                                '<span style="color:' + UtilityFunctions.get_compare_color(Player.armies[c_obj.currentArmy].level, Player.armies[c_obj.currentArmy].level + 1, false)
                                                + '">  &rightarrow; </span>' + (Player.armies[c_obj.currentArmy].level + 2) + '<br>';
                c_obj.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[c_obj.currentArmy].level]);
            }
            else {
                c_obj.partInfo.innerHTML = '';
                c_obj.levelText.innerHTML = 'Level: ' + (Player.armies[c_obj.currentArmy].level+1) + ' (Max)';
                c_obj.levelUpButton.hidden = true;
                document.getElementById('ArmyLevelUpCost').hidden = true;
            }
        });
    }
    //called when new save gets loaded
    displayOnLoad() {
        this.info.innerHTML = Player.armies[this.currentArmy].get_text();
        this.armySizeInput.value = StylizeDecimals(Player.armies[this.currentArmy].size,true);
    }
    display() {
        //this.changeArmyButtons[this.currentArmy].buttonClick();
        //this.changeArmy(this.currentArmy);
        if(this.timesVisited == 0) {
            TutorialPage.unlockTutorial('Army Page');
            TutorialPage.startTutorial('Army Page', true, 'ArmyPage');
        }
        this.timesVisited++;
    }
    displayEveryTick(c_obj) {
        c_obj.selectRows.creatures[0][0].innerHTML = (Player.armies[c_obj.currentArmy].creature == 'None'  ? '(&infin;)' : '(' + StylizeDecimals(Player.inventory.creatures[Player.armies[c_obj.currentArmy].creature],true) + ')');
        for(i = 0; i < 8; i++) {
            c_obj.selectRows.weapons[i][0].innerHTML = (Player.armies[c_obj.currentArmy].weapons[i] == 'None' ? '(&infin;)' : '(' + StylizeDecimals(Player.inventory.weapons[Player.armies[c_obj.currentArmy].weapons[i]],true) + ')');
        }
    }
    //called when a save text is needed
    save() {
        let save_text = super.save();

        //save current army
        save_text += '/*/' + this.currentArmy;
        //save equip state
        save_text += '/*/' + Object.keys(this.elementEquipState).length;
        for(let [tipe, type] of Object.entries(this.elementEquipState)) {
            save_text += '/*/' + Object.keys(type).length + '/*/' + tipe;
            for(let [key, value] of Object.entries(type)) {
                save_text += '/*/' + key + '/*/' + value;
            }
        }

        save_text += '/*/' + this.changeArmyButtons.save();

        return save_text;
    }
    //called when you need to get values from a save_text
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = super.load(save_text);

        //reset color before doing anything else
        this.currentArmy = Number(save_text[i]);
        i++;
        let len_type, len_kv;
        len_type = Number(save_text[i]);
        i++;
        for(let ii = 0; ii < len_type; ii++) {
            len_kv = Number(save_text[i]);
            i++;
            let type = save_text[i]; i++;
            for(let iii = 0; iii < len_kv; iii++) {
                this.elementEquipState[type][save_text[i]] = Number(save_text[i+1]);
                i+=2;
            }
        }
        i += this.changeArmyButtons.load(save_text, i);
        this.displayOnLoad();
    }
    changeArmy(change_to) {

        //      reset creature which was used
        this.selectRows.creatures[0][1].innerHTML = Player.armies[change_to].creature;
        
        //      reset weapon selects if they where used
        let k = 0;
        while(k < 8 && Player.armies[this.currentArmy].weapons[k] != 'None') {
            this.selectRows.weapons[k][1].innerHTML = 'None';
            k++;
        }
        //          set new selects and hide selectButtons used
        k = 0;
        this.currentArmy = change_to;
        //     set setters' innerHTML value
        while(k < 8 && Player.armies[this.currentArmy].weapons[k] != "None") {
            this.selectRows.weapons[k][0].parentElement.hidden = false;
            this.selectRows.weapons[k][1].innerHTML = Player.armies[this.currentArmy].weapons[k];
            k++;
        }
        //          show next selector if possible and needed
        //      set the next weapon selector visible if needed and possible
        if( k < Player.armies[this.currentArmy].max_weapons && Player.armies[this.currentArmy].creature != "None") {
            this.selectRows.weapons[k][0].parentElement.hidden = false;
            k++;
        }
        //          hide unused selectors
        //      hide unused weapon selectors
        while(k < Player.armies[this.currentArmy].max_weapons) {
            this.selectRows.weapons[k][0].parentElement.hidden = true;
            k++;
        }
        //          set the info and other stuff
        this.info.innerHTML = Player.armies[change_to].get_text();
        this.armySizeInput.value = StylizeDecimals(Player.armies[change_to].size, true);
        //set level text
        this.levelText.innerHTML = 'Level: ' + (Player.armies[this.currentArmy].level+1);
        if(Player.armies[this.currentArmy].level < Army.level_prices.length) {
            this.levelUpCost.innerHTML = 'Cost: ' +  StylizeDecimals(Army.level_prices[Player.armies[this.currentArmy].level]);
            
            //show level up stuff
            this.levelUpButton.hidden = false;
            document.getElementById('ArmyLevelUpCost').hidden = false;
        }
        else {
            this.levelText.innerHTML += ' (Max)';
            //hide level up stuff
            this.levelUpButton.hidden = true;
            document.getElementById('ArmyLevelUpCost').hidden = true;
        }
        //      if element selection was active, hide it
        if(!this.elementSelectList.hidden) {
            this.elementSelectList.container.hidden = true;
            this.armyManagerContainer.hidden = false;
        }
    }
    equipElementByArmy(type, element, army_nr) {
        if(element != 'None') {
            let nr = 2 ** army_nr;
            if(this.elementEquipState[type][element] == undefined) {
                this.elementEquipState[type][element];
            }
            this.elementEquipState[type][element] += nr;
        }
    }
    deequipElementByArmy(type, element, army_nr) {
        if(element != 'None') {
            let nr = 2 ** army_nr;
            this.elementEquipState[type][element] -= nr;
        }
    }
    isElementEquippedByArmy(type, element, army_nr) {
        let nr = 2 ** army_nr;
        return Math.floor( this.elementEquipState[type][element] / nr ) == 1;
    }
    generateItemList(type, army_nr) {
        let list = []
        for(let element of Object.keys(this.elementEquipState[type])) {
            if(!this.isElementEquippedByArmy(type, element, army_nr)) {
                list.push(element);
            }
        }
        return list;
    }
};

let ArmyPage = new ArmyPageClass('ArmyPage');