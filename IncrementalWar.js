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
                        new PriceHandler([new Decimal(100),new Decimal(200), new Decimal(1000)],['ar','ar','ar','ge'],[new Decimal(1), new Decimal(10),new Decimal(250),new Decimal(1.05)],new Decimal(25) ) ),
        'Dagger' : new ArmyComponent('Dagger','A bit better than a knife, but pricier too.',
                        new Stats(['Attack'], [new SubStats(new Decimal(1.2))]), new Stats(['Hands'], [new Decimal(-1)]),
                        new Stats([],[]), 'Weapon',
                        new PriceHandler([new Decimal(100),new Decimal(300), new Decimal(1000)],['ar','ar','ar','ge'],[new Decimal(2), new Decimal(15),new Decimal(450), new Decimal(1.07)],new Decimal(150)) ),
        'Longsword' : new ArmyComponent('Longsword','A twohanded sword, strong against unarmored opponents',
                        new Stats(['Attack'], [new SubStats(new Decimal(2.5))]), new Stats(['Hands'], [new Decimal(-2)]),
                        new Stats(['Attack'],[new SubStats(new Decimal(1.1))]), 'Weapon',
                        new PriceHandler([new Decimal(90),new Decimal(270), new Decimal(900)],['ar','ar','ar','ge'],[new Decimal(5), new Decimal(25),new Decimal(1000), new Decimal(1.1)], new Decimal(500)) ),
    },
    //Here are all the creatures useable in the game
    creatures : {
        'None' : new ArmyComponent(),
        'Human' : new ArmyComponent('Human','A cheap and reliable worker. Not too efficient, but this is the best you will get for your money.',
                        new Stats(['Health','Attack'], [new Decimal(10), new SubStats(new Decimal(1))]),  new Stats(['Hands'], [new Decimal(2)]),
                        new Stats([],[]), 'Creature',
                        new PriceHandler([new Decimal(4),new Decimal(100), new Decimal(500)],['ar','ar','ar','ar'],[new Decimal(0), new Decimal(1),new Decimal(10),new Decimal(100)],new Decimal(5) ))
    },
    bosses : {
        'Slime' : new Boss( 'Slime', 'A giant slime with a giant ego. He is the guardian of the exit of the first floor.',
                        new Stats(['Attack', 'Defense', 'Health'],[new SubStats(new Decimal(90)), new SubStats(new Decimal(25)), new Decimal(10000)]),
                        'Mini', new Decimal(0), new Moveset([
                            [new AttackMove('Basic Attack', 'A normal attack from a normal enemy.(Attack x1, , Targets: 1)',[new Decimal(1)],['mul']),
                             new AttackMove('Basic Double Attack', 'A normal attack from a normal enemy targeting two beings at once.(Attack x1, , Targets: 2)',[new Decimal(1)],['mul'], new Decimal(2))],
                            [new AttackMove('Triple Attack', 'A normal attack from a normal enemy targeting three beings at once.(Attack x1, , Targets: 3)',[new Decimal(1)],['mul'], new Decimal(3)),
                            new CombinedMove('Attack and Defend', 'The enemy takes a stance where defending and attacking is easier.(Attack and Defense x2, Targets: 2)', [new AttackMove('','',[new Decimal(2)], ['mul'], new Decimal(2)), new DefenseMove('','',[new Decimal(2)], ['mul'])])],
                            [new AttackMove('Fife-Fold Attack', 'The slime empowers itself, then attacks five enemies at once with slightly increased prowess (Attack x1, Targets: 5).', [new Decimal(1)], ['mul'], new Decimal(5))]
                            ])),
    }
}

//A popup window for your inspection needs
let PopupWindow = {
    container: document.querySelector('#PopupWindowContainer'),
    left:undefined,
    top:undefined,
    show(left, top, content) {
        PopupWindow.container.hidden = false;
        PopupWindow.container.innerHTML = content;
        PopupWindow.move(left, top);
    },
    move(left, top) {
        PopupWindow.container.style.left = left + 5;
        PopupWindow.container.style.top = top + 5;
        PopupWindow.left = left;
        PopupWindow.top = top;
    },
    hide() {
        PopupWindow.container.hidden = true;
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
                return 'var(--default-color)';
            }
        }
        else {
            if(value1 == value2) {
                return 'var(--default-color)';
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
    gold : new Decimal(25),
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
             i = this.armies[k].load(save_text,i, k);
             k++;
             j--;
        }

    }
}

//          ALL THE PAGES IN ONE PLACE

