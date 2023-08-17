import Decimal from "break_infinity.js";
import { Fight, ButtonGroupClass, PageClass } from "../base_classes";
import { stuff } from "../data";
import { stylizeDecimals, getHtmlElement, getHtmlElementList } from "../functions";
import { Stats, SubStats } from "../stats";
import { PlayerClass, GameManagerClass } from "../declared_classes";
import { BossArmySelectionPage } from "./boss/army_selection";
import { TutorialPage } from "./tutorial";

class ParentTowerLevel {
  width: number;
  height: number;
  top: number;
  left: number;
  capacity: Decimal;
  raidingArmy: number;
  name: string;
  desc: string;
  zIndex: number;
  unlocks: [number, number][];
  unlockedNextLevels: boolean;
  constructor(width: number, height: number, top: number, left: number, zIndex: number, capacity: Decimal, unlocks: [number, number][], name: string, desc: string, raidingArmy: number) {
    this.width = width;
    this.height = height;
    this.top = top;
    this.left = left;
    this.capacity = capacity;
    this.raidingArmy = raidingArmy;
    this.name = name;
    this.desc = desc;
    this.zIndex = zIndex;
    this.unlocks = unlocks;
    //it is to prevent trying to unlock multiple times the unlocks
    this.unlockedNextLevels = false;
  }
}

//the level class that makes up the tower floors (a floor consists of one or more levels)
class TowerLevel extends ParentTowerLevel {
  goldPerPower: Decimal;
  stats: Stats;
  type: string;
  constructor(width: number, height: number, top: number, left: number, zIndex: number, stats: Stats, capacity: Decimal, goldPerPower: Decimal, unlocks: [number, number][] = [], name = "", desc = "", raidingArmy = -1) {
    super(width, height, top, left, zIndex, capacity, unlocks, name, desc, raidingArmy);

    this.goldPerPower = goldPerPower;
    this.stats = stats;
    this.type = "Raid";
  }

  get goldPerSecond() {
    return (Player.armies[this.raidingArmy].size.min(this.capacity)).mul(this.goldPerPower).mul(Player.armies[this.raidingArmy].stats.getPower(this.stats, "Attack", "Defense")).max(new Decimal(0));
  }

  getColor() {
    const defPower = this.stats.getPower(Player.armies[TowerPage.currentArmy].stats, "Defense", "Attack");
    const atkPower = Player.armies[TowerPage.currentArmy].stats.getPower(this.stats, "Attack", "Defense");
    if (atkPower.lt(defPower)) {
      return "var(--disabled-tower-level-background-color)";
    }
    else {
      return "var(--default-tower-level-background-color)";
    }
  }

  tick(nrTicks: number) {
    Player.gold = Player.gold.add(this.goldPerSecond.div(nrTicks));
  }

  getText(floorName: string) {
    return "<b>" + floorName + " - " + this.name + "</b><br>" +
      "<i>Type: " + this.type + "</i><br>" +
      "Raided by: " + (this.raidingArmy == -1 ? "None" : this.raidingArmy + 1) + "<br>" +
      "Defense: " + this.stats.get<SubStats>("Defense").getText() + "<br>" +
      "Capacity: " + stylizeDecimals(this.capacity, true) +
      "<br>" + "Gold per power: " + stylizeDecimals(this.goldPerPower) + "<br>" +
      "Current gold per second: " + (this.raidingArmy == -1 ? "None" : stylizeDecimals(this.goldPerSecond)) + "<br>" +
      "<br><i>" + this.desc + "</i>";
  }

