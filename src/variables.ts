import Decimal from "break_infinity.js";
import { Army } from "./army";
import { HashLike, PageClass } from "./base_classes";
import { ArmyCompsI, StringHashT } from "./types";
import { allThingsStatistics } from "./statistics";
import { UH } from "./unlocks";
import { TowerPageClass } from "./pages/tower";
import { ArmyPageClass } from "./pages/army";
import { BossArmySelectionPageClass } from "./pages/boss/army_selection";
import { BossFightingPageClass } from "./pages/boss/fighting";
import { BossFightingResultPageClass } from "./pages/boss/result";
import { TutorialPageClass } from "./pages/tutorial";
import { SettingsPageClass } from "./pages/settings";
import { StorePageClass } from "./pages/store";
import { GameBodyClass } from "./game_body";

export const localStorage = window.localStorage;

class PlayerClass extends HashLike {
  gold: Decimal = new Decimal(25);
  armies: Army[] = [];
  inventory: ArmyCompsI<StringHashT<Decimal>> = {
    creatures: {},
    weapons: {}
  };

  constructor(gM: GameManagerClass) {
    super();

    for (let i = 0; i < 3; i++) {
      this.armies.push(new Army(gM));
    }
  }

  getElementCount(type: keyof ArmyCompsI<never>, name: string): Decimal {
    return this.inventory[type][name];
  }
  setElementCount(type: keyof ArmyCompsI<never>, name: string, newAmount: Decimal): void {
    this.inventory[type][name] = newAmount;
  }
  getArmy(index: number): Army {
    return this.armies[index];
  }
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
    this.gold = new Decimal(saveTextArr[i]);
    i++;
    //  load inventory
    //reset inventory
    this.inventory = { creatures: {}, weapons: {} };
    let j = Number(saveTextArr[i]);
    let k = 0;
    i++;
    while (j > 0) {
      const category = saveTextArr[i] as keyof ArmyCompsI<never>;
      i++;
      k = Number(saveTextArr[i]);
      i++;
      this.inventory[category] = {};
      while (k > 0) {
        this.inventory[category][saveTextArr[i]] = new Decimal(saveTextArr[i + 1]);
        i += 2;
        k--;
      }
      j--;
    }
    //load armies
    j = Number(saveTextArr[i]);
    i++;
    k = 0;
    while (j > 0) {
      i = this.armies[k].load(saveTextArr[i], i, k);
      k++;
      j--;
    }
  }
}

class GameManagerClass {
  saveInterval?: NodeJS.Timeout;
  renderInterval?: NodeJS.Timeout;
  currentPage: string = "StorePage";
  pages: StringHashT<PageClass>;
  canSave: boolean;
  Player: PlayerClass;
  TowerPage = new TowerPageClass("TowerPage", this);
  ArmyPage: ArmyPageClass = new ArmyPageClass("ArmyPage", this);
  StorePage: StorePageClass = new StorePageClass("StorePage", this);
  SettingsPage = new SettingsPageClass('SettingsPage', this);
  BossArmySelectionPage = new BossArmySelectionPageClass("BossArmySelectionPage", this);
  BossFightingPage = new BossFightingPageClass("BossFightingPage", this);
  BossFightingResultPage = new BossFightingResultPageClass("BossFightingResultPage", this);
  TutorialPage: TutorialPageClass = new TutorialPageClass("TutorialPage", this);
  GB: GameBodyClass = new GameBodyClass(this);
  constructor() {
    this.pages = {
      "TowerPage": this.TowerPage,
      "ArmyPage": this.ArmyPage,
      "StorePage": this.StorePage,
      "SettingsPage": this.SettingsPage,
      "BossArmySelectionPage": this.BossArmySelectionPage,
      "BossFightingPage": this.BossFightingPage,
      "BossFightingResultPage": this.BossFightingResultPage,
      "TutorialPage": this.TutorialPage,
    };
    //hide all pages at startup
    for (const page of Object.keys(this.pages)) {
      this.pages[page].hidden = true;
    }

    this.canSave = true;

    this.Player = new PlayerClass(this);


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
        this.loadOfflineProgress(Date.now() - Number(localStorage.getItem("lastSavedTime")));
        this.startSaveInterval();
      }
      else {
        if (localStorage.length != 0) {
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
    const goldPerSecond = this.TowerPage.Tower.getGoldPerSecond();
    //handle gold
    const totalGold = goldPerSecond.mul(nrSeconds);
    this.Player.gold = this.Player.gold.add(totalGold);
  }
  //a function to save game to local storage
  saveToLocalStorage() {
    if (!this.canSave) return;

    localStorage.clear();

    localStorage.setItem("Player", this.Player.save());
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
    this.Player.load(localStorage.getItem("Player")!);
    allThingsStatistics.load(localStorage.getItem("Statistics")!);
    UH.load(localStorage.getItem("Unlocks")!);
    //load pages
    Object.entries(this.pages).forEach(
      ([key, page]) => { page.load(localStorage.getItem(key)!) }
    );
    //load offline progress
    //  shinaningans to get the current page to display correctly (CHANGE THIS?)
    const a = localStorage.getItem("currentPage");
    if (a == "TowerPage") {
      this.GB.pageButtons.selected = 1;
      this.currentPage = "ArmyPage";
    }
    else {
      this.GB.pageButtons.selected = 0;
      this.currentPage = "TowerPage";
    }
    for (let i = 0; i < this.GB.pageButtons.buttons.length; i++) {
      if (this.GB.pageButtons.buttons[i].getAttribute("page") == a) {
        this.GB.pageButtons.buttonClick(i);
      }
    }
    this.loadOfflineProgress(Date.now() - Number(localStorage.getItem("lastSavedTime")));
    return true;
  }
  openGame() {
    if (localStorage.length != 0) {
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
    localStorage.clear();
    this.saveToLocalStorage();
    this.loadFromLocalStorage();
    this.startSaveInterval();
  }
  toggleCanSave() {
    this.canSave = !this.canSave;
  }
  hidePages(toShow: string) {
    if (toShow != this.currentPage) {
      clearInterval(this.renderInterval);
      this.pages[this.currentPage].hidden = true;
      this.pages[toShow].hidden = false;
      this.currentPage = toShow;

      this.pages[toShow].display();
    }
  }
}

export const GM = new GameManagerClass();