class GameManagerClass {
    constructor() {
        this.saveInterval = undefined;
        this.currentPage = 'SettingsPage';
        this.pages = {
            'TowerPage': TowerPage, 'ArmyPage': ArmyPage, 'StorePage': StorePage, 'SettingsPage': SettingsPage, 'BossArmySelectionPage': BossArmySelectionPage,
            'BossFightingPage': BossFightingPage, 'BossFightingResultPage': BossFightingResultPage, 'TutorialPage': TutorialPage,
        };
        //hide all pages at startup
        for(let page of Object.values(this.pages)) {
            page.hidden = true;
        }

        this.canSave = true;

        this.initializeEventListeners();
    }
    startSaveInterval() {
        this.saveInterval = setInterval(this.SaveToLocalStorage,1000);
    }
    stopSaveInterval() {
        clearInterval(this.saveInterval);
    }
    initializeEventListeners() {
        let c_obj = this;

        window.addEventListener('load', () => {
            c_obj.OpenGame();
            c_obj.startSaveInterval();
        });
        //save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                c_obj.LoadOfflineProgress(Date.now() - Number(window.localStorage.getItem('lastSavedTime')));
                c_obj.startSaveInterval();
            }
            else {
                if(window.localStorage.length != 0) {
                    c_obj.SaveToLocalStorage();
                }
                c_obj.stopSaveInterval();
            }
        });
        //save the game before closing
        window.addEventListener('beforeunload', () => {
            c_obj.CloseGame()
        });
    }
    LoadOfflineProgress(nr_miliseconds = 0) {
        let nr_seconds = new Decimal(nr_miliseconds/1000);
        //calculate gold per second
        let gold_per_second = TowerPage.Tower.getGoldPerSecond();
        //handle gold
        let total_gold = gold_per_second.mul(nr_seconds);
        Player.gold = Player.gold.add(total_gold);
    }
    //a function to save game to local storage
    SaveToLocalStorage() {
        if(!this.canSave) {
            return;
        }
        const local_storage = window.localStorage;
        local_storage.clear();
        local_storage.setItem('Player',Player.save());
        local_storage.setItem('Statistics', allThingsStatistics.save());
        local_storage.setItem('Unlocks', UH.save());
        for(let page of Object.values(this.pages)) {
            let text = page.save();
            local_storage.setItem(page.name,text);
        }
        local_storage.setItem('currentPage',GM.currentPage);
        local_storage.setItem('lastSavedTime',Date.now());
    }
    //a function to load game from local storage
    LoadFromLocalStorage() {
        const local_storage = window.localStorage;
        Player.load(local_storage.getItem('Player'));
        allThingsStatistics.load(local_storage.getItem('Statistics'));
        UH.load(local_storage.getItem('Unlocks'));
        //load pages
        for(let page of Object.values(this.pages)) {
            page.load(local_storage.getItem(page.name));
        }
        //load offline progress
        //  shinaningans to get the current page to display correctly (CHANGE THIS?)
        let a = local_storage.getItem('currentPage');
        if(a == 'TowerPage') {
            GB.pageButtons.selected = 1;
            this.currentPage = 'ArmyPage';
        }
        else {
            GB.pageButtons.selected = 0;
            this.currentPage = 'TowerPage';
        }
        for(let i = 0; i < GB.pageButtons.buttons.length; i++) {
            if(GB.pageButtons.buttons[i].getAttribute('page') == a) {
                GB.pageButtons.buttonClick(i);
            }
        }
        this.LoadOfflineProgress(Date.now() - Number(local_storage.getItem('lastSavedTime')), a);
        return true;
    }
    OpenGame() {
        if(window.localStorage.length != 0) {
            this.LoadFromLocalStorage();
        }
        else {
            /*document.getElementById("OfflinePageContainer").hidden = true;
            //UNCOMMENT THIS
            HidePages('SettingsPage');
            this.pages[GM.currentPage].display();*/
            this.SaveToLocalStorage();
            this.LoadFromLocalStorage();
        }
    }
    CloseGame() {
        this.SaveToLocalStorage();
    }
}

let GM = new GameManagerClass();

let interval = setInterval(function() {SettingsPage.displayEveryTick(SettingsPage)},50);

function HidePages(toShow) {
    if(toShow != GM.currentPage) {
        clearInterval(interval);
        GM.pages[GM.currentPage].hidden = true;
        GM.pages[toShow].hidden = false;
        GM.currentPage = toShow;
        interval = setInterval(function() {GM.pages[GM.currentPage].displayEveryTick(GM.pages[GM.currentPage])},50);
        GM.pages[toShow].display();
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
}


//click event for the continue from offline button
document.getElementById('ContinueFromOfflineProgress').addEventListener('click', function() {
    //change current page to be able to use HidePages
    currentPage = Number(window.localStorage.getItem('currentPage')) ? 0 : 1;
    document.getElementById('OfflinePageContainer').hidden = true;
    document.getElementById('PageButtonsContainer').hidden = false;
    goldText.parentElement.hidden = false;
    //UNCOMMENT THIS
    HidePages(currentPage);
});

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
        document.getElementById('PageButtonsContainer').hidden = false;
        goldText.parentElement.hidden = false;
        HidePages(window.localStorage.getItem('currentPage'));
    }
    else {
        console.log('here');
        document.getElementById("OfflinePageContainer").hidden = true;
        //UNCOMMENT THIS
        HidePages(4);
        pages[currentPage].displayOnLoad();
        SaveToLocalStorage();
        SettingsPage.changeTheme();
    }
}

function CloseGame() {
    if(window.localStorage.length != 0) {
        SaveToLocalStorage();
    }

}

let save_interval;

//load the game on each session when starting up
window.addEventListener('load', () => {
    OpenGame();
    save_interval = setInterval(SaveToLocalStorage,1000);
});
//save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        let a = Number(window.localStorage.getItem('currentPage'));
        LoadOfflineProgress(Date.now() - Number(window.localStorage.getItem('lastSavedTime')), a);
        save_interval = setInterval(SaveToLocalStorage,1000);
    } else {
        if(window.localStorage.length != 0) {
            SaveToLocalStorage();
        }

        clearInterval(save_interval);
    }
});
//save the game before closing
window.addEventListener('beforeunload', () => {CloseGame()});
function tick() {
    goldText.innerHTML = StylizeDecimals(Player.gold);
    for(i = 0; i < TowerPage.Tower.raidedLevels.length; i++) {
        TowerPage.Tower.floors[TowerPage.Tower.raidedLevels[i][0]].levels[TowerPage.Tower.raidedLevels[i][1]].tick(20);
    }
}

setInterval(tick,50);
