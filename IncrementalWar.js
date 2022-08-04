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
    changeThemeButton : undefined,
    colorThemes: {
        'Black Theme': [
            ['--default-background-color', 'rgb(14, 14, 15)'],
            ['--default-color', 'rgb(240, 248, 255)'],
            ['--default-toggle-button-border-color', 'rgb(255, 69, 0)'],
            ['--selected-toggle-button-border-color', 'rgb(64, 00, 255)'],
            ['--default-button-border-color', 'rgb(69,192,0)'],
            ['--default-tower-floor-background-color', 'rgb(255, 255, 0)'],
            ['--hover-tower-floor-background-color', 'rgb(214, 188, 40)'],
            ['--selected-tower-floor-background-color', 'rgb(194, 146, 24)'],
            ['--hover-selected-tower-floor-background-color', 'rgb(156, 116, 13)'],
            ['--default-tower-floor-color', 'rgb(0, 0, 0)'],
            ['--default-tower-floor-border-color', 'rgb(0, 0, 0)'],
            ['--default-tower-level-background-color', 'rgb(222, 184, 135)'], 
            ['--disabled-tower-level-background-color', 'rgb(70, 66, 61)'],
            ['--default-selection-list-border-color', 'rgb(128, 0, 128)'],
        ],
        'Grey Theme' : [
            ['--default-background-color', 'rgb(60, 60, 67)'],
            ['--default-color', 'rgb(255, 255, 255)'],
            ['--default-toggle-button-border-color', 'rgb(255, 55, 20)'],
            ['--selected-toggle-button-border-color', 'rgb(53, 101, 202)'],
            ['--default-button-border-color', 'rgb(102, 185, 53)'],
            ['--default-tower-floor-background-color', 'rgb(218, 218, 37)'],
            ['--hover-tower-floor-background-color', 'rgb(214, 188, 40)'],
            ['--selected-tower-floor-background-color', 'rgb(194, 146, 24)'],
            ['--hover-selected-tower-floor-background-color', 'rgb(156, 116, 13)'],
            ['--default-tower-floor-color', 'rgb(0, 0, 0)'],
            ['--default-tower-floor-border-color', 'rgb(24, 23, 32)'],
            ['--default-tower-level-background-color', 'rgb(199, 156, 99)'], 
            ['--disabled-tower-level-background-color', 'rgb(54, 52, 49)'],
            ['--default-selection-list-border-color', 'rgb(112, 5, 112)'],
        ],
        'Dark Red Theme' : [
            ['--default-background-color', 'rgb(35, 7, 9)'],
            ['--default-color', 'rgb(168, 127, 52)'],
            ['--default-toggle-button-border-color', 'rgb(252, 25, 25)'],
            ['--selected-toggle-button-border-color', 'rgb(145, 76, 45)'],
            ['--default-button-border-color', 'rgb(252, 25, 25)'],
            ['--default-tower-floor-background-color', 'rgb(146, 0, 0)'],
            ['--hover-tower-floor-background-color', 'rgb(110, 0, 0)'],
            ['--selected-tower-floor-background-color', 'rgb(90, 9, 9)'],
            ['--hover-selected-tower-floor-background-color', 'rgb(73, 9, 9)'],
            ['--default-tower-floor-color', 'rgb(39, 1, 1)'],
            ['--default-tower-floor-border-color', 'rgb(41, 0, 0)'],
            ['--default-tower-level-background-color', 'rgb(184, 21, 62)'], 
            ['--disabled-tower-level-background-color', 'rgb(73, 27, 27)'],
            ['--default-selection-list-border-color', 'rgb(128, 0, 128)'],
        ],
    },
    themeOrder: ['Black Theme', 'Dark Red Theme'],
    currentTheme: -1,
    tutorialButton: undefined,
    changeTheme() {
        SettingsPage.currentTheme++;
        if(SettingsPage.currentTheme == SettingsPage.themeOrder.length) {
            SettingsPage.currentTheme = 0;
        }
        SettingsPage.changeThemeButton.innerHTML = SettingsPage.themeOrder[SettingsPage.currentTheme];
        for(let j = 0; j < SettingsPage.colorThemes[SettingsPage.themeOrder[SettingsPage.currentTheme]].length; j++) {
            document.body.style.setProperty(...SettingsPage.colorThemes[SettingsPage.themeOrder[SettingsPage.currentTheme]][j]);
        }
    },
    display() {

    },
    displayEveryTick() {

    },
    displayOnLoad() {

    },
    save() {

    },
    load(save_text) {
        SettingsPage.changeTheme();
    },
    
}

SettingsPage.pageButton = document.getElementById('SettingsPageButton');
SettingsPage.container = document.getElementById('SettingsPageContainer');
SettingsPage.saveGameButton = document.getElementById('SaveGameButton');
SettingsPage.loadGameButton = document.getElementById('LoadGameButton');


//Theme button
SettingsPage.changeThemeButton = document.getElementById('ChangeTheme');
SettingsPage.changeThemeButton.addEventListener('click', function() {
    SettingsPage.changeTheme();
});



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

//tutorial button
SettingsPage.tutorialButton = document.querySelector('#SettingsPageTutorialButton');
SettingsPage.tutorialButton.addEventListener('click', function() {
    TutorialPage.startTutorial('None', false, 4);
    HidePages(8);
});

class TutorialItem {
    constructor(name, nr_pages) {
        this.name = name;
        this.nr_pages = nr_pages;
    }
};

