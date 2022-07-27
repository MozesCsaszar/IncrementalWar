/*

Created by: Császár Mózes (mozescsaszar@gmail.com)
Code use is only permitted for personal, non-commercial or non-commercial cases. Please don't 
use or reuse part of the project in an application released to target audiences greater than
family or close circle of friends.

*/

//For save files: field separator: /*/ ; page separator: '*/*'

stuff = {
    //Here are the weapons useable in the game
    weapons : {
        'None' : new ArmyComponent(),
        'Knife' : new ArmyComponent('Knife', 'A thrustworthy knife, even if it is not the best for your needs. Simple to use and reliable.', 
                        new Stats(['Attack'], [new SubStats(new Decimal(1))]), new Stats(['Hands'], [new Decimal(-1)]),
                        new Stats([],[]), 'Weapon', 
                        new PriceHandler([new Decimal(100),new Decimal(1000), new Decimal(10000)],['ar','ar','ar','ar'],[new Decimal(0.07), new Decimal(1),new Decimal(15),new Decimal(220)],new Decimal(15) ) ),
        'Dagger' : new ArmyComponent('Dagger','A bit better than a knife, but pricier too.', 
                        new Stats(['Attack'], [new SubStats(new Decimal(1.2))]), new Stats(['Hands'], [new Decimal(-1)]),
                        new Stats([],[]), 'Weapon', 
                        new PriceHandler([new Decimal(100),new Decimal(300), new Decimal(600), new Decimal(1000)],['ar','ar','ar','ar', 'ar'],[new Decimal(0.5), new Decimal(2),new Decimal(7), new Decimal(16),new Decimal(225)],new Decimal(500)) ),
        'Longsword' : new ArmyComponent('Longsword','A twohanded sword, strong against unarmored opponents', 
                        new Stats(['Attack'], [new SubStats(new Decimal(2.5))]), new Stats(['Hands'], [new Decimal(-2)]),
                        new Stats(['Attack'],[new SubStats(new Decimal(1.1))]), 'Weapon', 
                        new PriceHandler([new Decimal(30),new Decimal(300), new Decimal(3000)],['ar','ar','ge','ge'],[new Decimal(30), new Decimal(300),new Decimal(1.03), new Decimal(1.1)], new Decimal(25)) ),
    },
    //Here are all the creatures useable in the game
    creatures : {
        'None' : new ArmyComponent(),
        'Human' : new ArmyComponent('Human','A cheap and reliable worker. Not too efficient, but this is the best you will get for your money.', 
                        new Stats(['Health','Attack'], [new Decimal(10), new SubStats(new Decimal(1))]),  new Stats(['Hands'], [new Decimal(2)]),
                        new Stats([],[]), 'Creature',
                        new PriceHandler([new Decimal(100),new Decimal(1000), new Decimal(10000)],['ar','ar','ar','ar'],[new Decimal(0.03), new Decimal(0.5),new Decimal(10),new Decimal(100)],new Decimal(5) ))
    },
    bosses : {
        'Slime' : new Boss( 'Slime', 'A giant slime with a giant ego. He is the guardian of the exit of the first floor.', 
                        new Stats(['Attack', 'Defense', 'Health'],[new SubStats(new Decimal(27)), new SubStats(new Decimal(15)), new Decimal(10000)]),
                        'Mini', new Decimal(0), new Moveset([
                            [new AttackMove('Basic Attack', 'A normal attack from a normal enemy.',[new Decimal(1)],['mul']),
                             new AttackMove('Basic Triple Attack', 'A normal attack from a normal enemy targeting three beings at once.',[new Decimal(1)],['mul'], new Decimal(3))],
                            [new DefenseMove('Defend', 'The enemy takes a defensive stance, increasing defenses.', [new Decimal(3)], ['mul']),
                            new CombinedMove('Attack and Defend', 'The enemy takes a stance where defending and attacking is easier.', [new AttackMove('','',[new Decimal(2)], ['mul'], new Decimal(2)), new DefenseMove('','',[new Decimal(2)], ['mul'])])]])),
    }
}

//A popup window for your inspection needs
const PopupWindow = {
    container: document.querySelector('#PopupWindowContainer'),
    show(left, top, content) {
        this.container.hidden = false;
        this.container.innerHTML = content;
        this.container.style.left = left + 5;
        this.container.style.top = top + 5;
    },
    move(left, top) {
        this.container.style.left = left + 5;
        this.container.style.top = top + 5;
    },
    hide() {
        this.container.hidden = true;
    },
};

const UtilityFunctions = {
    get_compare_color(value1,value2, decimal = true) {
        if(decimal) {
            if(value1.gt(value2)) {
                return 'red';
            }
            else if(value1.lt(value2)) {
                return 'green';
            }
            else {
                return 'black';
            }
        }
        else {
            if(value1 == value2) {
                return 'black';
            }
            if(value1 > value2) {
                return 'red';
            }
            else {
                return 'green';
            }
        }
    },
}


