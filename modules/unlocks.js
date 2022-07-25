IsUnlocked = {
    //the pages 
    pages : {
        tower_page : [0],
        army_page : [0, 0],
        buy_weapon_page : [0, 0, 0],
    },
    towerLevels : {
        0 : [1, 0, 0, 0, 0, 0, 0,],
        1 : [0],
    },
    tower : {
        floors : [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    save() {
        save_text = 'towerLevels';
        let i;
        for(let cat in this.towerLevels) {
            save_text += '/*/' + cat + '/*/' + this.towerLevels[cat].length;
            for(i = 0; i < this.towerLevels[cat].length; i++) {
                save_text += '/*/' + this.towerLevels[cat][i];
            }
        }
        return save_text;
    },
    //gets savetext without 'towerLevels'
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0, cat, len, j;
        while(i < save_text.length) {
            cat = Number(save_text[i]);
            i++;
            len = Number(save_text[i]);
            i++;
            for(j = 0; j < len; j++,i++) {
                if(cat == 0 && j == 0) {
                    continue;
                }
                if(Number(save_text[i]) == 1) {
                    Unlockables.towerLevels[cat][j].unlock_stuff();
                }
                else {
                    Unlockables.towerLevels[cat][j].lock_stuff();
                }
                
            }
        }
        
    }
}

/*
    Unlock types:
        -quantity: the quantity of something you check is greater or equal to what needs to be checked
        -unlock: checks previous unlocks
    How to create:
    -quantity:
        Unlock(type, how_much_is_needed, is_it_a_visible_object_on_screen_or_not, firts_thing_and_where_to_find_it_in_UnlockedStuff, second_thing_and_where_to_find_it)
        firts_thing_and_where_to_find_it_in_UnlockedStuff = page_name, subpage, index
    -unlock:
        Unlock(type, [how_much_is_needed, where_is_first_thing_needed_in_IsUnlocked, where_is_second_thing_needed_in_IsUnlocked, ...],
               is_it_a_visible_object_on_screen_or_not, firts_thing_and_where_to_find_it_in_UnlockedStuff, second_thing_and_where_to_find_it)
*/
class Unlock {
    constructor(type = 'quantity', price = new Decimal(1), isVisible = false, path = ['none','none',0, 'none','none',1]) {
        this.type = type;
        this.price = price;
        this.isVisible = isVisible;
        this.path = path;
    }

    can_unlock(value) {
        switch(this.type) {
            case 'quantity':
                if(this.price.lte(value)) {
                    return true;
                }
                return false;
            case 'unlock' :
                let sum = 0;
                for(let i = 1; i < this.price.length; i+=3) {
                    sum += IsUnlocked[this.price[i]][this.price[i+1]][this.price[i+2]];
                }
                if(sum >= this.price[0]) {
                    return true;
                }
                return false;
        }
    }

    unlock_stuff() {
        if(IsUnlocked[this.path[0]][this.path[1]][this.path[2]]) {
            return;
        }
        if(Array.isArray(this.isVisible)) {
            let i;
            for(i = 0; i < this.isVisible.length; i++) {
                IsUnlocked[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]] = 1;
                if(this.isVisible[i]) {
                    UnlockedStuff[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]].hidden = false;
                }
            }
        }
        else {
            IsUnlocked[this.path[0]][this.path[1]][this.path[2]] = 1;
            if(this.isVisible) {
                UnlockedStuff[this.path[0]][this.path[1]][this.path[2]].hidden = false;
            }
        }
        
    }

    lock_stuff() {
        if(!IsUnlocked[this.path[0]][this.path[1]][this.path[2]]) {
            return;
        }
        if(Array.isArray(this.isVisible)) {
            let i;
            for(i = 0; i < this.isVisible.length; i++) {
                IsUnlocked[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]] = 0;
                if(this.isVisible[i]) {
                    UnlockedStuff[this.path[i*3]][this.path[i*3 + 1]][this.path[i*3 + 2]].hidden = true;
                }
            }
        }
        else {
            IsUnlocked[this.path[0]][this.path[1]][this.path[2]] = 0;
        }
        if(this.isVisible) {
            UnlockedStuff[this.path[0]][this.path[1]][this.path[2]].hidden = true;
        }
    }
}