  raid(levelNr: number) {
    /*
        Input:  levelNr: the number of the level in the current floor
        Output: the number of the level this army was raiding before this floor
                -1 if ther was no such army
    */
    //get attacking and defensive power respective to this tower level
    const defPower = this.stats.getPower(Player.armies[TowerPage.currentArmy].stats, "Defense", "Attack");
    const atkPower = Player.armies[TowerPage.currentArmy].stats.getPower(this.stats, "Attack", "Defense");
    //last level raided by same army
    let lastOne = -1;
    if (defPower.lte(atkPower)) {
      //if you try to raid level with same army again, remove raiding army from this level
      if (this.raidingArmy == TowerPage.currentArmy) {
        this.raidingArmy = -1;
        Player.armies[TowerPage.currentArmy].raiding = -1;
        //remove the problematic element from the array which stores the raided places
        TowerPage.Tower.removeRaidedLevel(TowerPage.Tower.currentFloor, levelNr);
        //return the same levelNr as this level
        lastOne = levelNr;
      }
      else {
        //if this army was already raiding, remove previous raid
        if (Player.armies[TowerPage.currentArmy].raiding != -1) {
          lastOne = TowerPage.Tower.removeRaidedLevelByArmy(TowerPage.currentArmy)[1];
        }
        //if the level is already raided, remove it
        if (this.raidingArmy != -1) {
          TowerPage.Tower.changeRaidedLevel(TowerPage.Tower.currentFloor, levelNr, TowerPage.currentArmy);
        }
        else {
          TowerPage.Tower.addRaidedLevel(TowerPage.Tower.currentFloor, levelNr, TowerPage.currentArmy);
        }
        this.raidingArmy = TowerPage.currentArmy;
        Player.armies[TowerPage.currentArmy].raiding = levelNr;
      }
      //unlock new levels
      if (!this.unlockedNextLevels) {
        for (let j = 0; j < this.unlocks.length; j++) {
          const un = this.unlocks[j];
          //* CHANGE THIS (MOVE IT SOMEWHERE ELSE)
          if (un[0] == TowerPage.Tower.currentFloor) {
            TowerPage.towerLevels[un[1]].hidden = false;
          }
          //*/
        }
        this.unlockedNextLevels = true;
      }
    }
    else {
      return false;
    }
    return lastOne;
  }
}

class BossFightLevel extends ParentTowerLevel {
  rewards: any;
  boss: string;
  constructor(width: number, height: number, top: number, left: number, zIndex: number, boss: string, capacity: Decimal, rewards: Decimal, unlocks = [], name = "", desc = "", raidingArmy = -1) {
    super(width, height, top, left, zIndex, capacity, unlocks, name, desc, raidingArmy);

    this.rewards = rewards;
    this.boss = boss;
  }

  get type() {
    return stuff.bosses[this.boss].type;
  }

  get stats() {
    return stuff.bosses[this.boss].stats;
  }

  getColor() {
    const defPower = stuff.bosses[this.boss].stats.getPower(Player.armies[TowerPage.currentArmy].stats, "Defense", "Attack");
    const atkPower = Player.armies[TowerPage.currentArmy].stats.getPower(stuff.bosses[this.boss].stats, "Attack", "Defense");
    if (atkPower.lt(defPower)) {
      return "var(--disabled-tower-level-background-color)";
    }
    else {
      return "var(--default-tower-level-background-color)";
    }
  }

  getText(floorName: string) {
    return "<b>" + floorName + " - " + this.name + "</b><br>" +
      "<i>Type: " + this.type + "</i><br><br>" +
      stuff.bosses[this.boss].name + "<br>" +
      stuff.bosses[this.boss].stats.getText() + "<br>" +
      "<i>" + stuff.bosses[this.boss].desc + "</i><br><br>" +
      "Capacity:" + stylizeDecimals(this.capacity, true) + "<br><br>" +
      "<i>" + this.desc + "</i>";
  }

  tick() { }

  raid(levelNr: number) {
    getHtmlElement("#PageButtonsContainer").hidden = true;
    getHtmlElement("#PageTopResourcesContainer").hidden = true;
    BossArmySelectionPage.fight = new Fight([this.boss], 1, false)
    GM.hidePages("BossArmySelectionPage");

    return false;
  }

}

