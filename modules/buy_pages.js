//          BUY CREATURE PAGE

class Buyer {
    borderColors = {
        'gold' : 'gold',
    };

    constructor(type, name, currency = 'gold', nr_bought = new Decimal(0)) {
        this.type = type;
        this.name = name;
        this.nr_bought = nr_bought;
        this.currency = currency;
    }

    buy(buy_nr) {
        let price = stuff[this.type][this.name].get_price(this.nr_bought, buy_nr);
        if(Player[this.currency].gte(price)) {
            Player[this.currency] = Player[this.currency].sub(price);
            //when adding a new element
            if(!Player.inventory[this.type][this.name]) {
                ArmyPage.elementEquipState[this.type][this.name] = 0;
                Player.inventory[this.type][this.name] = new Decimal(0);
            }
            Player.inventory[this.type][this.name] = Player.inventory[this.type][this.name].add(buy_nr);
            this.nr_bought = this.nr_bought.add(buy_nr);
            Unlockables.unlock(['buyer',this.name], this.nr_bought);
            return true;
        }
        return false;
    }

    get_price(buy_nr) {
        return stuff[this.type][this.name].get_price(this.nr_bought, buy_nr);
    }
}


const BuyCreaturePage = {
    pageButton : undefined,
    container : undefined,
    //Entry format: nr_available, name, buy_button
    buyerRows : [],
    buyers : [new Buyer('creatures','Human')],
    buyNumberButtons : [],
    buyNumberValues : [new Decimal(1),new Decimal(10),new Decimal(100),new Decimal(1000)],
    currentBuyNumberButton : 0,
    infoText : undefined,
    timesVisited:0,
    displayOnLoad() {
        BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'var(--selected-toggle-button-border-color)';
    },
    display() {
        BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'var(--selected-toggle-button-border-color)';
        for(let j = 0; j < BuyCreaturePage.buyers.length; j++) {
            BuyCreaturePage.buyerRows[j][2].innerHTML = 'Buy: ' + StylizeDecimals(BuyCreaturePage.buyers[j].get_price(BuyCreaturePage.buyNumberValues[BuyCreaturePage.currentBuyNumberButton]));
        }
        if(BuyCreaturePage.timesVisited == 0) {
            TutorialPage.unlockTutorial('Buy Creature Page');
            TutorialPage.startTutorial('Buy Creature Page', true, 2);
        }
        this.timesVisited++;
    },
    displayEveryTick() {
        for(let i = 0; i < BuyCreaturePage.buyerRows.length; i++) {
            let name = BuyCreaturePage.buyers[i].name;
            BuyCreaturePage.buyerRows[i][0].innerHTML = (Player.inventory.creatures[name] ? '(' + StylizeDecimals(Player.inventory.creatures[name], true) + ')' : '(0)');
        }
        
    },
    save() {
        let save_text = BuyCreaturePage.currentBuyNumberButton + '/*/' + BuyCreaturePage.buyerRows.length;

        for(let i = 0; i < BuyCreaturePage.buyerRows.length; i++) {
            save_text += '/*/' + BuyCreaturePage.buyers[i].nr_bought;
        }
        save_text += '/*/' + BuyCreaturePage.timesVisited;
        return save_text;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        BuyCreaturePage.currentBuyNumberButton = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        for(let j = 0; j < len; j++) {
            BuyCreaturePage.buyers[j].nr_bought = new Decimal(save_text[i]);
            i++;
        }
        BuyCreaturePage.timesVisited = Number(save_text[i]);
        i++;
        BuyCreaturePage.displayOnLoad();
    },
}

BuyCreaturePage.pageButton = document.querySelector('#BuyCreaturePageButton');
BuyCreaturePage.container = document.querySelector('#BuyCreaturePageContainer');
let buyer_rows1 = document.querySelectorAll("#BuyCreaturePageContainer > .nr_name_button_flex_container > .nr_name_button_container > .nr_available_div");
let buyer_rows2 = document.querySelectorAll("#BuyCreaturePageContainer > .nr_name_button_flex_container > .nr_name_button_container > .element_name_div");
let buyer_rows3 = document.querySelectorAll("#BuyCreaturePageContainer > .nr_name_button_flex_container > .nr_name_button_container > .complementary_button");
for(let i = 0; i < buyer_rows1.length; i++) {
    BuyCreaturePage.buyerRows[i] = [buyer_rows1[i], buyer_rows2[i], buyer_rows3[i]];
}
BuyCreaturePage.buyNumberButtons = document.querySelectorAll(".creature_buy_number");
BuyCreaturePage.infoText = document.querySelector('#BuyCreaturePageInfo');
//initialize creature buyer's mouse envents
for(let i = 0; i < BuyCreaturePage.buyerRows.length; i++) {
    BuyCreaturePage.buyerRows[i][2].addEventListener('click',  () => {
        if(BuyCreaturePage.buyers[i].buy(BuyCreaturePage.buyNumberValues[BuyCreaturePage.currentBuyNumberButton])) {
            BuyCreaturePage.display();
        }
    });
}
//mouse events for the buy creature's buyer divs
for(let i = 0; i < BuyCreaturePage.buyerRows.length; i++) {
    BuyCreaturePage.buyerRows[i][2].addEventListener('mouseenter',  () => {
        BuyCreaturePage.infoText.innerHTML = stuff['creatures'][BuyCreaturePage.buyers[i].name].get_text();
    });
    BuyCreaturePage.buyerRows[i][2].addEventListener('mouseleave',  () => {
        BuyCreaturePage.infoText.innerHTML = '';
    });
}
//click functions for the buy creature number toggles
for(let i = 0; i < BuyCreaturePage.buyNumberButtons.length; i++) {
    BuyCreaturePage.buyNumberButtons[i].addEventListener('click',  () => {
        if(BuyCreaturePage.currentBuyNumberButton != i) {
            BuyCreaturePage.buyNumberButtons[i].style.borderColor = 'var(--selected-toggle-button-border-color)';
            BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'var(--default-toggle-button-border-color)';
            BuyCreaturePage.currentBuyNumberButton = i;
            BuyCreaturePage.display();
        }
        
    });
}