//a system for unlocking everything you need
/* 
    How it works:
        -first, you specify the page wher to look for something
        -then you specify the thing you are looking for
        -then comes a list with Unlocks, which will specify what and how you will unlock stuff
*/
//AUTOMATED WAY TO PASS EVERYTHING FROM buyer, army, tower AND towerLevels TO unlockNow SO THAT I WON'T HAVE
//TO ADD IN AN ENTRY MANUALLY THERE FOR EVERY NEW ITEM!
Unlockables = {
    buyer : {
        'Human' : [new Unlock('quantity', new Decimal(1), true, ['pages','army_page',0]), ],
        'Knife' : [new Unlock('quantity', new Decimal(2), true, ['pages','buy_weapon_page',1]), new Unlock('quantity', new Decimal(3), true, ['pages','buy_weapon_page',2])],
        'Dagger' : [new Unlock('quantity', new Decimal(1), true, ['pages','buy_weapon_page',2])]
    },
    army : {
        'power' : [new Unlock('quantity', new Decimal(1), [true, true], ['pages','buy_weapon_page',0,'pages','tower_page',0])],
        'size' : [],
    },
    towerLevels : {
        0 : [0, new Unlock('unlock',[1, 'towerLevels', 0, 0], [false, true], ['towerLevels', 0, 1,'pages','army_page',1]), new Unlock('unlock',[1, 'towerLevels', 0, 0] , false, ['towerLevels', 0, 2]), 
                new Unlock('unlock',[1, 'towerLevels', 0, 1, 'towerLevels', 0, 2], false, ['towerLevels', 0, 3]), 
                new Unlock('unlock',[1, 'towerLevels', 0, 1] , false, ['towerLevels', 0, 4]), new Unlock('unlock',[1, 'towerLevels', 0, 2] , false, ['towerLevels', 0, 5]),
                new Unlock('unlock',[1, 'towerLevels', 0, 3] , [false, true], ['towerLevels', 0, 6, 'pages','buy_weapon_page',1]), new Unlock('unlock',[1, 'towerLevels', 0, 6] , false, ['towerLevels', 0, 7]),
                new Unlock('unlock',[1, 'towerLevels', 0, 6] , false, ['towerLevels', 0, 8])],
        1 : [new Unlock('unlock',[1, 'towerLevels', 0, 4, 'towerLevels', 0, 5], false, ['towerLevels', 1, 0]),],
    },
    //THINKING NEEDED
    tower : {
        'floors' : [0, 1,]
    },
    unlockNow : {
        buyer : {
            'Human' : 0,
            'Knife' : 0,
            'Dagger' : 0,
        },
        army : {
            'power' : 0,
            'size' : 0,
        }
    },
    //control unlock function; tries to unlock stuff if it is unlockable
    unlock(path = ["none","none"], value = new Decimal(0), unlock_nr = undefined) {
        unlock_nr = (unlock_nr == undefined ? this.unlockNow[path[0]][path[1]] : unlock_nr);
        if(this[path[0]][path[1]] == undefined) {
            return;
        }
        while(unlock_nr < this[path[0]][path[1]].length && this[path[0]][path[1]][unlock_nr].can_unlock(value)) {
            this[path[0]][path[1]][unlock_nr].unlock_stuff();
            unlock_nr++;
            if(this.unlockNow[path[0]] == undefined || this.unlockNow[path[0]][path[1]] == undefined) {
                break;
            }
        }
        if(this.unlockNow[path[0]] != undefined && this.unlockNow[path[0]][path[1]] != undefined) {
            this.unlockNow[path[0]][path[1]] = unlock_nr;
        }
        
    },
    ///used to save unlocked and unlock now part
    save() {
        let save_text = '';
        //save unlockNow
        let cat, i, type;
        for( cat in Unlockables.unlockNow) {
            for( type in Unlockables.unlockNow[cat]) {
                save_text += cat + '/*/' + type + '/*/' + Unlockables.unlockNow[cat][type] + '/*/';
            }
        }
        //save tower levels
        save_text += IsUnlocked.save();
        return save_text;
    },
    //load save text, where there are visible differences, unlock/lock content
    load(save_text) {
        //console.log(save_text);
        save_text = save_text.split('/*/towerLevels/*/');
        IsUnlocked.load(save_text[1]);
        save_text = save_text[0].split('/*/');
        let i = 0, len, type, name, j;
        //load unlockNow and everything that is unlocked as of yet
        while(i < save_text.length) {
            type = save_text[i];
            name = save_text[i+1];
            len =  Number(save_text[i+2]);
            //unlock stuff 
            for(j = 0; j < len; j++) {
                Unlockables[type][name][j].unlock_stuff();
            }
            while(j < Unlockables[type][name].length && Unlockables[type][name]) {
                Unlockables[type][name][j].lock_stuff();
                j++;
            }
            Unlockables.unlockNow[type][name] = len;
            i += 3;
        }
        i++;
    },
};