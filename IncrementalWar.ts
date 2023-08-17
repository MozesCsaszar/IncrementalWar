/*

Created by: Császár Mózes (mozescsaszar@gmail.com)
Code use is only permitted for personal, non-commercial or non-commercial cases. Please don't
use or reuse part of the project in an application released to target audiences greater than
family or close circle of friends.

*/

import Decimal from "break_infinity.js";
import { Army } from "./modules/army";
import { BossFightingResultPage } from "./modules/boss";
import { IArmyComps, StringHash } from "./modules/types";
import { PageClass } from "./modules/base_classes";
import { getHtmlElement, stylizeDecimals } from "./modules/functions";

//A popup window for your inspection needs
const PopupWindow = {
  container: $("#PopupWindowContainer").get(0)!,
  left: -1000,
  top: -1000,
  show(left: number, top: number, content: string) {
    PopupWindow.container.hidden = false;
    PopupWindow.container.innerHTML = content;
    PopupWindow.move(left, top);
  },
  move(left: number, top: number) {
    PopupWindow.container.style.left = left + "5";
    PopupWindow.container.style.top = top + "5";
    PopupWindow.left = left;
    PopupWindow.top = top;
  },
  hide() {
    PopupWindow.container.hidden = true;
  },
};

export class PlayerClass {
  static save(): string {
    throw new Error("Method not implemented.");
  }
  static load(arg0: string | null) {
    throw new Error("Method not implemented.");
  }
  gold: Decimal = new Decimal(25);
  armies: [Army, Army, Army] = [new Army(), new Army(), new Army()];
  inventory: IArmyComps<StringHash<Decimal>> = {
    creatures: {},
    weapons: {}
  };
  static gold: any;
  save() {
    //  save gold
    let saveText = this.gold + "/*/";
    //save inventory
    saveText += Object.keys(this.inventory).length;
    for (const c in this.inventory) {
      const category = c as keyof IArmyComps<never>;
      saveText += "/*/" + category;
      saveText += "/*/" + Object.keys(this.inventory[category]).length;
      for (const item in this.inventory[category]) {
        saveText += "/*/" + item + "/*/" + this.inventory[category][item];
      }
    }
    //  save armies
    saveText += "/*/" + this.armies.length;
    for (let i = 0; i < this.armies.length; i++) {
      saveText += "/*/" + this.armies[i].save();
    }

    return saveText
  }
  load(saveText: string) {
    //split and get ready for loading
    const saveTextArr = saveText.split("/*/");
    let i = 0;
    //load gold
    this.gold = new Decimal(saveText[i]);
    i++;
    //  load inventory
    //reset inventory
    this.inventory = { creatures: {}, weapons: {} };
    let j = Number(saveText[i]);
    let k = 0;
    i++;
    while (j > 0) {
      const category = saveText[i] as keyof IArmyComps<never>;
      i++;
      k = Number(saveText[i]);
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
    j = Number(saveText[i]);
    i++;
    k = 0;
    while (j > 0) {
      i = this.armies[k].load(saveText, i, k);
      k++;
      j--;
    }
  }
}

export const Player = new PlayerClass();

//          ALL THE PAGES IN ONE PLACE

class GameManagerClass {
  saveInterval: undefined;
  currentPage: string;
  pages: StringHash<PageClass>;
  canSave: boolean;
  constructor() {
    this.saveInterval = undefined;
    this.currentPage = "StorePage";
    this.pages = {};
    [TowerPage, ArmyPage, StorePage, SettingsPage, BossArmySelectionPage,
      BossFightingPage, BossFightingResultPage, TutorialPage].forEach(
        (p) => { this.pages[p.name] = p }
      )
    //hide all pages at startup
    for (const page of Object.keys(this.pages)) {
      this.pages[page].hidden = true;
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
    window.addEventListener("load", () => {
      this.openGame();
      this.startSaveInterval();
    });
    //save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
    document.addEventListener("visibilitychange", () => {
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
    localStorage.setItem("lastSavedTime", Date.now() + "");
  }
  //a function to load game from local storage
  loadFromLocalStorage() {
    Player.load(localStorage.getItem("Player")!);
    allThingsStatistics.load(localStorage.getItem("Statistics"));
    UH.load(localStorage.getItem("Unlocks"));
    //load pages
    Object.entries(this.pages).forEach(
      ([key, page]) => { page.load(localStorage.getItem(key)!) }
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
    this.loadOfflineProgress(Date.now() - Number(localStorage.getItem("lastSavedTime")));
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

let interval = setInterval(() => { SettingsPage.displayEveryTick() }, 50);

function HidePages(toShow: string) {
  if (toShow != GM.currentPage) {
    clearInterval(interval);
    GM.pages[GM.currentPage].hidden = true;
    GM.pages[toShow].hidden = false;
    GM.currentPage = toShow;
    interval = setInterval(() => { GM.pages[GM.currentPage].displayEveryTick() }, 50);
    GM.pages[toShow].display();
  }
}
//          THE INTERPAGE STUFF         \\
const goldText = getHtmlElement("#GoldText");

//click event for the continue from offline button
getHtmlElement("#ContinueFromOfflineProgress").addEventListener("click", () => {
  //change current page to be able to use HidePages
  const currentPage = window.localStorage.getItem("currentPage")!;
  getHtmlElement("#OfflinePageContainer").hidden = true;
  getHtmlElement("#PageButtonsContainer").hidden = false;
  goldText.parentElement!.hidden = false;
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
  goldText.innerHTML = stylizeDecimals(Player.gold);
  for (let i = 0; i < TowerPage.Tower.raidedLevels.length; i++) {
    TowerPage.Tower.floors[TowerPage.Tower.raidedLevels[i][0]].levels[TowerPage.Tower.raidedLevels[i][1]].tick(20);
  }
}

setInterval(tick, 50);