//          BUY WEAPON PAGE
const BuyWeaponPage = {
    pageButton : undefined,
    container : undefined,
    buyerRows : [],
    buyers : [new Buyer('weapons','Knife'), new Buyer('weapons','Dagger'),new Buyer('weapons','Longsword')],
    buyNumberButtons : [],
    buyNumberValues : [new Decimal(1),new Decimal(10),new Decimal(100),new Decimal(1000)],
    currentBuyNumberButton : 0,
    infoText : undefined,
    timesVisited: 0,
    displayOnLoad() {
        BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'var(--selected-toggle-button-border-color)';
    },
    display() {
        BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'var(--selected-toggle-button-border-color)';
        for(let j = 0; j < BuyWeaponPage.buyerRows.length; j++) {
            BuyWeaponPage.buyerRows[j][2].innerHTML = 'Buy: ' + StylizeDecimals(BuyWeaponPage.buyers[j].get_price(BuyWeaponPage.buyNumberValues[BuyWeaponPage.currentBuyNumberButton]));
        }
        if(this.timesVisited == 0) {
            TutorialPage.unlockTutorial('Buy Weapon Page');
            TutorialPage.startTutorial('Buy Weapon Page', true, 3);
        }
        this.timesVisited++;
    },
    displayEveryTick() {
        for(let i = 0; i < BuyWeaponPage.buyerRows.length; i++) {
            let name = BuyWeaponPage.buyers[i].name;
            BuyWeaponPage.buyerRows[i][0].innerHTML = (Player.inventory.weapons[name] ? '(' + StylizeDecimals(Player.inventory.weapons[name], true) + ')' : '(0)');
        }
    },
    save() {
        let save_text = BuyWeaponPage.currentBuyNumberButton + '/*/' + BuyWeaponPage.buyerRows.length;

        for(let i = 0; i < BuyWeaponPage.buyerRows.length; i++) {
            save_text += '/*/' + BuyWeaponPage.buyers[i].nr_bought;
        }
        save_text +=  '/*/' + String(BuyWeaponPage.timesVisited);
        return save_text;
    },
    load(save_text) {
        save_text = save_text.split('/*/');
        let i = 0;
        BuyWeaponPage.currentBuyNumberButton = Number(save_text[i]);
        i++;
        let len = Number(save_text[i]);
        i++;
        for(let j = 0; j < len; j++) {
            BuyWeaponPage.buyers[j].nr_bought = new Decimal(save_text[i]);
            i++;
        }
        BuyWeaponPage.timesVisited = Number(save_text[i]);
        i++;
        BuyWeaponPage.displayOnLoad();
    },
}

BuyWeaponPage.pageButton = document.querySelector('#BuyWeaponPageButton');
BuyWeaponPage.container = document.querySelector('#BuyWeaponPageContainer');
buyer_rows1 = document.querySelectorAll("#BuyWeaponPageContainer > .nr_name_button_flex_container > .nr_name_button_container > .nr_available_div");
buyer_rows2 = document.querySelectorAll("#BuyWeaponPageContainer > .nr_name_button_flex_container > .nr_name_button_container > .element_name_div");
buyer_rows3 = document.querySelectorAll("#BuyWeaponPageContainer > .nr_name_button_flex_container > .nr_name_button_container > .complementary_button");
for(let i = 0; i < buyer_rows1.length; i++) {
    BuyWeaponPage.buyerRows[i] = [buyer_rows1[i], buyer_rows2[i], buyer_rows3[i]];
}
BuyWeaponPage.buyNumberButtons = document.querySelectorAll(".weapon_buy_number");
BuyWeaponPage.infoText = document.querySelector('#BuyWeaponPageInfo');
//initialize weapon buyer mouse envets
for(let i = 0; i < BuyWeaponPage.buyerRows.length; i++) {
    BuyWeaponPage.buyerRows[i][2].addEventListener('click',  () => {
        //if make a succeful purchase
        if(BuyWeaponPage.buyers[i].buy(BuyWeaponPage.buyNumberValues[BuyWeaponPage.currentBuyNumberButton])) {
            BuyWeaponPage.display();
        }
    });
}
//mouse events for the buy weapon's buyer divs
for(let i = 0; i < BuyWeaponPage.buyerRows.length; i++) {
    BuyWeaponPage.buyerRows[i][2].addEventListener('mouseenter',  () => {
        BuyWeaponPage.infoText.innerHTML = stuff['weapons'][BuyWeaponPage.buyers[i].name].get_text();
    });
    BuyWeaponPage.buyerRows[i][2].addEventListener('mouseleave',  () => {
        BuyWeaponPage.infoText.innerHTML = '';
    });
}
//click functions for the buy creature number toggles
for(let i = 0; i < BuyWeaponPage.buyNumberButtons.length; i++) {
    BuyWeaponPage.buyNumberButtons[i].addEventListener('click',  () => {
        if(BuyWeaponPage.currentBuyNumberButton != i) {
            BuyWeaponPage.buyNumberButtons[i].style.borderColor = 'var(--selected-toggle-button-border-color)';
            BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'var(--default-toggle-button-border-color)';
            BuyWeaponPage.currentBuyNumberButton = i;
            BuyWeaponPage.display();
        }
        
    });
}