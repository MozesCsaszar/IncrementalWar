import { PageClass, Fight, ButtonGroupClass } from "../../base_classes";
import { stuff } from "../../data";
import { BossFightingPage } from "./fighting";
import { TowerPage } from "../tower";
import { TutorialPage } from "../tutorial";
import { GM, Player } from "../../variables";
import { GameManagerClass } from "../../declared_classes";

class BossSelectArmyButtonsClass extends ButtonGroupClass {
  number: number;
  selected: number;
  buttons: any;
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object, number: number) {
    containerIdentifier += ".n" + String(number);
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);

    this.number = number;
    this.selected = -1;
  }
  showButton(buttonNr: number) {
    super.showButton(buttonNr);
    this.buttons[buttonNr].hidden = false;
  }
  hideButton(buttonNr: number) {
    super.hideButton(buttonNr);
    this.buttons[buttonNr].hidden = true;
  }
  deselect() {
    if (this.selected != -1) {
      for (const key in this.defaultStyle) {
        //TODO: Investigate Styles
        // this.buttons[this.selected].style[key] = this.defaultStyle[key];
      }
      this.selected = -1;
    }
  }

  buttonClick(buttonNr: number) {
    //reset old armies
    if (BossArmySelectionPage.fight!.selectedArmies[this.number] != -1) {
      for (let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
        if (this.number != k) {
          BossArmySelectionPage.armySelects[k].showButton(buttonNr);
        }
      }
    }
    //if you select the same army again
    if (buttonNr == this.selected) {
      BossArmySelectionPage.fight!.selectedArmies[this.number] = -1;
      BossArmySelectionPage.armyInfos[this.number].innerHTML = "No army to be seen here.";
    }
    //if you selected a new army
    else {
      BossArmySelectionPage.fight!.selectedArmies[this.number] = buttonNr;
      BossArmySelectionPage.armyInfos[this.number].innerHTML = Player.armies[buttonNr].getFightingStatsText();
      for (let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
        if (k != this.number) {
          BossArmySelectionPage.armySelects[k].hideButton(buttonNr);
        }
      }
    }

    //do button group things
    if (this.selected == buttonNr) {
      this.deselect();
    }
    else {
      if (this.selected != -1) {
        for (const key in this.defaultStyle) {
          //TODO: Investigate Styles
          // this.buttons[this.selected].style[key] = this.defaultStyle[key];
        }
      }
      this.selectButton(buttonNr);
    }
    BossArmySelectionPage.showHideFightButton();
  }
}


export class BossArmySelectionPageClass extends PageClass {
  fight?: Fight;
  nrArmySelects: number;
  armySelects: BossSelectArmyButtonsClass[];
  armyInfos: HTMLElement[];
  nrArmies: number;
  bossInfo: HTMLElement;
  difficultyGauge: HTMLElement;
  backButton: HTMLElement;
  startFightButton: HTMLElement;
  timesVisited: number = 0;
  constructor(name: string, gM: GameManagerClass) {
    super(name, gM);

    this.nrArmies = 3;
    this.nrArmySelects = 3;
    //build armySelects component
    this.armySelects = [];
    for (let i = 0; i < this.nrArmies; i++) {
      this.armySelects.push(new BossSelectArmyButtonsClass(
        ".toggle_button_container.page_boss_select_army", ".toggle_button",
        { "borderColor": "var(--selected-toggle-button-border-color)" },
        { "borderColor": "var(--default-toggle-button-border-color)" }, i
      ));
    }
    this.armyInfos = $(".select_boss_army_info").toArray();
    this.bossInfo = $("#BossInfo").get(0)!;
    this.difficultyGauge = $("#BossFightDifficultyGauge").get(0)!;
    this.fight = undefined;
    this.backButton = $("#BackFromBossArmySelectionPage").get(0)!;
    this.startFightButton = $("#StartBossFightButton").get(0)!;

    this.initializeEventListeners();
  }
  initializeEventListeners() {
    //start fight button
    this.startFightButton.addEventListener("click", () => {
      //reset boss fight page
      BossFightingPage.reset();
      BossFightingPage.fight = this.fight;
      for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
        if (this.fight!.selectedArmies[i] != -1) {
          const result = TowerPage.Tower.removeRaidedLevelByArmy(this.fight!.selectedArmies[i]);
          if (result != undefined) {
            BossFightingPage.armiesRemovedFrom.push();
          }
        }
      }
      this.reset();
      GM.hidePages("BossFightingPage");
    });
    //Back to tower page button
    this.backButton.addEventListener("click", () => {
      //get page buttons back
      $("#PageButtonsContainer").show();
      $("#PageTopResourcesContainer").show();
      //return to tower page
      GM.hidePages("TowerPage");
    });
  }
  displayOnLoad() { }
  display() {
    //show necessary army selects
    for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
      this.armySelects[i].container.parentElement!.hidden = false;
      this.armySelects[i].deselect();
    }
    //hide ones that are not useable in current fight
    for (let i = this.fight!.maxSelectibleArmies; i < this.nrArmySelects; i++) {
      this.armySelects[i].container.parentElement!.hidden = true;
    }
    this.bossInfo.innerHTML = stuff.bosses[this.fight!.bosses[0]].getText();
    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Boss Fighting Army Selection Page");
      TutorialPage.startTutorial("Boss Fighting Army Selection Page", true, "BossArmySelectionPage");
    }
    this.timesVisited++;
  }
  save() {
    const saveText = super.save();

    return saveText;
  }
  load(saveText: string) {
    const saveTextArr = saveText.split("/*/");
    const i = super.load(saveTextArr);
    return i;
  }
  showHideFightButton() {
    for (const i in this.fight!.selectedArmies) {
      if (this.fight!.selectedArmies[i] != -1 &&
        Player.armies[this.fight!.selectedArmies[i]].creature != "None") {
        this.startFightButton.hidden = false;
        return;
      }
    }
    this.startFightButton.hidden = true;
  }
  reset() {
    this.startFightButton.hidden = true;
    for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
      this.armySelects[i].selectButton(this.fight!.selectedArmies[i]);
      this.armyInfos[i].innerHTML = "No army to be seen here.";
    }
  }
}
