/*

Created by: Császár Mózes (mozescsaszar@gmail.com)
Code use is only permitted for personal, non-commercial or non-commercial cases. Please don't
use or reuse part of the project in an application released to target audiences greater than
family or close circle of friends.

*/

//A popup window for your inspection needs
const PopupWindow = {
  container: document.querySelector("#PopupWindowContainer"),
  left: undefined,
  top: undefined,
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
  getCompareColor(value1, value2, decimal = true) {
    if (decimal) {
      if (value1.gt(value2)) {
        return "red";
      }
      else if (value1.lt(value2)) {
        return "green";
      }
      else {
        return "var(--default-color)";
      }
    }
    else {
      if (value1 == value2) {
        return "var(--default-color)";
      }
      if (value1 > value2) {
        return "red";
      }
      else {
        return "green";
      }
    }
  },
}



//a function to adjust the appearance of decimal numbers (e form and trying to avoid inconsistent numbers messing up the interface, like 48.0000001 instead of 48)
function StylizeDecimals(decimal, floor = false) {
  if (decimal.exponent >= 6) {
    return decimal.mantissa.toFixed(2) + "e" + decimal.exponent;
  }
  if (!floor) {
    if (decimal.exponent > 4) {
      return (decimal.mantissa * Math.pow(10, decimal.exponent)).toFixed(0);
    }
    else {
      return (decimal.mantissa * Math.pow(10, decimal.exponent)).toFixed(Math.min(5 - decimal.exponent, 2), 2);
    }
  }
  else {
    return (decimal.mantissa * Math.pow(10, decimal.exponent)).toFixed(0);
  }

}

const Player = {
  gold: new Decimal(25),
  armies: [new Army(), new Army(), new Army()],
  inventory: {
    creatures: {

    },
    weapons: {

    }
  },
  save() {
    //  save gold
    let saveText = this.gold + "/*/";
    //save inventory
    saveText += Object.keys(this.inventory).length;
    for (category in this.inventory) {
      saveText += "/*/" + category;
      saveText += "/*/" + Object.keys(this.inventory[category]).length;
      for (item in this.inventory[category]) {
        saveText += "/*/" + item + "/*/" + this.inventory[category][item];
      }
    }
    //  save armies
    saveText += "/*/" + this.armies.length;
    for (let i = 0; i < this.armies.length; i++) {
      saveText += "/*/" + this.armies[i].save();
    }

    return saveText
  },
  load(saveText) {
    //split and get ready for loading
    saveText = saveText.split("/*/");
    let i = 0;
    //load gold
    this.gold = new Decimal(saveText[i]);
    i++;
    //  load inventory
    //reset inventory
    delete this.inventory;
    this.inventory = {};
    let j = new Number(saveText[i]);
    let k = 0;
    i++;
    while (j > 0) {
      const category = saveText[i];
      i++;
      k = new Number(saveText[i]);
      i++;
      this.inventory[category] = {};
      while (k > 0) {
        this.inventory[category][saveText[i]] = new Decimal(saveText[i + 1]);
        i += 2;
        k--;
      }
      j--;
    }
    //load armies
    j = new Number(saveText[i]);
    i++;
    k = 0;
    while (j > 0) {
      i = this.armies[k].load(saveText, i, k);
      k++;
      j--;
    }

  }
}

//          ALL THE PAGES IN ONE PLACE

