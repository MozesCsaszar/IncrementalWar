/*

Created by: Császár Mózes (mozescsaszar@gmail.com)
Code use is only permitted for personal, non-commercial or non-commercial cases. Please don't
use or reuse part of the project in an application released to target audiences greater than
family or close circle of friends.

*/

import Decimal from "break_infinity.js";
import { Army } from "./modules/army";
import { ArmyCompsI, StringHashT } from "./modules/types";
import { PageClass } from "./modules/base_classes";
import { getHtmlElement, stylizeDecimals } from "./modules/functions";
import { ArmyPage } from "./modules/pages/army";
import { BossArmySelectionPage } from "./modules/pages/boss/army_selection";
import { BossFightingPage } from "./modules/pages/boss/fighting";
import { BossFightingResultPage } from "./modules/pages/boss/result";
import { TowerPage } from "./modules/tower_page";

export class PlayerClass {
  static save(): string {
    throw new Error("Method not implemented.");
  }
  static load(arg0: string | null) {
    throw new Error("Method not implemented.");
  }
  gold: Decimal = new Decimal(25);
  armies: [Army, Army, Army] = [new Army(), new Army(), new Army()];
  inventory: ArmyCompsI<StringHashT<Decimal>> = {
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
      const category = c as keyof ArmyCompsI<never>;
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
      const category = saveText[i] as keyof ArmyCompsI<never>;
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
  LoadOfflineProgress(arg0: number) {
    throw new Error("Method not implemented.");
  }
  saveInterval?: number;
  renderInterval?: number;
  currentPage: string = "StorePage";
  pages: StringHashT<PageClass>;
  canSave: boolean;
  constructor() {
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
  startRenderInterval(page: string) {
    this.renderInterval = setInterval(() => { this.pages[page].displayEveryTick() }, 50);
  }
  stopRenderInterval() {
    clearInterval(this.renderInterval);
    this.renderInterval = undefined;
  }
  swapRenderPage(newPage: string) {
    this.stopRenderInterval();
    this.startRenderInterval(newPage);
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
  hidePages(toShow: string) {
    if (toShow != this.currentPage) {
      clearInterval(interval);
      this.pages[this.currentPage].hidden = true;
      this.pages[toShow].hidden = false;
      this.currentPage = toShow;

      this.pages[toShow].display();
    }
  }
}

export const GM = new GameManagerClass();

let interval = setInterval(() => { SettingsPage.displayEveryTick() }, 50);
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
  GM.hidePages(currentPage);
});

//load the game on each session when starting up
window.addEventListener("load", () => {
  GM.openGame();
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