class TowerFloor {
  levels: ParentTowerLevel[];
  name: string;
  desc: string;
  raidedLevels: [number, number][];
  constructor(levels: ParentTowerLevel[] = [], name = "", desc = "", raidedLevels: [number, number][] = []) {
    this.levels = levels;
    this.name = name;
    this.desc = desc;
    this.raidedLevels = raidedLevels;
  }

  getText() {
    return "<b>" + this.name + "</b><br>" +
      "<br><i>" + this.desc + "</i>";
  }
}

export class TowerClass {
  floors: TowerFloor[];
  raidedLevels: [number, number, number][];
  currentFloor: number;
  constructor() {
    this.floors = [];
    this.raidedLevels = [];
    this.currentFloor = 0;
    this.initializeFloors();
  }
  initializeFloors() {
    this.floors[0] = new TowerFloor([new TowerLevel(100, 50, 500, 100, 0, new Stats(["Defense"], [new SubStats(new Decimal(0.5))]), new Decimal(500), new Decimal(1), [[0, 1], [0, 2]], "Sewers 1", "Still laughing, you go inside the building only to realize that the stink is even worse than what you thought it would be. Now you start to feel sorry for the guy who tried to organize a date here. <br> Going one step further, you find yourselves in knee-high dirty water hoping that the situation will change for the better in the next few minutes."),
    new TowerLevel(100, 50, 449, 49, 3, new Stats(["Defense"], [new SubStats(new Decimal(1))]), new Decimal(250), new Decimal(2), [[0, 3], [0, 4]], "Sewers 2", "You took the trapdoor on the left side of the first level. The stench is no better, but at least some new strange moss is inhabiting the left wall."),
    new TowerLevel(100, 50, 449, 151, 3, new Stats(["Defense"], [new SubStats(new Decimal(1))]), new Decimal(250), new Decimal(2), [[0, 3], [0, 5]], "Sewers 3", "You took the trapdoor on the right side of the first level. The stench is no better, but at least some new strange moss is inhabiting the right wall."),
    new TowerLevel(120, 50, 423, 115, 2, new Stats(["Defense"], [new SubStats(new Decimal(3.4))]), new Decimal(450), new Decimal(15), [[0, 6]], "Sewers 4", "After taking one door to the back, you find yourself in a moss-filled place. Instead of the wetness of water, you are greeted with the slimeiness of... well, of slime."),
    new TowerLevel(30, 50, 385, 75, 3, new Stats(["Defense"], [new SubStats(new Decimal(2))]), new Decimal(600), new Decimal(5), [[1, 0]], "Sewers 5", "Another trapdoor in the left portion of the ceiling, who would've guessed? At least the place is not wet anymore and... well, it's way hotter and the stink is worse... You got comfort for your legs, but at what price?"),
    new TowerLevel(30, 50, 385, 229, 3, new Stats(["Defense"], [new SubStats(new Decimal(2))]), new Decimal(600), new Decimal(5), [[1, 0]], "Sewers 6", "Another trapdoor in the right portion of the ceiling, who would've guessed? At least the place is not wet anymore and... well, it's way hotter and the stink is worse... You got comfort for your legs, but at what price?"),
    new TowerLevel(80, 50, 397, 162, 1, new Stats(["Defense"], [new SubStats(new Decimal(5.5))]), new Decimal(900), new Decimal(37), [[0, 7]], "Sewers 7", "The slime coating becomes more consistent, sticky and concentrated. Surprising no one, this is even more unconfortable than it was."),
    new TowerLevel(30, 70, 300, 220, 0, new Stats(["Defense"], [new SubStats(new Decimal(9.5))]), new Decimal(1200), new Decimal(87), [[0, 8]], "Sewers 8", "The stink intensifies to an unheard-of level when you enter the room. The slime pools on the ground, knee-high in places, ankle high in others. It is dripping from the ceiling as well, along from the edges of the spiral staircase leading ever upwards. Some railing would come in handy, but you can't get everything in life..."),
    new BossFightLevel(30, 70, 230, 220, 0, "Slime", new Decimal(1200), new Decimal(40), [], "Sewer's Top", "The topmost level of the sewers. It is lit with candles. Due to the slight topwards incline and the slight upwards arc of the floor, the slime is only running in two rivers next to the walls.  You don't want to find out what lurks in the shadows, but will have to do so eventually..."),],
      "Sewers", "Wet and stinky and the odor gets worse the higher you go. Before the entrance stands a lone sign: 'EXTREME DANGER OF DEATH (also not an ideal place for a date, trust me)'");
    this.floors[1] = new TowerFloor([new TowerLevel(100, 50, 300, 100, 0, new Stats(["Defense"], [new SubStats(new Decimal(5))]), new Decimal(300), new Decimal(2), [], "The Slums", "When you venture beyond the sewers, the place looks like a big slum, full of giant rats.")], "Rat-haven", "A place where the rats thrive.")

  }