class GameManagerClass {
  constructor() {
    this.saveInterval = undefined;
    this.currentPage = "StorePage";
    this.pages = {};
    [TowerPage, ArmyPage, StorePage, SettingsPage, BossArmySelectionPage,
      BossFightingPage, BossFightingResultPage, TutorialPage].forEach(
        (p) => { this.pages[p.name] = p }
      )
    this.pages = {
      "TowerPage": TowerPage, "ArmyPage": ArmyPage, "StorePage": StorePage, "SettingsPage": SettingsPage, "BossArmySelectionPage": BossArmySelectionPage,
      "BossFightingPage": BossFightingPage, "BossFightingResultPage": BossFightingResultPage, "TutorialPage": TutorialPage,
    };
    //hide all pages at startup
    for (const page of Object.values(this.pages)) {
      page.hidden = true;
    }

    this.canSave = true;

    this.initializeEventListeners();
  }
  startSaveInterval() {
    // this.saveInterval = setInterval(this.SaveToLocalStorage,1000);
  }
  stopSaveInterval() {
    clearInterval(this.saveInterval);
  }
  initializeEventListeners() {
    const this = this;

    window.addEventListener("load", () => {
      this.openGame();
      this.startSaveInterval();
    });
    //save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        this.loadOfflineProgress(Date.now() - Number(window.localStorage.getItem("lastSavedTime")));
        this.startSaveInterval();
      }
      else {
        if (window.localStorage.length != 0) {
          this.saveToLocalStorage();
        }
        this.stopSaveInterval();
      }
    });
    //save the game before closing
    window.addEventListener("beforeunload", () => {
      this.closeGame()
    });
  }
  loadOfflineProgress(nrMiliseconds = 0) {
    const nrSeconds = new Decimal(nrMiliseconds / 1000);
    //calculate gold per second
    const goldPerSecond = TowerPage.Tower.getGoldPerSecond();
    //handle gold
    const totalGold = goldPerSecond.mul(nrSeconds);
    Player.gold = Player.gold.add(totalGold);
  }
  //a function to save game to local storage
  saveToLocalStorage() {
    if (!this.canSave) return;

    localStorage.clear();

    localStorage.setItem("Player", Player.save());
    localStorage.setItem("Statistics", allThingsStatistics.save());
    localStorage.setItem("Unlocks", UH.save());
    Object.entries(this.pages).forEach(
      ([key, page]) => { localStorage.setItem(key, page.save()) }
    );
    localStorage.setItem("currentPage", this.currentPage);
    localStorage.setItem("lastSavedTime", Date.now());
  }
  //a function to load game from local storage
  loadFromLocalStorage() {
    Player.load(localStorage.getItem("Player"));
    allThingsStatistics.load(localStorage.getItem("Statistics"));
    UH.load(localStorage.getItem("Unlocks"));
    //load pages
    Object.entries(this.pages).forEach(
      ([key, page]) => { page.load(localStorage.getItem(key)) }
    );
    //load offline progress
    //  shinaningans to get the current page to display correctly (CHANGE THIS?)
    const a = localStorage.getItem("currentPage");
    if (a == "TowerPage") {
      GB.pageButtons.selected = 1;
      this.currentPage = "ArmyPage";
    }
    else {
      GB.pageButtons.selected = 0;
      this.currentPage = "TowerPage";
    }
    for (let i = 0; i < GB.pageButtons.buttons.length; i++) {
      if (GB.pageButtons.buttons[i].getAttribute("page") == a) {
        GB.pageButtons.buttonClick(i);
      }
    }
    this.loadOfflineProgress(Date.now() - Number(localStorage.getItem("lastSavedTime")), a);
    return true;
  }
  openGame() {
    if (window.localStorage.length != 0) {
      this.loadFromLocalStorage();
    }
    else {
      /*document.getElementById("OfflinePageContainer").hidden = true;
      //UNCOMMENT THIS
      HidePages('SettingsPage');
      this.pages[GM.currentPage].display();*/
      this.saveToLocalStorage();
      this.loadFromLocalStorage();
    }
  }
  closeGame() {
    // this.SaveToLocalStorage();
  }
  resetLocalStorage() {
    this.stopSaveInterval();
    window.localStorage.clear();
    this.saveToLocalStorage();
    this.loadFromLocalStorage();
    this.startSaveInterval();
  }
  toggleCanSave() {
    this.canSave = !this.canSave;
  }
}

const GM = new GameManagerClass();

let interval = setInterval(function () { SettingsPage.displayEveryTick(SettingsPage) }, 50);

