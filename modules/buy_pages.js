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
            if(!Player.inventory[this.type][this.name]) {
                ArmyPage.selectButtons[this.type][ArmyPage.nameToButtonNumber[this.type][this.name]].hidden = false;
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
    buyButtons : [],
    buyers : [new Buyer('creatures','Human')],
    buyNumberButtons : [],
    buyNumberValues : [new Decimal(1),new Decimal(10),new Decimal(100),new Decimal(1000)],
    currentBuyNumberButton : 0,
    infoText : undefined,
    displayOnLoad() {
        BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'blue';
    },
    display() {
        for(let j = 0; j < BuyCreaturePage.buyers.length; j++) {
            if(!BuyCreaturePage.buyButtons[j].parentElement.hidden) {
                BuyCreaturePage.buyButtons[j].innerHTML = 'Buy: ' + StylizeDecimals(BuyCreaturePage.buyers[j].get_price(BuyCreaturePage.buyNumberValues[BuyCreaturePage.currentBuyNumberButton]));
            }
        }
    },
    displayEveryTick() {
        for(let i = 0; i < BuyCreaturePage.buyButtons.length; i++) {
            if(!BuyCreaturePage.buyButtons[i].parentElement.hidden) {
                let name = BuyCreaturePage.buyers[i].name;
                BuyCreaturePage.buyButtons[i].nextElementSibling.innerHTML = (Player.inventory.creatures[name] ? '(' + StylizeDecimals(Player.inventory.creatures[name], true) + ')' : '(0)');
            }
        }
        
    },
    save() {
        let save_text = BuyCreaturePage.currentBuyNumberButton + '/*/' + BuyCreaturePage.buyButtons.length;

        for(let i = 0; i < BuyCreaturePage.buyButtons.length; i++) {
            save_text += '/*/' + BuyCreaturePage.buyers[i].nr_bought;
        }
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
        BuyCreaturePage.displayOnLoad();
    },
}

BuyCreaturePage.pageButton = document.querySelector('#BuyCreaturePageButton');
BuyCreaturePage.container = document.querySelector('#BuyCreaturePageContainer');
BuyCreaturePage.buyButtons = document.querySelectorAll(".buy_creature");
BuyCreaturePage.buyNumberButtons = document.querySelectorAll(".creature_buy_number");
BuyCreaturePage.infoText = document.querySelector('#BuyCreaturePageInfo');
//initialize creature buyer's mouse envents
for(let i = 0; i < BuyCreaturePage.buyers.length; i++) {
    BuyCreaturePage.buyButtons[i].addEventListener('click',  () => {
        if(BuyCreaturePage.buyers[i].buy(BuyCreaturePage.buyNumberValues[BuyCreaturePage.currentBuyNumberButton])) {
            BuyCreaturePage.display();
        }
    });
}
//mouse events for the buy creature's buyer divs
for(let i = 0; i < BuyCreaturePage.buyers.length; i++) {
    BuyCreaturePage.buyButtons[i].parentElement.addEventListener('mouseenter',  () => {
        BuyCreaturePage.infoText.hidden = false;
        BuyCreaturePage.infoText.innerHTML = stuff['creatures'][BuyCreaturePage.buyers[i].name].get_text();
    });
    BuyCreaturePage.buyButtons[i].parentElement.addEventListener('mouseleave',  () => {
        BuyCreaturePage.infoText.hidden = true;
    });
}
//click functions for the buy creature number toggles
for(let i = 0; i < BuyCreaturePage.buyNumberButtons.length; i++) {
    BuyCreaturePage.buyNumberButtons[i].addEventListener('click',  () => {
        if(BuyCreaturePage.currentBuyNumberButton != i) {
            BuyCreaturePage.buyNumberButtons[i].style.borderColor = 'blue';
            BuyCreaturePage.buyNumberButtons[BuyCreaturePage.currentBuyNumberButton].style.borderColor = 'orangered';
            BuyCreaturePage.currentBuyNumberButton = i;
            BuyCreaturePage.display();
        }
        
    });
}