  getGoldPerSecond() {
    let goldPerSecond = new Decimal(0);
    for (let i = 0; i < TowerPage.Tower.raidedLevels.length; i++) {
      goldPerSecond = goldPerSecond.add(TowerPage.Tower.floors[TowerPage.Tower.raidedLevels[i][0]].levels[TowerPage.Tower.raidedLevels[i][1]].goldPerSecond);
    }
    return goldPerSecond;
  }

  removeRaidedLevel(floorNr: number, levelNr: number) {
    let found = undefined;
    for (let j = 0; j < this.raidedLevels.length; j++) {
      if (this.raidedLevels[j][0] == floorNr && this.raidedLevels[j][1] == levelNr) {
        found = this.raidedLevels.splice(j, 1)[0];
        break;
      }
    }
    if (found != undefined) {
      this.floors[found[0]].levels[found[1]].raidingArmy = -1;
    }
  }
  //returns removed level
  removeRaidedLevelByArmy(armyNr: number) {
    let found = undefined;

    for (let j = 0; j < this.raidedLevels.length; j++) {
      if (this.raidedLevels[j][2] == armyNr) {
        found = this.raidedLevels.splice(j, 1)[0];
        break;
      }
    }
    if (found != undefined) {
      this.floors[found[0]].levels[found[1]].raidingArmy = -1;
    }
    return found;
  }
  addRaidedLevel(floorNr: number, levelNr: number, armyNr: number) {
    this.raidedLevels.push([floorNr, levelNr, armyNr]);
  }
  changeRaidedLevel(floorNr: number, levelNr: number, newArmyNr: number) {
    for (let j = 0; j < this.raidedLevels.length; j++) {
      if (this.raidedLevels[j][0] == floorNr && this.raidedLevels[j][1] == levelNr) {
        this.raidedLevels[j][2] = newArmyNr;
        break;
      }
    }
  }
  save() {
    let saveText = String(this.currentFloor);
    saveText += "/*/" + String(this.raidedLevels.length);
    for (let i = 0; i < this.raidedLevels.length; i++) {
      saveText += "/*/" + this.raidedLevels[i][0] + "/*/" + this.raidedLevels[i][1] + "/*/" + this.raidedLevels[i][2];
    }
    return saveText;
  }
  //returns the modified i
  load(saveText: string[], i: number) {
    this.currentFloor = Number(saveText[i]); i++;
    const len = Number(saveText[i]); i++;
    for (let ii = 0; ii < len; ii++, i += 3) {
      this.addRaidedLevel(Number(saveText[i]), Number(saveText[i + 1]), Number(saveText[i + 2]));
    }
    return i;
  }
}

class TowerSelectArmyButtonsClass extends ButtonGroupClass {
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }

  buttonClick(buttonNr: number) {
    super.buttonClick(buttonNr);
    TowerPage.changeArmy(buttonNr);
  }
}