function HidePages(toShow) {
  if (toShow != GM.currentPage) {
    clearInterval(interval);
    GM.pages[GM.currentPage].hidden = true;
    GM.pages[toShow].hidden = false;
    GM.currentPage = toShow;
    interval = setInterval(function () { GM.pages[GM.currentPage].displayEveryTick(GM.pages[GM.currentPage]) }, 50);
    GM.pages[toShow].display();
  }
}
//          THE INTERPAGE STUFF         \\
const goldText = document.querySelector("#GoldText");

//click event for the continue from offline button
document.getElementById("ContinueFromOfflineProgress").addEventListener("click", function () {
  //change current page to be able to use HidePages
  currentPage = Number(window.localStorage.getItem("currentPage")) ? 0 : 1;
  document.getElementById("OfflinePageContainer").hidden = true;
  document.getElementById("PageButtonsContainer").hidden = false;
  goldText.parentElement.hidden = false;
  //UNCOMMENT THIS
  HidePages(currentPage);
});

//a function to save game to local storage
// function SaveToLocalStorage() {
//     const localStorage = window.localStorage;
//     localStorage.clear();
//     localStorage.setItem('Player',Player.save());
//     for(let i = 0; i < pages.length; i++) {
//         let text = pages[i].save();
//         localStorage.setItem(page_names[i],text);
//     }
//     localStorage.setItem('Unlockables',UH.save());
//     localStorage.setItem('currentPage',String(currentPage));
//     localStorage.setItem('lastSavedTime',Date.now());
// }

//a function to load game from local storage
// function LoadFromLocalStorage() {
//     const localStorage = window.localStorage;
//     UH.load(localStorage.getItem('Unlockables'));
//     Player.load(localStorage.getItem('Player'));
//     for(let i = 0; i < pages.length; i++) {
//         pages[i].load(localStorage.getItem(page_names[i]));
//     }
//     //load offline progress
//     let a = Number(localStorage.getItem('currentPage'));
//     //hide stuff to show a proper offline load page
//     document.getElementById('PageButtonsContainer').hidden = true;
//     goldText.parentElement.hidden = true;
//     LoadOfflineProgress(Date.now() - Number(localStorage.getItem('lastSavedTime')), a);
// }

// function OpenGame() {
//     if(window.localStorage.length != 0) {
//         LoadFromLocalStorage();
//         document.getElementById('PageButtonsContainer').hidden = false;
//         goldText.parentElement.hidden = false;
//         HidePages(window.localStorage.getItem('currentPage'));
//     }
//     else {
//         console.log('here');
//         document.getElementById("OfflinePageContainer").hidden = true;
//         //UNCOMMENT THIS
//         HidePages(4);
//         pages[currentPage].displayOnLoad();
//         SaveToLocalStorage();
//         SettingsPage.changeTheme();
//     }
// }

// function CloseGame() {
//     if(window.localStorage.length != 0) {
//         SaveToLocalStorage();
//     }
// }

let save_interval;

//load the game on each session when starting up
window.addEventListener("load", () => {
  GM.openGame();
  // save_interval = setInterval(GM.SaveToLocalStorage,1000);
});
//save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
// document.addEventListener('visibilitychange', function() {
//     if (document.visibilityState === 'visible') {
//         let a = Number(window.localStorage.getItem('currentPage'));
//         LoadOfflineProgress(Date.now() - Number(window.localStorage.getItem('lastSavedTime')), a);
//         save_interval = setInterval(SaveToLocalStorage,1000);
//     } else {
//         if(window.localStorage.length != 0) {
//             SaveToLocalStorage();
//         }

//         clearInterval(save_interval);
//     }
// });
//save the game before closing
// window.addEventListener('beforeunload', () => {CloseGame()});

function tick() {
  goldText.innerHTML = StylizeDecimals(Player.gold);
  for (i = 0; i < TowerPage.Tower.raidedLevels.length; i++) {
    TowerPage.Tower.floors[TowerPage.Tower.raidedLevels[i][0]].levels[TowerPage.Tower.raidedLevels[i][1]].tick(20);
  }
}

setInterval(tick, 50);