//a function to adjust the appearance of decimal numbers (e form and trying to avoid inconsistent numbers messing up the interface, like 48.0000001 instead of 48)
function StylizeDecimals(decimal, floor = false) {
    if(decimal.exponent >= 6) {
        return decimal.mantissa.toFixed(2) + 'e' + decimal.exponent;
    }
    if(!floor) {
        if(decimal.exponent > 4){
            return (decimal.mantissa*Math.pow(10,decimal.exponent)).toFixed(0);
        }
        else {
            return (decimal.mantissa*Math.pow(10,decimal.exponent)).toFixed(Math.min(5-decimal.exponent, 2), 2);
        }
    }
    else {
        return (decimal.mantissa*Math.pow(10,decimal.exponent)).toFixed(0);
    }
    
}

const Player = {
    gold : new Decimal(1000),
    armies : [new Army(), new Army(), new Army()],
    inventory: {
        creatures : {

        },
        weapons : {

        }
    },
    save() {
        //  save gold
        let save_text = this.gold + '/*/';
        //save inventory
        save_text += Object.keys(this.inventory).length;
        for(category in this.inventory) {
            save_text += '/*/' + category;
            save_text += '/*/' + Object.keys(this.inventory[category]).length;
            for(item in this.inventory[category]) {
                save_text += '/*/' + item + '/*/' + this.inventory[category][item];
            }
        }
        //  save armies
        save_text += '/*/' + this.armies.length;
        for(let i = 0; i < this.armies.length; i++) {
            save_text += '/*/' + this.armies[i].save();
        }
        
        return save_text
    },
    load(save_text) {
        //split and get ready for loading
        save_text = save_text.split('/*/');
        let i = 0;
        //load gold
        this.gold = new Decimal(save_text[i]);
        i++;
        //  load inventory
        //reset inventory
        delete this.inventory;
        this.inventory = {};
        let j = new Number(save_text[i]);
        let k = 0;
        i++;
        while(j > 0) {
            let category = save_text[i];
            i++;
            k = new Number(save_text[i]);
            i++;
            this.inventory[category] = {};
            while(k > 0) {
                this.inventory[category][save_text[i]] = new Decimal(save_text[i+1]);
                i+=2;
                k--;
            }
            j--;
        }
        //load armies
        j = new Number(save_text[i]);
        i++;
        k = 0;
        while(j > 0) {
             i = this.armies[k].load(save_text,i);
             k++;
             j--;
        }
        
    }
}

//          SETTINGS PAGE
const downloadToFile = (content, filename = 'GameSave', contentType = 'text/plain') => {
    const a = document.createElement('a');
    const file = new Blob([content], {type: contentType});
    
    a.href= URL.createObjectURL(file);
    a.download = filename;
    a.click();
  
    URL.revokeObjectURL(a.href);
};

const SettingsPage = {
    pageButton : undefined,
    container : undefined,
    saveGameButton : undefined,
    loadGameButton : undefined,
    display() {

    },
    displayEveryTick() {

    },
    displayOnLoad() {

    },
    save() {

    },
    load(save_text) {

    },
    
}

SettingsPage.pageButton = document.getElementById('SettingsPageButton');
SettingsPage.container = document.getElementById('SettingsPageContainer');
SettingsPage.saveGameButton = document.getElementById('SaveGameButton');
SettingsPage.loadGameButton = document.getElementById('LoadGameButton');

//Save your game to file
SettingsPage.saveGameButton.addEventListener('click', () => {
    let save_text = Player.save();
    for(let i = 0; i < pages.length; i++) {
        save_text += '*/*' + pages[i].save();
    }
    save_text += '*/*' + Unlockables.save();
    save_text += '*/*' + String(currentPage);
    save_text += '*/*' + Date.now();
    downloadToFile(save_text);
});

//Load in your game from file
SettingsPage.loadGameButton.addEventListener('input', () => {
    if(SettingsPage.loadGameButton.files.length) {
        let file_reader = new FileReader();
        file_reader.onload = () => {
            let save_text = file_reader.result;
            save_text = save_text.split('*/*');
            let i = 0;
            Player.load(save_text[i]);
            i++;
            Unlockables.load(save_text[i]);
            i++;
            for(let j = 0; j < pages.length; j++, i++) {
                pages[j].load(save_text[i]);
            }
            HidePages(Number(save_text[i]));
            i++;
            LoadOfflineProgress(Date.now() - Number(save_text[i]));
            i++;
        };
        
        
        file_reader.readAsText(SettingsPage.loadGameButton.files[0]);
    }
});

//          UNLOCKS

UnlockedStuff = {
    pages : {
        tower_page : [TowerPage.pageButton],
        army_page : [ArmyPage.pageButton, ArmyPage.levelUpButton],
        buy_weapon_page : [BuyWeaponPage.pageButton, BuyWeaponPage.buyButtons[1].parentElement, BuyWeaponPage.buyButtons[2].parentElement],
    },
}