export class TowerPageClass extends PageClass {
  Tower: any;
  towerFloors: HTMLElement[] = getHtmlElementList(".tower_part");
  towerLevels: HTMLElement[] = getHtmlElementList(".tower_level");
  towerInfo: HTMLElement = getHtmlElement("#TowerPageTowerInfo");
  pageButton: HTMLElement = getHtmlElement("#TowerPageButton");
  changeArmyButtons: TowerSelectArmyButtonsClass;
  currentArmy: number;
  armyInfo: HTMLElement = getHtmlElement("#TowerPageArmyInfo");

  constructor(name: string, gM: GameManagerClass) {
    super(name, gM);

    //reverse tower floors
    let i = 0;
    let j = this.towerFloors.length;
    while (i < j) {
      [this.towerFloors[i], this.towerFloors[j]] = [this.towerFloors[j], this.towerFloors[i]];
      i++;
      j--;
    }
    //remove undefined element from start
    this.towerFloors.shift();
    this.towerLevels;
    this.towerInfo;
    this.pageButton;
    this.changeArmyButtons = new TowerSelectArmyButtonsClass(
      ".toggle_button_container.page_tower", ".toggle_button",
      { "borderColor": "var(--selected-toggle-button-border-color)" },
      { "borderColor": "var(--default-toggle-button-border-color)" }
    );
    this.currentArmy = 0;
    this.armyInfo;
    this.Tower = new TowerClass();

    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() {
    //initialize TOWER FLOOR hover functions
    for (let i = 0; i < this.towerFloors.length; i++) {
      //floors that are not yet implemented have their stuff here (mouseenter)
      if (i >= this.Tower.floors.length) {
        //set cursor style for floors that are not implemented yet.
        this.towerFloors[i].style.cursor = "default";
        this.towerFloors[i].addEventListener("mouseenter", () => {
          this.towerInfo.innerHTML = "Under developement, sorry. :<)";
        });
      }
      //implemented floors have mouseenter and click here
      else {
        //on mouseenter display new floor
        this.towerFloors[i].addEventListener("mouseenter", () => {
          this.displayFloor(i);
          //if the current floor is not selected
          if (i != this.Tower.currentFloor) {
            this.towerFloors[i].style.backgroundColor = "var(--hover-tower-floor-background-color)";
          }
          else {
            this.towerFloors[i].style.backgroundColor = "var(--hover-selected-tower-floor-background-color)";
          }
        });
        //on click change color and currentFloor
        this.towerFloors[i].addEventListener("click", () => {
          this.towerFloors[this.Tower.currentFloor].style.background = "var(--default-tower-floor-background-color)";
          this.Tower.currentFloor = i;
          this.towerFloors[i].style.background = "var(--selected-tower-floor-background-color)";
        });
      }
      //on mouseleave, revert to current floor
      this.towerFloors[i].addEventListener("mouseleave", () => {
        this.displayFloor(this.Tower.currentFloor);
        if (i != this.Tower.currentFloor) {
          this.towerFloors[i].style.backgroundColor = "var(--default-tower-floor-background-color)";
        }
        else {
          this.towerFloors[i].style.backgroundColor = "var(--selected-tower-floor-background-color)";
        }

      });

    }

    //TOWER LEVEL click, enter and leave events and new atribute
    for (let i = 0; i < this.towerLevels.length; i++) {
      //display new level stuff on mouseenter
      this.towerLevels[i].addEventListener("mouseenter", () => {
        this.displayLevelText(this.Tower.currentFloor, i);
      });
      //on mouseleave, display current floor
      this.towerLevels[i].addEventListener("mouseleave", () => {
        this.displayFloorText();
      });
      //on click, change army that is raiding it
      this.towerLevels[i].addEventListener("click", () => {
        const level = this.Tower.floors[this.Tower.currentFloor].levels[i];
        const lastOne = level.raid(i);
        //if raid was successfull, then change appearances around
        if (!(lastOne === false)) {
          //if there was a last one that this army raided, then remove visuals from that army
          if (lastOne != -1) {
            this.displayLevel(this.Tower.currentFloor, lastOne);
          }
          this.displayLevel(this.Tower.currentFloor, i);
          this.displayLevelText(this.Tower.currentFloor, i);
        }
      });
      this.towerLevels[i].setAttribute("contenttext", "");
    }
  }
  //called when new save gets loaded
  displayOnLoad() {
    this.towerFloors[this.Tower.currentFloor].style.backgroundColor = "var(--selected-tower-floor-background-color)";
    //set the context text to the value you need on levels raided
    for (let i = 0; i < this.Tower.raidedLevels.length; i++) {
      const path = this.Tower.raidedLevels[i];
      this.towerLevels[path[1]].setAttribute("contenttext", this.Tower.floors[path[0]].levels[path[1]].raidingArmy + 1);
    }
  }
  display() {
    this.changeArmy(this.currentArmy);
    this.displayFloor(this.Tower.currentFloor);
    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Tower Page");
      TutorialPage.startTutorial("Tower Page", true, "TowerPage");
    }
    this.timesVisited++;
  }
  displayEveryTick() { }
  //called when a save text is needed
  save() {
    let saveText = super.save();

    saveText += "/*/" + this.currentArmy + "/*/";
    //save raided floors and raided levels
    saveText += this.Tower.save();

    saveText += "/*/" + this.changeArmyButtons.save();

    return saveText;
  }
  //called when you need to get values from a saveText
  load(saveText: string) {
    const saveTextArr = saveText.split("/*/");
    let loadI = super.load(saveTextArr);
    let i = loadI ? loadI : 0;
    this.currentArmy = Number(saveTextArr[i]); i++;
    i = this.Tower.load(saveTextArr, i);
    i += this.changeArmyButtons.load(saveTextArr, i);

    //display changes with on load function
    this.displayOnLoad();
    return i;
  }
  changeArmy(changeTo: number) {
    this.currentArmy = changeTo;
    this.armyInfo.innerHTML = Player.armies[this.currentArmy].getText(true);
    this.displayFloor(this.Tower.currentFloor);
  }
  displayFloor(floorNr: number) {
    //hide which is not needed, then show which is needed
    let j = this.Tower.floors[floorNr].levels.length;
    while (j < this.towerLevels.length) {
      this.towerLevels[j].hidden = true;
      j++;
    }
    j = 0;
    while (j < this.Tower.floors[floorNr].levels.length) {
      //only show if it is unlocked
      this.towerLevels[j].hidden = false;
      j++;
    }
    //color by availability and set position
    j = 0;
    while (j < this.Tower.floors[floorNr].levels.length) {
      this.displayLevel(floorNr, j);
      j++;
    }
    //display floor info
    this.displayFloorText();
  }
  displayFloorText() {
    this.towerInfo.innerHTML = this.Tower.floors[this.Tower.currentFloor].getText();
  }
  displayLevel(floorNr: number, levelNr: number) {
    const level = this.Tower.floors[floorNr].levels[levelNr];
    const content_text = level.raidingArmy == -1 ? " " : String(level.raidingArmy + 1);
    const htmlLevel = this.towerLevels[levelNr];
    htmlLevel.setAttribute("contenttext", content_text);
    htmlLevel.innerHTML = content_text;
    htmlLevel.style.background = level.getColor();
    htmlLevel.style.width = level.width;
    htmlLevel.style.height = level.height;
    htmlLevel.style.top = level.top;
    htmlLevel.style.left = level.left;
    htmlLevel.style.zIndex = level.zIndex;
  }
  displayLevelText(floorNr: number, levelNr: number) {
    const level = this.Tower.floors[floorNr].levels[levelNr];
    this.towerInfo.innerHTML = level.getText(this.Tower.floors[this.Tower.currentFloor].name, floorNr, levelNr);
  }
}