//          BUY WEAPON PAGE
const BuyWeaponPage = {
    pageButton : undefined,
    container : undefined,
    buyButtons : [],
    buyers : [new Buyer('weapons','Knife'), new Buyer('weapons','Dagger'),new Buyer('weapons','Longsword')],
    buyNumberButtons : [],
    buyNumberValues : [new Decimal(1),new Decimal(10),new Decimal(100),new Decimal(1000)],
    currentBuyNumberButton : 0,
    infoText : undefined,
    displayOnLoad() {
        BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'blue';
    },
    display() {
        for(let j = 0; j < BuyWeaponPage.buyers.length; j++) {
            if(!BuyWeaponPage.buyButtons[j].parentElement.hidden) {
                BuyWeaponPage.buyButtons[j].innerHTML = 'Buy: ' + StylizeDecimals(BuyWeaponPage.buyers[j].get_price(BuyWeaponPage.buyNumberValues[BuyWeaponPage.currentBuyNumberButton]));
            }
        }
    },
    displayEveryTick() {
        for(let i = 0; i < BuyWeaponPage.buyButtons.length; i++) {
            if(!BuyWeaponPage.buyButtons[i].parentElement.hidden) {
                let name = BuyWeaponPage.buyers[i].name;
                BuyWeaponPage.buyButtons[i].nextElementSibling.innerHTML = (Player.inventory.weapons[name] ? '(' + StylizeDecimals(Player.inventory.weapons[name], true) + ')' : '(0)');
            }
        }
    },
    save() {
        let save_text = BuyWeaponPage.currentBuyNumberButton + '/*/' + BuyWeaponPage.buyButtons.length;

        for(let i = 0; i < BuyWeaponPage.buyButtons.length; i++) {
            save_text += '/*/' + BuyWeaponPage.buyers[i].nr_bought;
        }
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
        BuyWeaponPage.displayOnLoad();
    },
}

BuyWeaponPage.pageButton = document.querySelector('#BuyWeaponPageButton');
BuyWeaponPage.container = document.querySelector('#BuyWeaponPageContainer');
BuyWeaponPage.buyButtons = document.querySelectorAll(".buy_weapon");
BuyWeaponPage.buyNumberButtons = document.querySelectorAll(".weapon_buy_number");
BuyWeaponPage.infoText = document.querySelector('#BuyWeaponPageInfo');
//initialize weapon buyer mouse envets
for(let i = 0; i < BuyWeaponPage.buyers.length; i++) {
    BuyWeaponPage.buyButtons[i].addEventListener('click',  () => {
        //if make a succeful purchase
        if(BuyWeaponPage.buyers[i].buy(BuyWeaponPage.buyNumberValues[BuyWeaponPage.currentBuyNumberButton])) {
            BuyWeaponPage.display();
        }
    });
}
//mouse events for the buy weapon's buyer divs
for(let i = 0; i < BuyWeaponPage.buyers.length; i++) {
    BuyWeaponPage.buyButtons[i].parentElement.addEventListener('mouseenter',  () => {
        BuyWeaponPage.infoText.hidden = false;
        BuyWeaponPage.infoText.innerHTML = stuff['weapons'][BuyWeaponPage.buyers[i].name].get_text();
    });
    BuyWeaponPage.buyButtons[i].parentElement.addEventListener('mouseleave',  () => {
        BuyWeaponPage.infoText.hidden = true;
    });
}
//click functions for the buy creature number toggles
for(let i = 0; i < BuyWeaponPage.buyNumberButtons.length; i++) {
    BuyWeaponPage.buyNumberButtons[i].addEventListener('click',  () => {
        if(BuyWeaponPage.currentBuyNumberButton != i) {
            BuyWeaponPage.buyNumberButtons[i].style.borderColor = 'blue';
            BuyWeaponPage.buyNumberButtons[BuyWeaponPage.currentBuyNumberButton].style.borderColor = 'orangered';
            BuyWeaponPage.currentBuyNumberButton = i;
            BuyWeaponPage.display();
        }
        
    });
}