const TutorialPage = {
    container : document.querySelector('#TutorialPageContainer'),
    isMandatory: false,
    tutorialName: '',
    lastPage: undefined,
    currentEntry: 0,
    selectionList: document.querySelector('.element_select_list.page_tutorial'),
    selectionListItems: document.querySelectorAll('.element_select_list.page_tutorial > .element_select_list_item'),
    image: document.querySelector('.tutorial_image.page_tutorial'),
    previousButton: document.querySelector('.tutorial_previous_button.page_tutorial'),
    nextButton: document.querySelector('.tutorial_next_button.page_tutorial'),
    backButton: document.querySelector('.element_select_list_back_button.page_tutorial'),
    tutorials: {
        'Army Page': new TutorialItem('Army Page', 3),
        'Buy Creature Page': new TutorialItem('Buy Creature Page',1),
        'Buy Weapon Page': new TutorialItem('Buy Weapon Page',1),
        'Tower Page': new TutorialItem('Tower Page', 3),
    },
    unlockedTutorials : new Set(),
    defaultTutorialPath: './images/tutorial/',
    display() {

    },
    displayEveryTick() {

    },
    displayOnLoad() {

    },
    save() {
        let save_text = String(this.unlockedTutorials.size);
        for(let elem of this.unlockedTutorials) {
            save_text += '/*/' + elem;
        }
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0, j = 0;
        let len = Number(save_text[i]);
        i++;
        while(j < len) {
            this.unlockedTutorials.push(save_text[i]);
            i++; j++;
        }
    },
    unlockTutorial(name) {
        this.unlockedTutorials.add(name);
    },
    getTutorialImageName() {
        return this.defaultTutorialPath + this.tutorialName + String(this.currentEntry) + '.png';
    }, 
    setUpSelectionList() {
        let i =0;
        for(let value of this.unlockedTutorials.keys()) {
            this.selectionListItems[i].innerHTML = value;
            i++;
        }
        for(i; i < this.selectionListItems.length; i++) {
            this.selectionListItems[i].innerHTML = '';
        }
    },
    setTutorialButtons() {
        if(this.currentEntry == 0) {
            this.previousButton.hidden = true;
        }
        else {
            this.previousButton.hidden = false;
        }
        if(this.currentEntry == this.tutorials[this.tutorialName].nr_pages - 1) {
            if(this.isMandatory) {
                this.nextButton.innerHTML = 'Finish';
            }
            else {
                this.nextButton.hidden = true;
            }
        }
        else {
            this.nextButton.hidden = false;
            this.nextButton.innerHTML = 'Next';
        }
    },
    setUpTutorial(tutorial_name, is_mandatory, last_page) {
        this.lastPage = last_page;
        this.isMandatory = is_mandatory;
        this.tutorialName = tutorial_name;
        //if the thing is mandatory, hide selection list
        if(is_mandatory) {
            this.selectionList.hidden = true;
        }
        //if it is not mandatory, set up and show selection list
        else {
            this.selectionList.hidden = false;
            this.setUpSelectionList();
        }
        if(tutorial_name == 'None') {
            this.selectionList.hidden = false;
            this.image.parentElement.hidden = true;
            return;
        }
        else {
            this.image.parentElement.hidden = false;
        }
        this.currentEntry = 0;
        this.image.setAttribute('src', this.getTutorialImageName());
        this.setTutorialButtons();
    },
    startTutorial(tutorial_name, is_mandatory, last_page) {
        this.setUpTutorial(tutorial_name, is_mandatory, last_page);
        document.querySelector('#PageButtonsContainer').hidden = true;
        if(is_mandatory) {
            HidePages(8);
        }
    },
    showPreviousEntry() {
        this.currentEntry--;
        this.image.setAttribute('src', this.getTutorialImageName());
        this.setTutorialButtons();
    },
    showNextEntry() {
        this.currentEntry++;
        this.image.setAttribute('src', this.getTutorialImageName());
        this.setTutorialButtons();
    },
    exitTutorial() {
        document.querySelector('#PageButtonsContainer').hidden = false;
        if(this.isMandatory) {
            this.selectionList.hidden = false;
        }
        HidePages(this.lastPage);
    },
}

TutorialPage.backButton.addEventListener('click', function() {
    TutorialPage.exitTutorial();
});

TutorialPage.previousButton.addEventListener('click', function() {
    TutorialPage.showPreviousEntry();
});

TutorialPage.nextButton.addEventListener('click', function() {
    if(TutorialPage.nextButton.innerHTML == 'Finish') {
        TutorialPage.exitTutorial();
    }
    else {
        TutorialPage.showNextEntry();
    }
});

//tutorial selecion list item click values
for(let i = 0; i < TutorialPage.selectionListItems.length; i++) {
    TutorialPage.selectionListItems[i].addEventListener('click', function() {
        if(TutorialPage.selectionListItems[i].innerHTML != '') {
            TutorialPage.startTutorial(TutorialPage.selectionListItems[i].innerHTML, false, 4);
        }
    })
}

//          UNLOCKS

//CHANGE so that weapon buy unlocks come back
UnlockedStuff = {
    pages : {
        tower_page : [TowerPage.pageButton],
        army_page : [ArmyPage.pageButton, ArmyPage.levelUpButton],
        buy_weapon_page : [BuyWeaponPage.pageButton, BuyWeaponPage.buyerRows[1][0].parentElement, BuyWeaponPage.buyerRows[2][0].parentElement],
    },
}


//          ALL THE PAGES IN ONE PLACE

const body = document.getElementById('body');

const pages = [TowerPage,ArmyPage, BuyCreaturePage, BuyWeaponPage, SettingsPage, BossArmySelectionPage, BossFightPage, BossFightingResultPage, TutorialPage];
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
        HidePages(4);
        pages[currentPage].displayOnLoad();
        SaveToLocalStorage();
        SettingsPage.changeTheme();
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