//          ALL THE PAGES IN ONE PLACE

const body = document.getElementById('body');

const pages = [TowerPage,ArmyPage, BuyCreaturePage, BuyWeaponPage, SettingsPage, BossArmySelectionPage, BossFightPage, BossFightingResultPage];
const page_names = ['TowerPage', 'ArmyPage', 'BuyCreaturePage', 'BuyWeaponPage', 'SettingsPage'];

//Hide all unnecessary pages at startup
for(let i = 0; i < pages.length ; i++) {
    pages[i].container.hidden = true;
}

//* UNCOMMENT THIS
for(let i = 0; i < pages.length; i++) {
    if(pages[i].pageButton != undefined) {
        pages[i].pageButton.addEventListener('click',  () => {
            HidePages(i);
        });
    }
    
}

//*/
var currentPage = 0;

let interval = setInterval(TowerPage.displayEveryTick,50);

function HidePages(toShow) {
    if(toShow != currentPage) {
        clearInterval(interval);
        pages[currentPage].container.hidden = true;
        pages[toShow].container.hidden = false;
        currentPage = toShow;
        interval = setInterval(pages[currentPage].displayEveryTick,50);
        pages[toShow].display();
    }
}
//          THE INTERPAGE STUFF         \\
const goldText = document.querySelector('#GoldText');

//a function to handle offline progress
function LoadOfflineProgress(nr_miliseconds = 0, current_page) {
    let load_text = 'Here\'s what your servants did in your absence:<br>';
    let nr_seconds = new Decimal(nr_miliseconds/1000);
    //calculate gold per second
    let gold_per_second = new Decimal(0);
    for(i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
        gold_per_second = gold_per_second.add(TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].goldPerSecond);
    }
    //handle gold
    let total_gold = gold_per_second.mul(nr_seconds);
    load_text += '&nbsp&nbsp&nbsp&nbsp<span style="color:gold">Gold: ' + StylizeDecimals(total_gold) + '</span>';
    Player.gold = Player.gold.add(total_gold);

    //display offline load text
    document.getElementById('OfflineInfoText').innerHTML = load_text;
    //click event for the continue from offline button
    document.getElementById('ContinueFromOfflineProgress').addEventListener('click', function() {
        //change current page to be able to use HidePages
        currentPage = current_page ? 0 : 1;
        document.getElementById('OfflinePageContainer').hidden = true;
        document.getElementById('PageButtonsContainer').hidden = false;
        goldText.parentElement.hidden = false;
        //UNCOMMENT THIS
        HidePages(current_page);
    });
}

//a function to save game to local storage
function SaveToLocalStorage() {
    const local_storage = window.localStorage;
    local_storage.clear();
    local_storage.setItem('Player',Player.save());
    for(let i = 0; i < pages.length; i++) {
        let text = pages[i].save();
        local_storage.setItem(page_names[i],text);
    }
    local_storage.setItem('Unlockables',Unlockables.save());
    local_storage.setItem('currentPage',String(currentPage));
    local_storage.setItem('lastSavedTime',Date.now());
}

//a function to load game from local storage
function LoadFromLocalStorage() {
    const local_storage = window.localStorage;
    Unlockables.load(local_storage.getItem('Unlockables'));
    Player.load(local_storage.getItem('Player'));
    for(let i = 0; i < pages.length; i++) {
        pages[i].load(local_storage.getItem(page_names[i]));
    }
    //load offline progress
    let a = Number(local_storage.getItem('currentPage'));
    //hide stuff to show a proper offline load page
    document.getElementById('PageButtonsContainer').hidden = true;
    goldText.parentElement.hidden = true;
    LoadOfflineProgress(Date.now() - Number(local_storage.getItem('lastSavedTime')), a);
}

function OpenGame() {
    if(window.localStorage.length != 0) {
        LoadFromLocalStorage();
    }
    else {
        document.getElementById("OfflinePageContainer").hidden = true;
        //UNCOMMENT THIS
        HidePages(2);
        pages[currentPage].displayOnLoad();
        SaveToLocalStorage();
    }
}

function CloseGame() {
    //SaveToLocalStorage();
}

//load the game on each session when starting up
window.addEventListener('load', () => {OpenGame()});
//save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
//document.addEventListener('visibilitychange', SaveToLocalStorage);
//save the game before closing
window.addEventListener('beforeunload', () => {CloseGame()});

//setInterval(SaveToLocalStorage,1000);

function tick() {
    goldText.innerHTML = StylizeDecimals(Player.gold);
    for(i = 0; i < TowerPage.Tower.raidedFloors.length; i++) {
        TowerPage.Tower.floors[TowerPage.Tower.raidedFloors[i][0]].levels[TowerPage.Tower.raidedFloors[i][1]].tick(20);
    }
}

setInterval(tick,50);


//REMOVE THIS
/*
for(let i = 0; i < pages.length ; i++) {
    pages[i].container.hidden = true;
}
*/